# Environment Variables

This project follows a **contract / delivery split**:

- **The repo enforces the contract.** [`apps/reference-app/src/api/config/env.ts`](../apps/reference-app/src/api/config/env.ts) defines a Zod schema, parses `process.env` once at module load, and exposes a frozen `env` object plus an `Env` type. Every backend file reads env values from `@config/env`. Direct `process.env[...]` access is ESLint-forbidden everywhere except the schema module itself and the test setup files.
- **You choose the delivery.** No `.env` file lives in the working tree (CI fails the build if one appears). Pick whichever of the four mechanisms below fits your workflow. They all simply set OS-level env vars before `node` starts — the schema validates whatever is present.

If you change or add a variable, update both [`apps/reference-app/src/api/config/env.ts`](../apps/reference-app/src/api/config/env.ts) (the contract) and the table below (the human-readable reference).

---

## Variables

| Variable                          | Required?    | Default                 | Description                                                                                                       |
| --------------------------------- | ------------ | ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                        | optional     | `development`           | Runtime environment. One of `development`, `test`, `production`.                                                  |
| `PG_CONNECTION_STRING`            | **required** | —                       | Postgres connection string used by the app.                                                                       |
| `PG_TEST_CONNECTION_STRING`       | optional     | —                       | Postgres connection string used by integration tests. When unset, the suite spawns an embedded Postgres instance. |
| `PASETO_SECRET_KEY`               | **required** | —                       | 32-byte (64+ hex chars) symmetric key for PASETO v3.local. Generate with `openssl rand -hex 32`.                  |
| `PASETO_ISSUER`                   | **required** | —                       | Token issuer claim (e.g. `my-app`).                                                                               |
| `PASETO_ACCESS_TOKEN_EXPIRY`      | optional     | `15m`                   | Duration string for access-token lifetime.                                                                        |
| `PASETO_REFRESH_TOKEN_EXPIRY`     | optional     | `7d`                    | Duration string for refresh-token lifetime.                                                                       |
| `PASETO_CLOCK_TOLERANCE`          | optional     | `1m`                    | Clock-drift tolerance during token verification.                                                                  |
| `COOKIE_SECURE`                   | optional     | `true`                  | Set to `false` only when running locally without HTTPS. Any other value is treated as `true`.                     |
| `EMAIL_PROVIDER`                  | optional     | `nodemailer`            | One of `nodemailer`, `ethereal`, `noop`. When `nodemailer`, `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` are required.     |
| `SMTP_HOST`                       | conditional  | —                       | Required when `EMAIL_PROVIDER=nodemailer`.                                                                        |
| `SMTP_USER`                       | conditional  | —                       | Required when `EMAIL_PROVIDER=nodemailer`.                                                                        |
| `SMTP_PASS`                       | conditional  | —                       | Required when `EMAIL_PROVIDER=nodemailer`.                                                                        |
| `SMTP_PORT`                       | optional     | `587`                   | SMTP port (1–65535).                                                                                              |
| `SMTP_SECURE`                     | optional     | `false`                 | Set to `true` for TLS on port 465.                                                                                |
| `SMTP_FROM`                       | optional     | `noreply@example.com`   | Default sender address.                                                                                           |
| `BASE_HREF`                       | optional     | —                       | Base path for the Angular app when hosted under a sub-path.                                                       |
| `IS_SERVERLESS`                   | optional     | `false`                 | Set to `true` in connection-pooled serverless deployments (e.g. Vercel).                                          |
| `PORT`                            | optional     | `4000`                  | HTTP port the Hono server listens on (invalid values fall back to default).                                       |
| `CORS_ORIGIN`                     | optional     | `http://localhost:4200` | Allowed CORS origin.                                                                                              |
| `CORS_MAX_AGE`                    | optional     | `86400`                 | CORS preflight cache duration (seconds).                                                                          |
| `BCRYPT_COST`                     | optional     | `12`                    | bcrypt work factor. Integration tests use `1` for speed.                                                          |
| `APP_LANGUAGE`                    | optional     | `en`                    | Default UI language. Used for emails and password generation.                                                     |
| `AUTH_MAX_FAILED_ATTEMPTS`        | optional     | `5`                     | Failed-login threshold before account lockout (invalid values fall back to default).                              |
| `AUTH_LOCKOUT_DURATION`           | optional     | `15m`                   | Account-lockout duration string (invalid values fall back to default).                                            |
| `CRON_SECRET`                     | optional     | —                       | Bearer token for cron-job-triggered endpoints. Must be ≥ 32 chars to be considered valid.                         |
| `TOKEN_CLEANUP_INTERVAL`          | optional     | `24h`                   | How often the refresh-token cleanup job runs (clamped to `1m`–`7d`).                                              |
| `TOKEN_CLEANUP_BATCH_SIZE`        | optional     | `1000`                  | Tokens per cleanup batch (clamped to `100`–`10000`).                                                              |
| `TOKEN_CLEANUP_MAX_BATCH_COUNT`   | optional     | `100`                   | Maximum cleanup batches per run (clamped to `10`–`1000`).                                                         |
| `INTEGRATION_TEST_ADMIN_PASSWORD` | optional     | —                       | Plain-text admin password used by integration tests.                                                              |

