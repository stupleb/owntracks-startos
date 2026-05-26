# CLAUDE.md

See [CONTRIBUTING.md](CONTRIBUTING.md) for the doc map and contribution workflow.

## Operating rules

- This package bundles three upstream containers (`eclipse-mosquitto`, `owntracks/recorder`, `owntracks/frontend`). When changing image tags or container behavior, update both `README.md` (developer-facing) and `instructions.md` (user-facing) in the same change.
- TLS for the MQTT broker comes from the **StartOS platform CA** via `sdk.getSslCertificate` / `sdk.getSslKey`. Do not reintroduce a package-private CA — phones either already trust the platform CA (via the StartOS UI) or install it once via the `download-ca-cert` action.
- The MQTT (TLS) external port is intentionally pinned to a non-standard high number (`28883`) so we don't squat on IANA's `8883`. The internal port mosquitto listens on is still `8883`.
- The MQTT (WebSocket) interface is HTTP-routed by StartOS (`protocol: 'http'` with implicit TLS termination at the edge), which buys us dual-stack v6 routing AND lets a public custom domain land on `:443` with a Let's Encrypt cert. Keep it in the simple form — no `preferredExternalPort`, no `addSsl` — or that automation opts out. Don't add a `path` (e.g. `/mqtt`); OwnTracks Android's UI has no path field and the URL would mislead users.
- The ACL grants every authenticated user full `owntracks/#` read+write. We tried per-device topic-prefix scoping; it breaks because the OwnTracks phone app's "Username" (topic prefix) is a separate field from the MQTT auth username, so per-prefix ACL silently denies legitimate publishes.
- Action metadata visibility: avoid making it dynamic by reading FileModels with `.once()` — the StartOS UI caches the rendered Actions list and won't pick up changes. Prefer static `visibility: 'enabled'` with handler-side validation. See `actions/removeDevice.ts` for the working pattern.
- **OwnTracks HTTP mode is an explicit non-goal.** The recorder's `/pub` endpoint is unauthenticated by default and lives on the same port as the `/api/0/*` read endpoints, so exposing it externally requires a custom auth proxy in front of it. WebSocket-MQTT covers the same publish use-cases with broker-enforced auth, TLS, retained messages, and real-time push — strictly better for a self-hosted home user. If a future contributor proposes adding HTTP mode, they need to bring a concrete use case it solves *and* an auth proxy design.
