# OwnTracks

OwnTracks lets you keep a private history of your own location. Phones publish location updates over MQTT to a broker running on your StartOS server; the recorder stores the history, and a web frontend renders it on a map.

## What you get on StartOS

- **MQTT broker** (`eclipse-mosquitto`) — listens on external port **28883** over TLS, signed by your StartOS server's root CA.
- **Recorder** (`owntracks/recorder`) — subscribes to the broker, persists tracks.
- **Web frontend** (`owntracks/frontend`) — map view of every device's recorded tracks.

## Setup checklist for each phone

1. **Trust the CA.** Run the **Download CA Certificate** action, save the PEM as `startos-ca.crt`, install on the phone. Skip if the device already trusts the StartOS UI's certs.
2. **Create a credential.** Run **Add Device** — give it a unique name, copy the username and password it returns.
3. **Open the OwnTracks app** and switch to MQTT mode. Enter:
   - **Host:** the address shown in the **MQTT (TLS)** interface in the StartOS UI (your LAN IP or `<hostname>.local` — see "Hostname caveat" below)
   - **Port:** `28883`
   - **WebSocket:** off
   - **TLS:** on
   - **Username:** the name from step 2
   - **Password:** the password from step 2
4. **iOS-specific:** enable **Use Custom security policy**. If you connect via a hostname not in the cert SAN, also disable **Validate Domain name**.

The app should connect and start publishing. Open the **Web UI** interface to see the device on the map.

## Hostname caveat (worth reading before you debug)

The MQTT TLS interface is reachable in two ways:

| Connection path | Works on |
|---|---|
| LAN IPv4 (e.g. `192.168.0.10`) | Everything. Always reliable. |
| `<hostname>.local` | Desktops, iOS, most Linux. Some Android OwnTracks versions fail here. |

StartOS handles HTTP services (Jellyfin, Nextcloud, etc.) with a dual-stack reverse proxy — they're reachable over both IPv4 and IPv6, so `<hostname>.local` always works in browsers. Raw-TCP-TLS services like MQTT take a different path: the platform NATs them over IPv4 only. mDNS still publishes the host's IPv6 link-local, so a resolver that picks v6 first will try to connect to an address that has no listener for our port and get `ECONNREFUSED`. Most clients (iOS, desktops) prefer IPv4 here and work fine. Some Android builds prefer IPv6 and fail. Workaround: use the LAN IPv4 address directly.

## Managing devices

- **List Devices** — show every registered credential.
- **Remove Device** — drop a credential. The phone using it loses access on the next broker restart (automatic).

Adding or removing a device restarts the MQTT broker, which briefly drops active phone connections. They reconnect automatically.

## Verifying TLS from a desktop

```sh
openssl s_client -CAfile startos-ca.crt -connect <hostname-or-ip>:28883 < /dev/null 2>&1 | grep -E "Verify return code|subject="
```

Expected: `Verify return code: 0 (ok)` and a subject matching one of your StartOS hostnames.

## Documentation

- [OwnTracks documentation](https://owntracks.org/booklet/) — phone-app setup, MQTT message format, recorder API.
- [StartOS Packaging Guide](https://docs.start9.com/packaging) — how this package is built.

## Limitations

- **No IPv6 for the MQTT interface.** Platform limitation, see "Hostname caveat" above.
- **Some Android OwnTracks versions silently fail to publish** even though the app reports success. The broker accepts the connection and SUBSCRIBE, but no PUBLISH packets arrive. Workaround: try iOS, a different Android version, or check Android battery-optimization settings for the OwnTracks app.
- **Frontend is on an older tag.** `owntracks/frontend:2.15.3` is the last tagged stable release upstream (~2 years old).
