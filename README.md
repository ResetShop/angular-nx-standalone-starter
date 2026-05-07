# Reset Dev: Repo Starter

## How to use this repo

This repository is a starter project for an SSR-ready Angular application, which uses Hono for its backend web API.

Search for the TODOs! They indicate places where you'll need to update fields to suit your project architecture and folder structure.

### Forking workflow

This repo is designed to be **forked**, not consumed as a published package set. Starter code lives in `packages/*`, `apps/reference-app`, and root config; your apps live in `apps/<name>` and are created via the schematic — never by hand-copying `apps/reference-app`.

```bash
# 1. Fork on GitHub, then clone your fork locally
git clone https://github.com/<your-org>/<your-fork>.git
cd <your-fork>
git remote add upstream https://github.com/ResetShop/angular-nx-standalone-starter.git
npm install

# 2. Create your first app from the canonical reference template.
# `--name` is required; omitting it triggers an interactive prompt.
npm run generate:app -- --name="My App"

# 3. Pull upstream improvements at any time
git fetch upstream
git merge upstream/main
```

`apps/reference-app` is **upstream-owned** and must never be modified in a fork. See [`docs/forking.md`](docs/forking.md) for the full workflow, ownership boundaries, conflict resolution, and the changelog contract.

## Live demo

- App: https://angular-nx-standalone-starter.vercel.app/
- Storybook: https://angular-nx-standalone-starter-story.vercel.app/

## Project Setup Guide

This guide covers all the setup steps needed to configure this starter repository for your project. The repository includes optional integrations for databases, CMS, and analytics services.

### Quick Start Checklist

- [ ] Clone repository and install dependencies
- [ ] Configure environment variables **[Required]**
- [ ] Generate and configure PASETO secret key **[Required]**
- [ ] Choose and setup database **[Optional]**
- [ ] Configure CMS integration **[Optional]**
- [ ] Setup analytics **[Optional]**
- [ ] Configure development tools **[Optional]**
- [ ] Post-setup cleanup **[Required]**

---

### Required Setup

#### 1. Prerequisites **[Required]**

This project requires:

- **Node.js**: `^20.19.0` or `^22.12.0`
- **npm**: Package manager

**Installation Steps:**

```bash
# Clone the repository
git clone <repository-url>
cd angular-nx-standalone-starter

# Install dependencies (automatically runs config and database setup)
npm install
```

Note: The `npm install` command automatically runs database migrations and seed via the postinstall hook.

#### 2. Environment Variables Configuration **[Required]**

The project uses build-time environment configuration via Angular's `define` option in `apps/reference-app/project.json`. Each build configuration (`development`, `staging`, `production`) has its own `define` block that injects values into `apps/reference-app/src/app/environments/environment.ts` at build time.

**Frontend Environment Variables** (configured in `project.json` → `build.configurations.<env>.define`):

- **`__ENV_ENVIRONMENT__`**: Build environment identifier (`'development'`, `'staging'`, `'production'`)
- **`__ENV_API_URL__`**: API base URL (default: `'/'` — same-origin, SSR proxies API calls)
- **`__ENV_CLARITY_PROJECT_ID__`**: Microsoft Clarity analytics project ID (default: `''` — disabled)
- **`__ENV_DEFAULT_LANGUAGE__`**: Default UI language (default: `'en'`)

**Backend Environment Variables** (configured in `.env` file, read at runtime by the server):

See the `.env` file and `packages/hono-core/src/lib/environment.ts` for all backend configuration. Backend connector templates (Drizzle MySQL/PostgreSQL, Sanity, Microsoft Clarity) live in the same `packages/hono-core/src/lib/` directory and are consumed via the `@resetshop/hono-core` package alias. Note: all `apps/...` paths in the rest of this guide are relative to the canonical example app at `apps/reference-app/`.

#### 3. Authentication Configuration **[Required]**

The authentication system uses PASETO (Platform-Agnostic Security Tokens) for secure token-based authentication. You must configure the required environment variables before the application will work.

**Required Environment Variable:**