The Zod schema in [`env.ts`](../apps/reference-app/src/api/config/env.ts) is the authoritative source for validation rules, defaults, and cross-field constraints (e.g. the `EMAIL_PROVIDER=nodemailer` SMTP requirement).

---

## Delivery options

Pick whichever delivery mechanism fits your workflow. All four are equivalent from the app's perspective — they just need to set the env vars before `node` starts. **None of them puts a `.env` file in the working tree.**

### Option A — Out-of-tree env file + Node `--env-file` _(lowest friction, no deps)_

Keep a plain `.env` file **outside the repo** and pass it to `node` (Node 20.6+).

**macOS / Linux:**

```bash
mkdir -p "$HOME/.secrets/reference-app"
$EDITOR "$HOME/.secrets/reference-app/.env"
node --env-file="$HOME/.secrets/reference-app/.env" dist/reference-app/server/server.mjs
```

**Windows PowerShell** (use `$HOME` — `~` is not expanded for native exes in PowerShell 5.x):

```powershell
New-Item -ItemType Directory -Force "$HOME\.secrets\reference-app" | Out-Null
notepad "$HOME\.secrets\reference-app\.env"
node --env-file="$HOME\.secrets\reference-app\.env" dist\reference-app\server\server.mjs
```

For `npm run dev`, set the same env vars in the shell that runs `npm` (see Option C) or pre-load them with Option D.

### Option B — IDE run configuration _(lowest friction for IDE users)_

**WebStorm / IntelliJ:** open _Run → Edit Configurations → [your config] → Environment variables_. The values land in `.idea/workspaceState.xml` (per-developer, not committed). For a shareable file-based approach, use the [EnvFile plugin](https://plugins.jetbrains.com/plugin/7861-envfile) pointing at an out-of-tree path (Option A).

**VS Code:** `launch.json` supports `env` and `envFile`. **Do not inline secrets in committed `launch.json` files** — use `envFile` pointing to an out-of-tree path:

```jsonc
{
	"configurations": [
		{
			"type": "node",
			"request": "launch",
			"name": "dev",
			"program": "${workspaceFolder}/dist/reference-app/server/server.mjs",
			"envFile": "${userHome}/.secrets/reference-app/.env",
		},
	],
}
```

### Option C — Shell session export _(low friction, survives shell restarts)_

**macOS / Linux** — add to `~/.zshrc` / `~/.bashrc`:

```bash
export PG_CONNECTION_STRING='postgresql://...'
export PASETO_SECRET_KEY='...'
export PASETO_ISSUER='my-app'
```

**Windows PowerShell** — add to `$PROFILE`:

```powershell
$env:PG_CONNECTION_STRING = 'postgresql://...'
$env:PASETO_SECRET_KEY = '...'
$env:PASETO_ISSUER = 'my-app'
```

`npm run dev` inherits these. Caveat: vars typed live appear in shell history — prefer rc-file edits.

### Option D — `direnv` with out-of-tree source _(medium friction, auto-loads per directory)_

[direnv](https://direnv.net) loads env vars when you `cd` into the project. Keep secrets out of `.envrc` itself — source an out-of-tree file:

```bash
# .envrc (committed; contains no secrets)
source "$HOME/.secrets/reference-app/.env"
```

Then `direnv allow` once. PowerShell users can use direnv 2.37+ (see the [direnv changelog](https://direnv.net/CHANGELOG.html) for `pwsh` hook setup).

---

## Optional: centralized secrets managers

For teams that want audit logging, rotation, or cross-machine sharing, any of these tools work transparently with the schema above — they all wrap `npm run dev`:

- [Doppler](https://www.doppler.com): `doppler run -- npm run dev`
- [Infisical](https://infisical.com): `infisical run --env=dev -- npm run dev` (OSS, self-host or SaaS)
- [1Password CLI](https://developer.1password.com/docs/cli/secret-references/): `op run --env-file=secrets.tpl -- npm run dev`
- [dotenvx](https://dotenvx.com): `dotenvx run -- npm run dev` (encrypts the file in git)

This repo does **not** ship integration with any specific manager — pick one if you need it, ignore the section otherwise.

---

## Why no `.env` in the working tree?

AI coding agents (Claude Code, Cursor, etc.) opportunistically scan for `.env*` files in the working directory when they hit auth errors, and may read or modify them without explicit authorization. Keeping the file off disk in the working tree is the structural defense. The CI guard fails the build if any `.env*` file appears in the repo, and `.claude/settings.local.json` includes `Read`/`Write`/`Edit`/`Bash` deny rules on `.env*` as defense-in-depth.
