# Brillante backend on Cloudflare Workers

`apps/brillante/src/{api,db,contracts}` hold a copy of the reference app's Hono + Drizzle + PASETO backend (users,
roles, permissions, cookie authentication), adapted to run as a **Cloudflare Worker** next to the SPA's static assets.
The frontend does not call it yet: Brillante's screens still use the legacy API and Auth0 until the frontend swap lands.

```
Browser ── same origin ──► Cloudflare Worker (wrangler.jsonc)
                             ├─ static assets, SPA fallback   (/*)
                             └─ Hono API                      (/api/*, Worker runs first)
                                  ├─ Postgres via Hyperdrive   (one client per request)
                                  ├─ Rate Limiting bindings    (per-IP throttling)
                                  └─ Cron Trigger → scheduled() (expired-token cleanup)
```

## What differs from the reference app

The reference backend assumes a long-lived Node server. These are the places where that does not hold on Workers.

| Area                       | Reference app                                      | Brillante Worker                                                                                                                                                                                     |
| -------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entry point                | `server.ts` (Node server, SSR, static files, cron) | `src/api/worker.ts` exporting `fetch` and `scheduled`; `src/api/app.ts` builds the API; assets are served by Cloudflare (`assets.run_worker_first: ["/api/*"]`)                                      |
| Database connection        | One shared `pg` Pool in the DI container           | One `pg` client per request through the Hyperdrive binding (`helpers/request-database.ts`). A Pool shared across requests hangs the Worker. Node scripts and integration tests still use the Pool    |
| Work after the response    | Runs on the event loop                             | `deferAfterResponse` uses `waitUntil`; the request's database client is closed only after every `waitUntil` task has settled, otherwise the work (for example the reset email) silently does nothing |
| Rate limiting              | `hono-rate-limiter`, in memory                     | Cloudflare Rate Limiting bindings (`middlewares/rate-limit.middleware.ts`)                                                                                                                           |
| Scheduled cleanup          | `setInterval` in the process                       | Cron Trigger (`triggers.crons`) calling `scheduled()`                                                                                                                                                |
| Invalid environment config | `process.exit(1)`                                  | Throws `EnvValidationError` (logged as FATAL). On Workers `process.exit` cancels the request with no message                                                                                         |
| Client IP for throttling   | `x-forwarded-for`, then `x-real-ip`                | `cf-connecting-ip` only: Cloudflare sets it and a caller cannot forge it. The proxy headers are a Node-only fallback                                                                                 |

Contracts that collided with Brillante's frontend DTOs were renamed on the frontend side with a `legacy-` prefix
(`legacy-user.types.ts`, `legacy-permission.constants.ts`, `legacy-pagination.types.ts`) so the backend files stay
identical to the reference app and upstream merges stay mechanical.

### Rate limiting is coarse by design

Cloudflare's binding supports only 10 s or 60 s windows, is per Cloudflare location and is eventually consistent. It
cannot express the reference app's "5 per 15 minutes". `RATE_LIMIT_POLICY` (limit per 60 s per endpoint) is the single
source of truth; a spec checks that `wrangler.jsonc` declares exactly those bindings. The authoritative brute-force
defence is the database-backed per-account lockout (`AUTH_MAX_FAILED_ATTEMPTS`, `AUTH_LOCKOUT_DURATION`). The reference
app's `AUTH_CHANGE_PASSWORD_RATE_LIMIT_*` and `TOKEN_CLEANUP_INTERVAL` variables do not exist here.

The limiters fail closed: a missing or failing binding answers `503` and logs the cause on every request, because
throttling also protects forgot-password (email flooding), refresh and the other password flows. A request that reaches
the Worker without `cf-connecting-ip` (for example a service-binding subrequest) shares one `unknown` bucket. IPv6
clients are keyed on their full address, not their /64, so a client with a whole /64 can spread across buckets; the
per-account lockout still applies.

## Cloudflare requirements

