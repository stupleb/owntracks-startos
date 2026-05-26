# OwnTracks

OwnTracks lets you keep a private history of your own location. Phones publish location updates over MQTT to a broker running on your StartOS server; the recorder stores the history, and a web frontend renders it on a map.

## What you get on StartOS

- **MQTT broker** (`eclipse-mosquitto`) — listens on external port **28883** over TLS, signed by your StartOS server's root CA.
- **Recorder** (`owntracks/recorder`) — subscribes to the broker, persists tracks.
- **Web frontend** (`owntracks/frontend`) — map view of every device's recorded tracks.

## Setup checklist for each phone

1. **Trust the CA.** If this is not a user who has trusted the Root CA, then do that here. Run the **Download CA Certificate** action, save the PEM as `startos-ca.crt`, install on the phone.
2. **Create a credential.** Run **Add Device** — give it a unique name, copy the username and password it returns. Lean towards naming for a device rather than a user. i.e. `matt-phone`, `matt-tab`… to allow for multiple devices per person cleanly.
3. **Open the OwnTracks app** and switch to MQTT mode. The exact settings depend on your phone — pick the section that matches.

   > **Tip — smoothest path:** If you've assigned a public domain to the **MQTT (WebSocket)** interface in the Interfaces tab, the URL lands on port 443 with a Let's Encrypt cert that phones already trust — no CA install needed, no extra iOS toggles. The platform sections below cover both that public-domain case and the LAN-only case.

   #### iPhone / iPad (iOS)

   On iOS the raw-TCP MQTT path runs into Local Network permission issues that aren't worth fighting. **Use WebSocket mode.**

   - **Mode:** MQTT
   - **Host:** address from the **MQTT (WebSocket)** interface in the StartOS UI (use your custom domain if you've set one up — see note at the end of this section)
   - **Port:** as shown (`443` for a public custom domain, otherwise the LAN port)
   - **WebSocket:** **on**
   - **TLS:** on
   - **Username / Password:** from step 2

   If you're connecting to a LAN address (not a public domain with a Let's Encrypt cert), also enable **Use Custom security policy** and disable **Validate Domain name** in the OwnTracks TLS settings. With a public LE-cert domain, both stay at defaults.

   #### Android

   Either path works. WebSocket is simpler — no CA install needed when you have a public custom domain.

   **Recommended: WebSocket**

   - **Mode:** MQTT
   - **Host:** address from the **MQTT (WebSocket)** interface (custom domain or LAN)
   - **Port:** as shown (`443` for a public custom domain, otherwise the LAN port)
   - **WebSocket:** on
   - **TLS:** on
   - **Username / Password:** from step 2

   **Alternative: raw TCP MQTT (LAN only)**

   - **Host:** address from the **MQTT (TLS)** interface (LAN IP or `.local` hostname)
   - **Port:** `28883`
   - **WebSocket:** off
   - **TLS:** on
   - **Username / Password:** from step 2

   The raw-TCP path requires the StartOS CA from step 1 installed on the phone, and only works on LAN — there's no public-domain routing for it.

The app should connect and start publishing. Open the **Web UI** interface in StartOS to see the device on the map. As you add users-devices, these will appear in this map, but also in individual apps as "Friends".

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
