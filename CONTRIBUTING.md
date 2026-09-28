# Contributing

PulseOps is a defensive educational SOC. Contributions must use fictional telemetry and must not add scanning, exploitation, credential theft, malware execution or automatic containment of real systems.

1. Install Node.js 24 and run `npm ci`.
2. Run `npm run demo` to initialize an isolated local demo. See the README for PostgreSQL/Docker alternatives.
3. Create a focused branch. Keep business rules in `src/server`, presentation in `src/features`, and validate every mutation.
4. Run `npm run check`, `npm run format:check` and `npm run build`. Run database integration tests against a separate database; run Playwright for affected workflows.
5. Explain the user-visible behavior, validation and limitations in the pull request. New detection rules need boundary tests and evidence references. Include screenshots when changing the UI.

Do not commit `.env`, database files, credentials, generated Prisma clients or customer logs. Tests must not clean, truncate or reset an application database. There are deliberately no destructive reset commands in the application.

Use scoped commits such as `feat: add alert correlation rule`, `fix: reject stale incident updates`, `test: verify viewer permissions`, and `docs: explain deployment limits`. Commit working checkpoints; do not fabricate a history after the fact.
