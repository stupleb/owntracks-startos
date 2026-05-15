# CLAUDE.md

See [CONTRIBUTING.md](CONTRIBUTING.md) for the doc map and contribution workflow.

## Operating rules

- This package bundles three upstream containers (`eclipse-mosquitto`, `owntracks/recorder`, `owntracks/frontend`). When changing image tags or container behavior, update both `README.md` (developer-facing) and `instructions.md` (user-facing) in the same change.
- TLS for the MQTT broker comes from the **StartOS platform CA** via `sdk.getSslCertificate` / `sdk.getSslKey`. Do not reintroduce a package-private CA — phones either already trust the platform CA (via the StartOS UI) or install it once via the `download-ca-cert` action.
- The MQTT (TLS) external port is intentionally pinned to a non-standard high number (`28883`) so we don't squat on IANA's `8883`. The internal port mosquitto listens on is still `8883`.
- The MQTT (WebSocket) interface is HTTP-routed by StartOS (`protocol: 'http'` with implicit TLS termination at the edge), which buys us dual-stack v6 routing. Don't change it to raw TCP — the asymmetry between StartOS's HTTP and raw-TCP NAT is the whole reason it exists.
- The ACL grants every authenticated user full `owntracks/#` read+write. We tried per-device topic-prefix scoping; it breaks because the OwnTracks phone app's "Username" (topic prefix) is a separate field from the MQTT auth username, so per-prefix ACL silently denies legitimate publishes.
- Action metadata visibility: avoid making it dynamic by reading FileModels with `.once()` — the StartOS UI caches the rendered Actions list and won't pick up changes. Prefer static `visibility: 'enabled'` with handler-side validation. See `actions/removeDevice.ts` for the working pattern.
