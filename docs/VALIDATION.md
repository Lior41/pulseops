# Validation record

Implementation environment: Node.js 24 on macOS, 28 September 2026. Results below distinguish source preparation from actual execution.

On 29 September 2026, the published commit `bac4164` also passed the complete [GitHub Actions run #1](https://github.com/Lior41/pulseops/actions/runs/36619397834) on Ubuntu with Node.js 24, native PostgreSQL 17 and Chromium. This includes lint, types, formatting, 14 unit/component tests, 6 database integration tests, migrations, seeding, the production build and all 3 Playwright scenarios. The macOS browser limitation below describes the earlier local run; it does not apply to this successful Linux run. The [workflow page](https://github.com/Lior41/pulseops/actions/workflows/ci.yml) reports the current branch status.

| Check                        | Actual result                                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| ESLint                       | Passed                                                                                                                   |
| TypeScript strict check      | Passed                                                                                                                   |
| Vitest unit/component tests  | 14 passed                                                                                                                |
| Database integration tests   | 6 passed on a dedicated local PGlite database using the Prisma pg adapter                                                |
| Prisma migration deployment  | Passed on local application and isolated test databases                                                                  |
| Idempotent seed              | Executed; existing investigations retained on rerun                                                                      |
| Production Next.js build     | Passed                                                                                                                   |
| Standalone production server | Started and used for browser verification                                                                                |
| Anonymous API access         | Playwright request test passed: protected endpoints return 401                                                           |
| Playwright Chromium UI tests | Written and attempted; browser launch blocked by macOS sandbox MachPort permission, before test execution                |
| Integrated browser workflow  | Login, alert triage, demo analysis, incident creation, note persistence after reload and live feed pause/resume verified |
| Navigation and search        | Identities, assets, search, settings, incidents and map verified; IP search correlated events/alerts/incident            |
| Docker execution             | Not run: Docker is not installed on the implementation machine                                                           |
| GitHub Actions               | Complete Linux workflow passed on published commit `bac4164`; see run #1 above                                           |
| Vercel deployment            | Configuration/guide prepared; no live deployment claimed                                                                 |
| External model               | No request made and no provider enabled; analysis is explicitly DEMO                                                     |
| Responsive and viewer checks | Mobile navigation and layout verified; viewer login shows read-only investigation controls                               |
| Screenshot file export       | Four real 1280×720 viewport captures saved and visually inspected                                                        |

## Coverage that matters

- Window and threshold boundaries, duplicate current events and future events in detection.
- Validated output shape and refusal of evidence IDs outside the authorized set.
- Synthetic context strips identifying fields and rejects real/untrusted telemetry.
- Weighted simulation covers all event types with common normal logins and rare malware.
- Viewer controls are read-only; failed actions do not show success.
- Five persisted failures create one evidence-linked alert despite replayed requests.
- A viewer is rejected at the mutation service, independent of the UI.
- Stale optimistic versions fail; incident creation is idempotent for a source alert.
- Notes and resolution persist, and a role change revokes a stale actor's write access.

PGlite runs PostgreSQL code in WASM and is useful for local functional tests. It does not reproduce native PostgreSQL's multi-session concurrency characteristics. The published CI run also passed the integration suite against native PostgreSQL 17; load/concurrency tests are still V2 work.

## Reproduce with native PostgreSQL

Create an isolated database whose name ends with `_test`. Apply the migration to it. Keep the application's `DATABASE_URL` separate and set `TEST_DATABASE_URL` for the integration command. The test setup refuses equal application/test URLs and never truncates application data.

```bash
npm run db:generate
# With DATABASE_URL temporarily set to your dedicated test DB:
npm run db:migrate
# Restore the application DATABASE_URL and set TEST_DATABASE_URL:
npm run test:integration
npm run check
npm run format:check
npm run build
npx playwright install chromium
npm run test:e2e
```

The E2E suite expects a fresh seeded demo with open critical alerts. It modifies only fictional investigations, creates an incident and adds a note. Use an isolated E2E database when running repeatedly. Screenshots and traces on failure are written to ignored folders.
