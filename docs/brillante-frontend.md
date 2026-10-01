# Brillante frontend (draft)

`apps/brillante` is a **frontend-only** rebuild of the legacy Brillante management app ("Shine") on top of this starter.
It was generated with the canonical schematic (`npm run generate:app -- --name="Brillante"`) and then reduced to an
Angular SPA that talks to the **existing production Brillante REST API**. The backend is out of scope: nothing under
`apps/brillante` contains an API, a database schema or a server.

> **Status:** prototype. It is built to the starter's rules (see `CLAUDE.md`) but has not been exercised against the live
> API with a real Auth0 account — see [Open items](#open-items).

## Running it

| Task              | Command                                                                     |
| ----------------- | --------------------------------------------------------------------------- |
| Dev server        | `npm run dev:brillante` (http://localhost:4200)                             |
| Production build  | `npm run build:brillante`                                                   |
| Unit tests / lint | `npm run test`, `npm run lint`, `npm run typecheck` (they include this app) |

The API base URL and the Auth0 tenant live in `apps/brillante/src/app/environments/environment.ts`
(`apiUrl: https://brillante-production.herokuapp.com`). The production API already answers CORS preflights with
`Access-Control-Allow-Origin: *`, so the dev server can call it directly.

### Auth0

Sign-in uses the same Auth0 tenant/application as the legacy app (`brillantestore.us.auth0.com`). The Auth0 application
must list every origin you run the SPA from (`http://localhost:4200` for local work) under **Allowed Callback URLs**,
**Allowed Logout URLs** and **Allowed Web Origins**; otherwise Auth0 rejects the redirect. The client id is a public
SPA identifier, not a secret.

## How authentication works

1. `/auth/login` shows a single button that redirects to Auth0 (`IdentityApi`, implemented by `Auth0IdentityApi`).
2. Back on the app, `authGuard` asks `AuthStore.login()` to resolve the Auth0 profile and exchange it for the Brillante
   user and API JWT with `POST /users/authenticate` (`AuthApi`). The session is persisted under the same
   `currentUser` localStorage key the legacy app used (`AuthSession`).
3. `jwtInterceptor` sends `Authorization: Bearer <jwt>` to the API; `unauthorizedInterceptor` ends the session on a 401.

The API authorises by **numeric roles** (admin, owner, counter clerk, repairman, customer, employee, accountant). The
starter authorises by **permissions**, so `src/contracts/permission/permission.constants.ts` maps each
`module:resource:action` permission to the roles that hold it (taken from the legacy route guards) and `User` derives
`hasPermission()` from the user's roles. Navigation, `permissionGuard` and the UI all use that one catalogue.

## Structure

```
apps/brillante/src/
  contracts/   wire DTOs of the Brillante API + the permission catalogue
  app/
    domain/    models and DTO → model mappers
    providers/ API tokens shared by several modules (interface + Http impl + in-memory mock + provideX()), identity, i18n
    store/     stores shared across the app (auth, office branch, ui)
    guards/ interceptors/
    pages/     auth, dashboard shell and one folder per module
```

A module's own store and API provider live next to its routes, so the `providers` array of its parent route only
references siblings: `pages/dashboard/cash/{cash.routes,cash.store,cash.types,cash.provider,cash.ts,cash.interface,cash.mock}.ts`.
The same holds for `repairs`, `clients`, `account`, `reports` and the settings sub-sections. APIs used by several
modules (customer, user, cash concept, payment method, office branch) stay in `providers/`.

Modules (routes under `/dashboard`): `clients`, `repairs`, `cash`, `reports`, `settings`; plus `/account` (profile).

## Where this app deviates from `reference-app`

- No SSR, no Hono server, no Drizzle, no integration tests, no Playwright project (there is no backend to seed).
- Storybook targets were removed from the project: `.storybook/` is wired to `apps/reference-app` only.
- Translations: `TranslationSchema` is starter-owned and `Translation.instant()` only accepts its keys. Brillante keys
  live in per-module slice files (`providers/i18n/translations/slices/*`) composed into `en.ts`/`es.ts`, and
  `AppTranslation.instant()` is the typed facade. The reference app's unused keys (auth, roles, …) remain in the base
  schema because it cannot be changed from a fork.
- Office branch selection (`OfficeBranchStore`) is dashboard-wide state, persisted in `officeBranch.current`.

## Legacy features not ported

- The public storefront pieces (`featured-products`, `products-dashboard`, POS) were empty stubs in the legacy code.
- The Syncfusion/Bootstrap UI is replaced by the starter's UI package.

## Security notes

- The API JWT is kept in `localStorage` (key `currentUser`, as the legacy app did) and sent as a Bearer token. This deviates
  from the starter's HttpOnly-cookie model (`.claude/references/auth.md`) because the Brillante API only accepts Bearer tokens.
- The administrator and owner roles can only be assigned by administrators and owners (`RoleCheckboxes`). The API is not known
  to enforce this, so the real guard has to live in the backend.
- CSV exports prefix text cells that start with `=`, `+`, `-`, `@` with an apostrophe to avoid spreadsheet formula injection.
- There is a single environment: `dev:brillante` talks to the **production** API, so every write in development is a
  production write. Add a staging `apiUrl` before using it for anything beyond reading.

## Open items

- First sign-in and 401 handling were never run against the real Auth0 tenant and API.
- Role-to-permission mapping follows the legacy route guards; legacy "everyone except accountant" access is narrowed to the
  internal roles, and the legacy finished-registration redirect for customers is not ported.
- Several store methods blocks exceed the 50-line function limit (the same shape as the reference stores); the cold CI and
  lint do not enforce it.
- Story files for shared components are not rendered because Storybook is wired to `reference-app` only.
