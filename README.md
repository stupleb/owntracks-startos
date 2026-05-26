<p align="center">
  <img src="icon.svg" alt="OwnTracks Logo" width="21%">
</p>

# OwnTracks on StartOS

> **Upstream repos:**
> - <https://github.com/owntracks/recorder>
> - <https://github.com/owntracks/frontend>
> - <https://github.com/eclipse/mosquitto>

[OwnTracks](https://owntracks.org/) is a private location tracking system. Phones publish location updates over MQTT to a broker you control; a recorder stores the history, and a web frontend renders it on a map. No third-party servers, no telemetry.

This StartOS package bundles three containers — `eclipse-mosquitto`, `owntracks/recorder`, and `owntracks/frontend` — so the whole stack runs on a single server.

> [!NOTE]
> This package now provides the full end-to-end OwnTracks experience: MQTT broker over TLS on external port 28883, signed by the StartOS server's root CA, with per-device credentials managed via the Actions tab. The frontend image is still pinned to a ~2-year-old tagged release — see [Limitations](#limitations).

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Configuration Management](#configuration-management)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [TLS Certificate Model](#tls-certificate-model)
- [Actions (StartOS UI)](#actions-startos-ui)
- [Backups and Restore](#backups-and-restore)
- [Health Checks](#health-checks)
- [Dependencies](#dependencies)
- [Limitations](#limitations)
- [Contributing](#contributing)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

| Daemon       | Image                          | Purpose                                    |
| ------------ | ------------------------------ | ------------------------------------------ |
| `mosquitto`  | `eclipse-mosquitto:2.0.22`     | MQTT broker                                |
| `recorder`   | `owntracks/recorder:1.0.1-43`  | Subscribes to MQTT, persists track history |
| `frontend`   | `owntracks/frontend:2.15.3`    | Web map UI                                 |

| Property      | Value                |
| ------------- | -------------------- |
| Architectures | x86_64, aarch64      |

Startup order: `mosquitto → recorder → frontend`. Each daemon waits for the previous one's readiness check.

---

## Volume and Data Layout

Single `main` volume, partitioned by subpath:

| Subpath              | Mount Point                  | Purpose                                |
| -------------------- | ---------------------------- | -------------------------------------- |
| `mosquitto/data`     | `/mosquitto/data`            | Mosquitto persistence database         |
| `mosquitto/logs`     | `/mosquitto/logs`            | Mosquitto logs                         |
| `mosquitto/auth`     | `/mosquitto/config/auth`     | Hashed password file + ACL             |
| `recorder/store`     | `/store`                     | Recorder track history                 |
| `recorder/config`    | `/config`                    | Recorder runtime config                |
| `store.json`         | (read by package code only)  | Internal package state — recorder creds + device list |

The `mosquitto.conf`, server cert (`server-fullchain.pem`), and server key (`server-key.pem`) all live inside the container rootfs and are regenerated on each start — the cert and key come from `sdk.getSslCertificate` / `sdk.getSslKey`. The passwd and ACL files are regenerated from `store.json` on each start: one entry per device in the user's device list, plus the internal `recorder` user.

---

## Installation and First-Run Flow

On install the package generates a single piece of state: a random 32-character password for the internal `recorder` user (stored in `store.json`). The MQTT broker's TLS cert and key are fetched from the StartOS platform — see [TLS Certificate Model](#tls-certificate-model) — so there is no CA generation step and no cert material is created in the volume.

To get a phone publishing, run the **Add Device** action to mint a username and password, install the StartOS server's root CA on the phone (via the **Download CA Certificate** action, unless the device already trusts it), and point the OwnTracks app at the MQTT (TLS) interface.

---

## Configuration Management

No user-facing configuration. The broker has three listeners:

- `1883` on `127.0.0.1` — plain, loopback only, used by the bundled recorder.
- `8883` on `0.0.0.0` (IPv4) — TLS, NATed by StartOS to external port **28883**.
- `8883` on `::` (IPv6) — TLS, present inside the container but not externally NATed (see [Limitations](#limitations)).

The mosquitto config, passwd file, ACL, and server cert are all generated from package state (`store.json` + interface hostnames) on each start.

---

## Network Access and Interfaces

| Interface  | Internal port | External port | Protocol     | Purpose                                            |
| ---------- | ------------- | ------------- | ------------ | -------------------------------------------------- |
| Web UI     | 80            | assigned      | HTTP         | OwnTracks map view in the browser                  |
| MQTT (TLS) | 8883          | **28883**     | Raw TCP+TLS  | Phone apps publish location updates (mqtts scheme) |

The MQTT external port is intentionally **not** 8883: we don't squat on the IANA MQTT-TLS port so other StartOS packages can use it if they need to.

**Access methods:**

- LAN IP with the external port (e.g. `mqtts://192.168.0.10:28883`)
- `<hostname>.local` with the external port
- Tor `.onion` address
- Custom domains (if configured)

Each address that appears for the MQTT interface is also written into the server cert's SAN list. The recorder API (8083) and the MQTT plain listener (1883) stay loopback-only.

> [!NOTE]
> StartOS NATs the external port to the container **over IPv4 only** for raw-TCP-TLS interfaces. Confirmed: HTTP-based StartOS services (Jellyfin, Nextcloud, etc.) *are* reachable over IPv6 because the platform's HTTP reverse-proxy is dual-stack; raw-TCP services like MQTT don't get the same treatment. mDNS resolution of `<hostname>.local` returns both A and AAAA records (the AAAA is the host's own link-local), so clients whose resolver picks v6 first hit `ECONNREFUSED` on the MQTT port — there's no v6 endpoint to NAT to. Workaround: use the LAN IPv4 address directly. Worth filing with Start9 as a platform request: "extend raw-TCP-TLS NAT to IPv6."

---

## TLS Certificate Model

The broker's TLS cert is provisioned by StartOS — there is no package-private CA:

- On each start the package calls `sdk.getSslCertificate(effects, mqttHostnames)` and `sdk.getSslKey(...)`. The cert + key are signed by the **StartOS server's root CA**, the same CA that signs HTTP interface certs.
- The cert is written to the mosquitto container's rootfs as `server-fullchain.pem` and consumed as the broker's `certfile`. There is no `cafile` line — phones don't present client certs.
- StartOS handles cert rotation. When hostnames change (custom domain added, etc.), `setupMain` re-runs and the new cert is fetched.
- **CA cert exposure to users:** the `download-ca-cert` action returns the platform root CA as PEM. Devices that already trust the StartOS UI already trust this broker — no extra install needed. Devices that never browse StartOS need to install this CA once.

iOS clients may need to enable "Use Custom security policy" and, depending on which hostname they connect to, may need to disable "Validate Domain name". Android clients install the CA via Settings → Security → "Install from storage".

---

## Actions (StartOS UI)

| Action                  | Purpose                                                  |
| ----------------------- | -------------------------------------------------------- |
| Download CA Certificate | Returns the StartOS server's root CA as copyable PEM. Required for any phone that doesn't already trust this server. |
| Add Device              | Prompts for a device name, generates a 24-char password, registers the credential, and returns username + password for the phone app. |
| Remove Device           | Drop-down of existing devices; removes the selected one. Hidden when no devices exist. |
| List Devices            | Shows every device credential (username + masked password) currently registered. |

Modifying the device list triggers a mosquitto restart so the new ACL and passwd file take effect. Active phone connections drop and reconnect.

---

## Backups and Restore

**Included in backup:**

- `main` volume — covers all mosquitto state, recorder history, and recorder config.

**Restore behavior:** Volume is fully restored before the service starts.

---

## Health Checks

| Check          | Method                  | Notes                                |
| -------------- | ----------------------- | ------------------------------------ |
| MQTT Broker    | Port listening (1883)   | Loopback listener (auth + TLS on 8883 are also active but not health-checked separately) |
| Recorder       | Port listening (8083)   | Loopback listener                    |
| Web Interface  | Port listening (80)     | Exposed via Web UI interface         |

---

## Dependencies

None. The MQTT broker is bundled.

---

## Limitations

1. **IPv6 routing for the MQTT TLS interface is not exposed by StartOS.** Confirmed asymmetry: StartOS proxies HTTP interfaces (Jellyfin, Nextcloud, etc.) over both IPv4 *and* IPv6, but NATs raw-TCP-TLS interfaces over IPv4 only. mDNS still publishes the host's AAAA record. Clients whose resolver prefers v6 (some Android OwnTracks builds) get `ECONNREFUSED` on `<hostname>.local:28883`. iOS/desktop clients prefer the A record and work fine. Workaround: use the LAN IPv4 address. Fix would need to come from Start9 — extend raw-TCP-TLS routing to IPv6.
2. **Server cert SAN tracks interfaces reactively.** Adding a custom domain through StartOS triggers a `setupMain` re-run, which fetches a fresh cert covering the new hostname before mosquitto restarts.
3. **Device list changes restart mosquitto.** Active phone connections drop and reconnect — fine for occasional admin work, would be noisy if you edit devices constantly.
4. **Frontend version is old.** `owntracks/frontend:2.15.3` is the most recent tagged release on Docker Hub, but it dates from ~2 years ago. A future bump may switch to `nightly` or a forked maintained image.
5. **OwnTracks HTTP mode not supported, by design.** The package only exposes MQTT (raw TCP and over WebSocket) — both authenticated by the broker. HTTP mode would require putting an auth proxy in front of the recorder's unauthenticated `/pub` endpoint, which buys nothing meaningful over the WebSocket-MQTT path for a self-hosted home user.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for build instructions and development workflow.

---

## Quick Reference for AI Consumers

```yaml
package_id: owntracks
images:
  mosquitto: eclipse-mosquitto:2.0.22
  recorder:  owntracks/recorder:1.0.1-43
  frontend:  owntracks/frontend:2.15.3
architectures: [x86_64, aarch64]
volumes:
  main:
    mosquitto/data:    /mosquitto/data
    mosquitto/logs:    /mosquitto/logs
    mosquitto/auth:    /mosquitto/config/auth
    recorder/store:    /store
    recorder/config:   /config
    store.json:        (internal package state)
ports:
  ui:       80     # exposed (frontend, HTTP, StartOS-terminated TLS)
  mqtt_tls: 8883   # internal port (mosquitto, service-terminated TLS); external port 28883
  mqtt:     1883   # internal only (mosquitto)
  recorder: 8083   # internal only
ipv6: not exposed externally for the MQTT TLS interface (platform limitation)
tls:
  source:  sdk.getSslCertificate(effects, mqttHostnames)
  ca:      StartOS server's root CA (same as web UI)
dependencies: none
startos_managed_env_vars:
  recorder:
    OTR_HOST: 127.0.0.1
    OTR_PORT: 1883
    OTR_USER: recorder
    OTR_PASS: <generated on install, stored in store.json>
  frontend:
    SERVER_HOST: 127.0.0.1
    SERVER_PORT: 8083
actions:
  download-ca-cert: returns the StartOS server's root CA as copyable PEM
  add-device:       prompt for name, generate password, register credential
  remove-device:    select-and-delete a device credential
  list-devices:     show all registered device credentials
```