- **`PASETO_SECRET_KEY`**: A 32-byte (256-bit) secret key in hexadecimal format
  - **Generate the key:**

    ```bash
    # Using OpenSSL (recommended)
    openssl rand -hex 32

    # Using Node.js
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    ```

  - **Set in development:** Add to your `.env` file:
    ```bash
    PASETO_SECRET_KEY=your_generated_key_here
    ```
  - **Set in production:** Configure in your deployment platform's environment variables

**Required Environment Variables:**

- **`PASETO_ISSUER`**: Token issuer claim (e.g., "my-app")

**Optional Environment Variables:**

- **`PASETO_ACCESS_TOKEN_EXPIRY`**: Access token lifetime (default: "15m")
- **`PASETO_REFRESH_TOKEN_EXPIRY`**: Refresh token lifetime (default: "7d")
  - Supported formats: "15m" (minutes), "24h" (hours), "7d" (days), "30s" (seconds)
- **`PASETO_CLOCK_TOLERANCE`**: Clock drift tolerance for token validation (default: "1m")
  - Useful for handling slight time differences between client and server
- **`COOKIE_SECURE`**: Controls the `secure` flag on authentication cookies (default: "true")
  - Set to "false" for local development without HTTPS
  - **Always keep as "true" in production**
- **`CORS_ORIGIN`**: Allowed origin for CORS requests (default: "http://localhost:4200")
  - Set to your frontend domain in production (e.g., `"https://app.example.com"`)
  - Required for cookie-based authentication when frontend and backend are on different origins
- **`CORS_MAX_AGE`**: Preflight request cache duration in seconds (default: 86400 = 24 hours)
  - Controls how long browsers cache OPTIONS preflight responses
- **`TOKEN_CLEANUP_INTERVAL_MS`**: Expired token cleanup interval in milliseconds (default: 86400000 = 24 hours)
  - Background job that removes expired refresh tokens from the database
  - Valid range: 60000 (1 minute) to 604800000 (7 days)
  - Skipped on Vercel (use Vercel Cron Jobs instead)
- **`TOKEN_CLEANUP_BATCH_SIZE`**: Number of tokens to delete per batch (default: 1000)
  - Valid range: 100 to 10000
  - Higher values = faster cleanup but longer transactions
- **`TOKEN_CLEANUP_MAX_BATCH_COUNT`**: Maximum number of batches per cleanup run (default: 100)
  - Valid range: 10 to 1000
  - Limits cleanup to batch_size × max_batches tokens per run (default: 100k)
  - Prevents indefinite execution on large backlogs
- **`CRON_SECRET`**: Secret for Vercel Cron Jobs to authenticate cleanup requests (minimum 32 characters)
  - Generate with: `openssl rand -hex 32`
  - Required when using Vercel Cron Jobs

**Documentation:**

- For detailed information about the authentication system, see [docs/AUTHENTICATION.md](./docs/AUTHENTICATION.md)
- For the dependency injection guide, see [docs/DEPENDENCY_INJECTION.md](./docs/DEPENDENCY_INJECTION.md)

⚠️ **Security Note**: Never commit your `PASETO_SECRET_KEY` to version control. Keep it secret and rotate it periodically in production.

---

### Optional Integrations

These integrations can be enabled based on your project needs. Each section includes installation commands and configuration steps.

#### 1. Database Configuration **[Optional]**

The starter supports both MySQL and PostgreSQL via Drizzle ORM. Choose one based on your requirements.

**Setup Steps:**

1. **Install Database Packages:**

   For MySQL:

   ```bash
   npm install drizzle-orm drizzle-kit mysql2
   ```

   For PostgreSQL:

   ```bash
   npm install drizzle-orm drizzle-kit postgres
   ```

2. **Configure Drizzle:**
   - Edit `drizzle.config.ts:5,10` to set dialect and credentials programmatically
   - Current implementation has hardcoded values that need to be made dynamic

3. **Uncomment Database Connector:**
   - For MySQL: Uncomment code in `packages/hono-core/src/lib/drizzle-mysql-connector.ts:1-2`
   - For PostgreSQL: Uncomment code in `apps/reference-app/src/api/helpers/drizzle-postgres-connector.ts:1-2`

