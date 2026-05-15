# Contributing

This repo packages [OwnTracks](https://owntracks.org/) for StartOS. The bundle pulls in three upstream containers — `eclipse-mosquitto` (MQTT broker), `owntracks/recorder` (track persistence), and `owntracks/frontend` (map UI) — and wires them together with TLS provisioned by the StartOS platform CA.

## Documentation — keep it in sync

- **`README.md`** — what this package is and how it's built (images, volumes, interfaces, TLS model). For developers and AI assistants.
- **`instructions.md`** — the user-facing instructions packed into the `.s9pk` and shown on the **Instructions** tab in StartOS, for the person running the service.
- **`CONTRIBUTING.md`** — this file.
- **`CLAUDE.md`** — operating rules for AI developers working in this repo.

**Any code change that warrants it must update `README.md` and `instructions.md` in the same change** — a new or renamed action, an added or removed volume / port / interface / dependency, a changed default, a new limitation, any altered user-visible behavior. Don't defer: a package that ships with a stale README or stale instructions is not done, even if the code is perfect. Content rules live in the packaging guide: [Writing READMEs](https://docs.start9.com/packaging/writing-readmes.html) and [Writing Service Instructions](https://docs.start9.com/packaging/writing-instructions.html).

## Building

See the [StartOS Packaging Guide](https://docs.start9.com/packaging/) for environment setup, then:

```bash
npm ci    # install dependencies
make      # build the .s9pk for both architectures
```

## Updating an upstream image

The package pins three Docker images in `startos/manifest/index.ts`. To track a new release of any of them:

1. Bump the matching `dockerTag` in `startos/manifest/index.ts`:
   - `mosquitto` → new `eclipse-mosquitto:<tag>`
   - `recorder` → new `owntracks/recorder:<tag>`
   - `frontend` → new `owntracks/frontend:<tag>`
2. Update `version` and `releaseNotes` in the file under `startos/versions/`, renaming it to the new version string. A *new* version file is only needed when the bump carries an `up`/`down` migration, or when you want the old release notes preserved in git history — see [Versions](https://docs.start9.com/packaging/versions.html).
3. Rebuild (`make`), sideload the `.s9pk`, and confirm it starts and the affected daemon's logs look clean.
4. Review `README.md` and `instructions.md` for anything the bump changed (e.g. the image tag in the runtime table, new env vars, removed features).

## How to contribute

1. Fork the repository and create a branch from `master`.
2. Make your changes — including the doc updates above.
3. Open a pull request to `master`.
