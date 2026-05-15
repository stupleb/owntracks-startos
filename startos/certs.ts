import { X509Certificate } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { sdk } from './sdk'

// Where mosquitto's TLS material is written inside the daemon's rootfs.
// Regenerated on every start — the platform's getSslCertificate is cached
// per hostname set, so callers can ask freely.
export const TLS_DIR = '/mosquitto/config/tls'

type Effects = Parameters<Parameters<typeof sdk.setupMain>[0]>[0]['effects']

function isSelfSigned(pem: string): boolean {
  const cert = new X509Certificate(pem)
  return cert.subject === cert.issuer
}

// The SDK returns a 3-tuple of PEM strings — order is undocumented. Pick
// the self-signed cert as the root, treat the rest as the server chain.
// `certfile` gets leaf + intermediate(s) only; clients already have the
// root in their trust store.
function splitChain(chain: readonly string[]): {
  serverChain: string
  rootCa: string
} {
  const trimmed = chain.map((p) => p.trim()).filter(Boolean)
  const root = trimmed.find(isSelfSigned)
  if (!root) {
    throw new Error('No self-signed cert found in chain returned by SDK')
  }
  const nonRoot = trimmed.filter((p) => p !== root)
  return {
    serverChain: nonRoot.join('\n') + '\n',
    rootCa: root + '\n',
  }
}

async function fetchChain(
  effects: Effects,
  hostnames: string[],
): Promise<ReturnType<typeof splitChain>> {
  const chain = await sdk.getSslCertificate(effects, hostnames).const()
  return splitChain(chain)
}

export async function writeBrokerTls(
  effects: Effects,
  rootfs: string,
  hostnames: string[],
): Promise<void> {
  const { serverChain } = await fetchChain(effects, hostnames)
  const key = await sdk.getSslKey(effects, { hostnames })

  const tlsDir = `${rootfs}${TLS_DIR}`
  await mkdir(tlsDir, { recursive: true })
  await writeFile(`${tlsDir}/server-fullchain.pem`, serverChain)
  await writeFile(`${tlsDir}/server-key.pem`, key)
}

export async function readCaCert(effects: Effects): Promise<string> {
  const hostnames =
    (await sdk.serviceInterface
      .getOwn(effects, 'mqtt', (i) =>
        i?.addressInfo?.format('hostname-info').map((h) => h.hostname),
      )
      .const()) ?? []
  const { rootCa } = await fetchChain(effects, hostnames)
  return rootCa
}