4. **Enable Database in Environment Config:**
   - Uncomment database configuration in `packages/hono-core/src/lib/environment.ts:17,45`

5. **Set Connection String:**
   - Add your database connection string to environment variables
   - Configure separately for development and production environments

#### 2. Sanity.io CMS Integration **[Optional]**

Integrate Sanity.io headless CMS for content management.

**Setup Steps:**

1. **Install Sanity Client:**

   ```bash
   npm install @sanity/client
   ```

2. **Uncomment Sanity Connector:**
   - File: `packages/hono-core/src/lib/sanity-connector.ts:1-2`
   - Uncomment the connector implementation

3. **Enable Sanity in Environment Config:**
   - Uncomment Sanity configuration in `packages/hono-core/src/lib/environment.ts:4,32`

4. **Set Environment Variables:**
   - Add Sanity project ID and dataset to your environment variables
   - Configure API version and authentication token as needed

#### 3. Analytics Integration **[Optional]**

Enable analytics tracking with Microsoft Clarity.

##### Microsoft Clarity

1. **Install Clarity Package:**

   ```bash
   npm install @microsoft/clarity
   ```

2. **Uncomment Clarity Connector:**
   - File: `packages/hono-core/src/lib/clarity-connector.ts:1-2`

3. **Enable in Analytics Provider:**
   - Uncomment Clarity setup in `apps/reference-app/src/app/providers/analytics/analytics.ts:22`

4. **Uncomment Environment Configuration:**
   - Files: `packages/hono-core/src/lib/environment.ts:11,39`

5. **Set Build-Time Variable:**
   - Set `__ENV_CLARITY_PROJECT_ID__` in the `production` define block of `project.json` with your Microsoft Clarity project ID

#### 4. Development Tools **[Optional]**

##### Storybook Assets Configuration

If you need to add static assets for Storybook:

- **File**: `.storybook/main.ts:21`
- **Action**: Add your project assets directory to the Storybook configuration
- **Example**: Add paths to image folders, fonts, or other static resources needed in Storybook stories

##### Custom Angular Providers

For adding custom dependency injection providers:

- **File**: `apps/reference-app/src/app/app.config.ts:45`
- **Action**: Add your custom provider functions to the application configuration
- **Use Case**: Custom services, HTTP interceptors, or third-party library providers

---

### Running Integration Tests

`npm run test:integration` works **out of the box with no setup** — no Docker daemon, no managed Postgres, no env config. When `PG_TEST_CONNECTION_STRING` is unset, the suite spawns a real Postgres 17 cluster locally via [`embedded-postgres`](https://www.npmjs.com/package/embedded-postgres) (official EnterpriseDB binaries downloaded once at `npm install` time, ~70 MB cached in `node_modules`) on a free localhost port, runs the schema push and seed, and tears the cluster down at suite end.

To use your own long-lived Postgres instead (persistent local container, shared dev DB, etc.), set `PG_TEST_CONNECTION_STRING` in `.env`. CI uses the same env-set path against its `postgres:17` service container.

---

### Post-Setup Steps **[Required]**

#### Remove Configuration Routes

After completing your setup:

1. **Remove Setup Route:**
   - File: `apps/reference-app/src/app/pages/dashboard/dashboard.routes.ts:15`
   - Remove the welcome/configuration route intended for initial setup only

2. **Verify Application:**
   - Run `npm run dev` to start the development server
   - Ensure all configured features work correctly
   - Test that removed routes no longer appear

---

### Third-Party Acknowledgments

This project includes third-party data assets. See each linked file for full
license details.

| Asset                      | Source                                                                                       | License      |
| -------------------------- | -------------------------------------------------------------------------------------------- | ------------ |
| English password word list | [EFF Large Wordlist](https://www.eff.org/deeplinks/2016/07/new-wordlists-random-passphrases) | CC BY 3.0 US |
| Spanish password word list | [Dadoware Bonito ES](https://github.com/mir123/dadoware-bonito-es)                           | MIT          |

Full details: [`src/api/utils/wordlists/README.md`](./src/api/utils/wordlists/README.md)