- **Workers Paid plan.** The Free plan allows 10 ms of CPU per request ([Workers limits](https://developers.cloudflare.com/workers/platform/limits/));
  one bcrypt check at cost 12 took about 300 ms in a local run, which is a measurement, not a Cloudflare figure.
- **Hyperdrive with query caching disabled.** Hyperdrive caches reads by default and never invalidates them on writes,
  which would serve stale lockout counters, refresh-token reuse checks and user status.
  `wrangler hyperdrive create <name> --connection-string=<url> --caching-disabled`, then put the printed id in
  `wrangler.jsonc`. The database must accept TLS; a private database needs Cloudflare Tunnel or Workers VPC.
- **Secrets** (`wrangler secret put`): `PASETO_SECRET_KEY` (64 hex characters), `CRON_SECRET` (at least 32 characters).
- **Vars** in `wrangler.jsonc`: `IS_SERVERLESS=true` (transaction-scoped advisory locks; the Worker runtime also forces
  serverless mode on its own, so a deployment that forgets the flag cannot take a session lock through Hyperdrive),
  `PASETO_ISSUER`, `COOKIE_SECURE`, `EMAIL_PROVIDER=noop` and `CORS_ORIGIN` (the public origin of the Worker). **`CORS_ORIGIN` is
  required on Workers** (`keep_vars` keeps variables set in the dashboard across deploys). Without it the
  Worker answers `500` and logs `FATAL ... CORS_ORIGIN`, because password-reset links are built from it and a `localhost`
  default would put dead links in emails.
- **Custom domain.** `wrangler.jsonc` declares no route, so a deploy is reachable on its `workers.dev` address only.
  Attach the production domain to the Worker (dashboard, or a `routes` entry with `custom_domain: true`) before relying on
  cookies or reset links: both assume that origin.
- **Email is not solved yet.** Port 25 is blocked on Workers and SMTP over TLS has not been verified there. The planned
  providers are the Cloudflare Email Service binding (beta, needs the Workers Paid plan to reach arbitrary recipients) with
  an HTTP provider as fallback. `wrangler.jsonc` sets `EMAIL_PROVIDER=noop`, so **reset and welcome emails are not
  sent** until a provider exists; the default (`nodemailer`) would fail without SMTP settings.

## Commands

| Command                                     | What it does                                                                              |
| ------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `npm run dev:brillante:worker`              | Builds the SPA and runs the Worker locally with `wrangler dev`                            |
| `npm run drizzle:push-migrations:brillante` | Pushes the schema to `PG_CONNECTION_STRING`                                               |
| `npm run drizzle:seed:brillante`            | Seeds the admin role, permissions and the admin user (`SEED_ADMIN_EMAIL`/`_PASSWORD`)     |
| `npm run drizzle:seed-roles:brillante`      | Adds the legacy roles 2 to 7 to a database seeded before they existed (idempotent)        |
| `npm run sync:permissions:brillante`        | Inserts permissions added to the catalogue (does not grant them to roles)                 |
| `npm run test:integration:brillante`        | Integration suite against Postgres (`PG_TEST_CONNECTION_STRING`, or an embedded Postgres) |
| `npm run smoke:brillante:worker`            | End-to-end check of a running Worker (see below)                                          |
| `npm run deploy:brillante`                  | Builds the SPA and deploys the Worker with its assets                                     |

For `wrangler dev`, set `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` to a local Postgres URL and pass
secrets with `--var NAME:value` (for example `npm run dev:brillante:worker -- --var PASETO_SECRET_KEY:<64 hex>`).
No `.env` file may exist in the tree.

### Worker smoke test

`npm run smoke:brillante:worker` runs against a live Worker (`SMOKE_BASE_URL`, default `http://localhost:8787`) and
checks what only the Workers runtime can break: static assets and SPA fallback, login with HttpOnly cookies, `/me`,
role-protected routes, refresh rotation, that forgot-password work after the response stored a reset token
(`SMOKE_DATABASE_URL`), that 40 parallel requests from two users never see each other (`SMOKE_SECOND_EMAIL`/`_PASSWORD`),
the 429 and `Retry-After` of the rate limit, and the Cron handler (`SMOKE_CHECK_SCHEDULED=1`, through the
`/cdn-cgi/local/scheduled` URL that `wrangler dev` prints, local only). Run it again
against a deployment: Hyperdrive behaviour, CPU time per login, email delivery and cookies on the real domain
cannot be proven locally.

### Roles

`drizzle:seed:brillante` creates the reference seed's Administrator (id 1, all 14 `admin:*` permissions) and then the six
other legacy roles with their legacy ids and **no permissions**: 2 `owner` (Brillante), 3 `counter_clerk` (Encargado Local),
4 `repairman` (Taller), 5 `customer` (Cliente), 6 `employee` (Empleado), 7 `accountant` (Contador). None of them is
removable. The ids match the legacy ones on purpose (user import and the frontend's interim role table use them), so
`seedLegacyRoles` fails loudly if a legacy code sits under another id or an unrelated role holds a legacy id, and it moves
the id sequence past 7 so later roles never collide. It is idempotent; `drizzle:seed-roles:brillante` runs only this step
on an already seeded database.

`LEGACY_ROLE_PERMISSION_MATRIX` (`contracts/role/legacy-roles.ts`) lists the Brillante domain permissions each legacy role
would hold. It is derived from the frontend's interim table and is **not applied**: the database only knows the `admin:*`
permissions, so until domain permissions are added to `PERMISSION_DEFINITIONS` only administrators can use the user
management API (owners and counter clerks lose it until permissions are assigned to their roles).

### Legacy user import (core)

`apps/brillante/src/db/legacy-import/` holds the pure part of the import of the legacy staff users; it reads nothing
from the database and writes nothing; the writer, the CLI and the runbook are in the next section.

| Module                                                 | Role                                                                                                             |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `legacy-user-source.ts`                                | `LegacyUserSource` interface: users, user roles and the legacy columns that hold a user id                       |
| `mysql-dump-parser.ts`, `mysql-dump-user-source.ts`    | Parser for the INSERT-only MySQL export and the source built on it; datetimes are read as UTC                    |
| `legacy-user-mapper.ts`                                | Which users are imported and as what (see the rules below)                                                       |
| `legacy-user-plan.ts`                                  | Compares the result with the users already in the target: `create`, `unchanged` or `conflict`                    |
| `legacy-user-references.ts`, `legacy-import-report.ts` | Which excluded users the other legacy tables still point at, and a report with counts, reason codes and ids only |

Rules: a user is imported when its single active role is any legacy role except Cliente; the legacy ids are kept as the
new user ids and the role ids as the new role ids; emails are trimmed and lower-cased and a missing one becomes
`no-email-<id>@placeholder.local`; `enabled=0` maps to `disabled` and `deleted=1` to `deleted`; the legacy user name,
avatar and has-finished-registration flag are dropped; no history rows are written. Users that already exist in the target
are not imported again: the administrator the starter seed creates is legacy user 1, so it is listed as already in the target
and the only users the import excludes are the customers. The user id sequence will move to 1000 after the
import so users created later never reuse a legacy id.

**Seeded administrator.** The administrator created by `drizzle:seed:brillante` is legacy user 1. For the real import the
database is seeded with `SEED_ADMIN_EMAIL=admin@brillantestore.com` (the other seed fields stay as they are), so the new
user id 1, its email and the Administrator role line up with the legacy record.

**The dump stays local.** It holds real personal data. `npm run ci` and the pre-commit hook run
`scripts/check-no-sql-dumps.mjs`, which scans the whole working tree and fails on any tracked or unignored `*.sql`,
`*.dump`, `*.dmp`, `*.bak` or `*.sql.gz|zip|bz2|xz|7z` outside `drizzle/` at the repository root (so an unrelated stray
`.sql` file also blocks a commit until it is removed or ignored). Keep the dump outside the repository, or name it
`*.dump.sql` or put it under a `legacy-dumps/` directory, which `.gitignore` covers. The check is a safety net, not a
scanner: other extensions and renamed files are not detected. Specs build their dumps from invented data; none is derived
from the real one.

The parser accepts only what the legacy export contains: `INSERT INTO` statements at the start of a line, numbers, NULL
and quoted strings. Binary (`_binary '...'`) and hex literals are rejected, as is a dump missing any table the import
reads (`user`, `user_role` and the six reference columns), so a wrong file fails loudly instead of reporting "nothing to
import". Zero and out-of-range MySQL dates are read as no date.

### Legacy user import (writer, CLI and runbook)

`npm run drizzle:import-legacy-users:brillante -- --dump <path> [--apply] [--already-provisioned 1] [--report <path>]`
(note the `--` that lets npm pass the options on) reads the local MySQL dump, plans against the database `PG_CONNECTION_STRING` points at and writes the users in **one
transaction**. It prints the target (host, port and database name, never credentials) first. `--dump` is mandatory;
unknown options and stray arguments are rejected (a mistyped flag is never ignored). **Without `--apply` nothing is written**:
the default is a dry run (`--dry-run` is accepted as its explicit spelling), rolled back at the end. It refuses to write when the plan has a conflict, when a user declared with
`--already-provisioned` is missing from the target, or when a role the users need does not exist (this is also checked on
a dry run, so a clean preview means the real run will not fail on those). Re-running it is a no-op: users already present
with the same id and email are reported as `unchanged`.

What gets written, per imported user: the `user` row with its legacy id, trimmed names, lower-cased email (or the
placeholder), status, legacy timestamps; one `user_role` row (role id equals the legacy role id); and an `authentication`
row whose password hash is of a random secret that is never shown, with `must_change_password` set. Nobody can log in
with an imported account until a password reset gives it a real password (Slice 4). Afterwards the `user` id sequence
moves to 999, so the next user created gets id 1000; it is never lowered.

**Runbook** (the prototype Supabase database):

1. **Reset the app tables.** The database must hold only what the seed creates. In the `public` schema drop the app
   tables (`authentication`, `password_reset_token`, `permission`, `permission_route`, `refresh_token`, `role`,
   `role_history`, `role_permission`, `role_permission_history`, `user`, `user_profile_history`, `user_role`,
   `user_role_history`, `user_status_history`) and the `user_status` and `route_type` enums, with `CASCADE`. Do not drop the `public`
   schema itself: Supabase's own roles depend on its grants. This deletes the current test users.
   Export `PG_CONNECTION_STRING` in the shell session for every command below (the repo forbids `.env*` files, so do not use
   the `:local` script variants).

2. **Push the schema:** `npm run drizzle:push-migrations:brillante`.
3. **Seed:** `SEED_ADMIN_EMAIL=admin@brillantestore.com SEED_ADMIN_PASSWORD=<strong password> npm run drizzle:seed:brillante`.
   It creates user 1 (the administrator, legacy user 1), the Administrator role with the 14 `admin:*` permissions and the
   six legacy roles without permissions.
4. **Dry run:** `npm run drizzle:import-legacy-users:brillante -- --dump <path to the local dump> --already-provisioned 1`.
   Expected on the current dump: create 16, excluded 32 customers, legacy user 1 already in the target, placeholder
   emails for legacy ids 2, 7 and 8, no conflicts.
5. **Apply:** the same command with `--apply`. It reports `Imported 16 user(s)`.
6. **Verify:** 17 users (the seeded administrator plus 16 imported): 12 active and 5 disabled, roles admin 5, counter
   clerk 9, employee 2, accountant 1, ids 1 to 14, 16, 17 and 23, and a second run that reports `unchanged: 16` and
   imports nothing. The next user created gets id 1000. (These counts were rehearsed on a fresh local database and then obtained on the prototype Supabase database.)

For hosts whose certificate chain Node cannot verify (Supabase), append `?uselibpqcompat=true&sslmode=require` to the
connection string, as for the other database scripts. The dump never leaves the machine; pass its path on the command line.

### Deployment and checks on Cloudflare

While this is a prototype there is a single Worker, `brillante`, and a single database; separating staging from production
is future work. Setup: create the Hyperdrive config with `--caching-disabled` and put its id in `wrangler.jsonc`; push
the schema and seed an admin with `drizzle:push-migrations:brillante` and `drizzle:seed:brillante`
(`PG_CONNECTION_STRING`, with `uselibpqcompat=true&sslmode=require` for hosts whose certificate chain Node cannot
verify); set the secrets with `wrangler secret put PASETO_SECRET_KEY` and `CRON_SECRET`; then `npm run deploy:brillante`.
Run the smoke test with `SMOKE_BASE_URL=<worker url>`. Against a deployment the script omits `cf-connecting-ip`
(the edge rejects client requests that carry it, error 1000), so all checks share the runner's address and the
rate-limit check first waits 65 s for its window to empty. The scheduled-handler check is local only.

Results on the Workers Paid plan: a bcrypt login (cost 12) used 300 to 630 ms of CPU, other endpoints under 80 ms, no
`exceededCpu`, no database errors, and all smoke checks passed. Notes:

- A plan change only reaches a Worker on its next deployment; until then requests still ran under the Free limits.
- The Workers Free plan is not workable: it cut off most requests with `exceededCpu` (503).
- Cloudflare's Rate Limiting binding is permissive at the edge: the 5 per 60 s policy first returned 429 after 10 to 28
  attempts from one address (locally it is exact). The DB-backed per-account lockout is the authoritative defence; use
  a zone WAF rate limiting rule if a strict per-IP limit is needed.
- Hyperdrive's default origin connection limit (20) exhausted the 15 clients of Supabase's session pooler
  (`EMAXCONNSESSION`) and made parallel requests fail. Set it below the pooler's limit:
  `wrangler hyperdrive update <id> --origin-connection-limit 8`.

## Database client behaviour

The per-request client opens its connection lazily on the first query (requests that never touch the database, such as the
API docs or a rejected token, open none), has a 10 s connect timeout and a 25 s query timeout, and logs connection errors
instead of throwing them. The Cron cleanup takes a transaction-scoped advisory lock, which Hyperdrive's transaction pooling
can keep; the purge is idempotent, so two overlapping runs are harmless and the lock only avoids duplicated work.

## Password reset: implementation notes

**Status.** The API side exists and is tested; the flow cannot be completed end to end yet.

| Piece                                                                                                    | State                                                                                                   |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, single-use hashed tokens (1 h expiry) | Implemented (copied from the reference app), covered by unit and integration specs                      |
| Token created after the response on Workers                                                              | Verified by the worker smoke test (`forgot-password work after the response stored a reset token`)      |
| Email delivery                                                                                           | **Not working**: `EMAIL_PROVIDER=noop`, so no link is ever sent                                         |
| Frontend pages (request link, set new password)                                                          | **Not present** in `apps/brillante`; they exist only in the reference app and arrive with the auth swap |

**Open point: the reset link origin.** The link is built from the first entry of `CORS_ORIGIN`
(`password-reset.service.ts`), which is the `workers.dev` address until a custom domain is attached. On a preview deployment (a `workers.dev` address) a
link would therefore point at production. Nothing breaks today because no email is sent. When emails are enabled:

- Keep `CORS_ORIGIN` as an allow-list for genuinely cross-origin callers. The SPA and the API share one origin on the
  Worker, so previews do not need to be listed for the app itself to work.
- Build the link from the request's own origin when it matches the allow-list, and fall back to the first configured
  origin otherwise (never trust an arbitrary `Host` or `Origin` value).
- If per-version preview URLs must be allowed, support wildcard entries (for example
  `https://*-brillante.<account>.workers.dev`) in the allow-list and in the "required on Workers" check.
- Update the specs for `buildResetUrl`, `http.env` and the CORS middleware accordingly.

## Known gaps

- No email provider that works on Workers (see above).
- `hono-rate-limiter` is no longer imported by Brillante, but the package stays in the root `package.json` because
  the reference app still uses it.
- The `docs/api/*.bru` Bruno collection targets the reference app; the endpoints are identical, only the base URL differs.
