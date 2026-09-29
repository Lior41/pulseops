# Deploying PulseOps

Prepared deployment paths, not a claim of an already published service. Use only fictional telemetry in a public demo. Never give a public demo account access to operational systems.

## Vercel + remote PostgreSQL

1. Use the published [Lior41/pulseops repository](https://github.com/Lior41/pulseops), or push a fork to your own account. Before adopting a pull-request release workflow, enable branch protection and require the Quality workflow before merging; these repository protections are not configured automatically.
2. Provision a PostgreSQL 17-compatible database in the same region as the application. Use a dedicated demo database and the provider's TLS requirements. The pg adapter uses a small pool per instance; use the provider's pooled runtime URL if recommended.
3. Import the repository into Vercel with the Next.js preset, Node.js 24 and build command `npm run build`. This regenerates Prisma Client before each build, avoiding stale generated clients in cached installs. See [Prisma deployment guidance](https://www.prisma.io/docs/orm/prisma-client/deployment/serverless/deploy-to-vercel).
4. Add private environment variables in Vercel: `DATABASE_URL`, a random `AUTH_SECRET`, `AUTH_URL=https://your-final-domain`, `AUTH_TRUST_HOST=true`, `DEMO_MODE=true` and `DEMO_PASSWORD`. The deployment must be reachable only through the configured trusted host/proxy. Never put database URLs or secrets in `NEXT_PUBLIC_*` variables.
5. Apply `npm run db:migrate` against this database from an authorized release environment, using a direct migration connection if the provider requires one. Seed once with `npm run db:seed`. Set a private `ADMIN_PASSWORD` for this initial seed if administrator access is wanted; do not publish it in the demo or README.
6. Deploy a preview with its own database/schema and matching `AUTH_URL`. Verify login, a viewer's permissions, investigation writes, SSE reconnect and `/api/health` before promoting.
7. Add the final public URL to the README. Remove access restrictions on the preview only when intentionally publishing the fictional demo.

Do not use a shared production database for pull-request previews. Do not run seed or migrations on every application request. CI uses its own ephemeral PostgreSQL service and needs no production credentials.

## Serverless realtime

The stream handler declares `maxDuration=30`, responds immediately with SSE, closes after 24 seconds and lets EventSource reconnect. Select a runtime/plan configuration that permits at least 30 seconds. Function duration is configurable and platform limits may evolve; verify the [current Vercel duration documentation](https://vercel.com/docs/functions/configuring-functions/duration) for your account rather than assuming a quota.

The simulator on Vercel is browser-driven: an authenticated analyst viewing a live feed requests a synthetic tick every five seconds. A database transaction prevents multiple tabs from multiplying generation. When nobody is viewing a feed, this mode does not simulate continuous background ingestion. The standalone Docker worker provides that behavior on a host designed for long-running processes.

Each connected feed causes periodic database reads. The design is appropriate for a small portfolio demonstration. A high-traffic service should use managed pub/sub or a dedicated streaming service, connection limits and load testing.

## Docker

`docker compose up --build` creates four services: PostgreSQL, a one-shot migration/seed job, the standalone app, and the simulator worker. Dependencies wait for database health and successful setup. The app runs as a non-root user and only localhost port 3000 is published. Secrets are injected at runtime and excluded from the build context.

The Compose database credentials have a local-only default. Set private values when changing the binding or deploying to a remote machine. Put an HTTPS reverse proxy in front of the app before exposing it remotely. Set the canonical `AUTH_URL` and trust only the proxy that terminates your requests.

`docker compose down` stops the environment while preserving the named database volume. Do not remove that volume unless intentionally discarding the complete demo history.

## Release and rollback

The GitHub Actions workflow runs lint, strict types, formatting, unit/component tests, migrations, integration tests, seed, production build and Playwright. Once connected, Vercel's Git integration can create previews per branch. No deploy token is hard-coded.

Apply backward-compatible migrations before promotion. A code rollback does not roll back a database migration. Keep a backup, verify restoration and use an expand/contract migration strategy when changing data used by the previous version. This initial repository has one schema migration and an idempotent synthetic seed.

## Local startup and troubleshooting

`npm run demo` is the simplest local path after `npm ci`. It creates `.env` only if missing, manages a development PGlite server, migrates, seeds, builds and starts the standalone app. Existing files and demo changes are preserved. For a custom database, edit `.env` first; the command will use that database and requires `DEMO_MODE=true`.

| Symptom                                        | Check                                                                                                |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Connection refused on localhost                | Keep the startup terminal running; wait for the Ready message and reload the browser                 |
| Port 3000 already in use                       | Stop the previous app before starting a second server                                                |
| Database unreachable                           | Check `DATABASE_URL`, database process, port and TLS configuration                                   |
| Sign-in rejected                               | Confirm the seed ran, the demo password matches its initial value and rate limits have expired       |
| UntrustedHost                                  | Set the correct `AUTH_URL` and explicitly trust the configured local/proxy host                      |
| Auth works but mutation is refused             | Check role, active session version, exact origin and stale record version                            |
| Browser shows an old connection error          | Open/reload http://localhost:3000/login after the server is ready                                    |
| Too many watchers on macOS                     | Use the production demo launcher or the documented polling development option                        |
| Playwright cannot launch Chromium in a sandbox | Run the suite from a normal development terminal or the Linux CI job; do not claim it passed locally |

Keep operational error responses generic. Server logs intentionally omit credentials and raw event payloads. Real monitoring, backup automation, MFA and incident response for the application itself remain deployment-owner responsibilities.
