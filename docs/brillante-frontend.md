# Brillante frontend (draft)

`apps/brillante` is a rebuild of the legacy Brillante management app ("Shine") on top of this starter. It was generated with
the canonical schematic (`npm run generate:app -- --name="Brillante"`). Users and authentication run on its own Hono +
Drizzle backend (`apps/brillante/src/api`, a Cloudflare Worker, see [`brillante-backend.md`](brillante-backend.md)): the
SPA signs in against it with the starter's cookie session. The business screens (repairs, cash, clients, reports) still
call the **existing production Brillante REST API**, which authenticates them with a token the new backend issues.

> **Status:** prototype. It is built to the starter's rules (see `CLAUDE.md`). The sign-in flow against the new backend
> has been tested with the unit and integration suites, not yet with real staff accounts — see [Open items](#open-items).

## Running it

| Task              | Command                                                                     |
| ----------------- | --------------------------------------------------------------------------- |
| Dev server        | `npm run dev:brillante` (http://localhost:4200)                             |
| Production build  | `npm run build:brillante`                                                   |
| Unit tests / lint | `npm run test`, `npm run lint`, `npm run typecheck` (they include this app) |

The legacy API base URL lives in `apps/brillante/src/app/environments/environment.ts`
(`apiUrl: https://brillante-production.herokuapp.com`). The production API already answers CORS preflights with
`Access-Control-Allow-Origin: *`, so the dev server can call it directly.

### The backend in development

The new backend answers under `/api`. `npm run dev:brillante` proxies `/api` to `http://localhost:8787`
(`apps/brillante/proxy.conf.json`), where `npm run dev:brillante:worker` serves the Worker (see
[`brillante-backend.md`](brillante-backend.md) for the local database and secrets). To use the deployed Worker instead,
change the proxy `target` locally to `https://brillante.ramiro-0ae.workers.dev` and set `secure: true`,
`changeOrigin: true`; do not commit that.

## How authentication works

1. `/auth/login` is an email and password form. `AuthStore.login()` calls `POST /api/auth/login`; the backend sets the
   HttpOnly access and refresh cookies (`authInterceptor` sends them with every `/api` request). On every protected
   navigation `authGuard` revalidates the session with `GET /api/auth/me`, and `tokenRefreshInterceptor` renews an
   expired access token through `POST /api/auth/refresh`.
2. Users migrated from the legacy system must first choose a password: the onboarding email links to
   `/auth/reset-password/confirm?token=…`; `/auth/reset-password` requests a link, and `forcedPasswordChangeGuard` sends
   anybody flagged `mustChangePassword` to `/auth/change-password`.
3. The legacy API cannot read the cookie session. `legacyTokenInterceptor` asks `GET /api/auth/legacy-token` (through
   `LegacyTokenSession`, in memory only, renewed a minute before it expires) and sends `Authorization: Bearer <token>` to
   the legacy API; a 401 from it triggers one fresh token and one retry.
4. Signing out calls `POST /api/auth/logout` and forgets the legacy token.

The backend identifies roles by the legacy ids (1 to 7), so the role table below keeps working. `userName` is the part of
the email before the `@`, because the new backend stores no user names.

The API authorises by **numeric roles** (admin, owner, counter clerk, repairman, customer, employee, accountant). The
starter authorises by **permissions**, so `src/contracts/permission/legacy-permission.constants.ts` maps each
`module:resource:action` permission to the roles that hold it (taken from the legacy route guards) and `User` derives
`hasPermission()` from the user's roles. Navigation, `permissionGuard` and the UI all use that one catalogue.

### User management

`/dashboard/settings/user-management` runs on the new backend (`GET /api/users`, `PATCH /api/users/{id}`, `DELETE /api/users/{id}`, `POST /api/users/{id}/reset-password`, through `ManagedUsersApi` next to the page), not on the legacy API. It lists every user with their roles and status, edits name, email and roles (only the fields that changed are sent), disables or enables an account, resets its password and deletes it. **Reset password** asks for confirmation, sets a temporary password that the backend emails to the user (in Spanish, with a link to the sign-in page), and the user must change it at the next sign-in (the forced change page). The admin never sees the password. Known gap: the new password is saved before the email is sent, so if the email fails (for example the sender domain is not onboarded yet) the user is locked out until another reset; tracked in the starter as [#637](https://github.com/ResetShop/angular-nx-standalone-starter/issues/637). The action is only offered for active users, since a disabled account cannot sign in. The page is **admin-only**: the backend's user endpoints require `admin:users:*` permissions, which only the Administrator role holds, so the frontend permission `settings:user:manage` is granted to the administrator alone. The backend refuses changing one's own status, deleting one's own account and dropping one's own administrator role, so the signed-in user (who cannot reset their own password either) only gets the edit action, and the drawer does not offer them their own roles. The legacy roles other than Administrator are removable, so they can be unchecked; a role the backend marks as not removable (the Administrator) stays checked once assigned, because the backend refuses removing it.

**Creating users is not available** until the real email provider exists: the backend emails a generated password to a new user, and nobody is added during the migration. The page has no create button and the drawer only edits.

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

Modules (routes under `/dashboard`): `clients`, `repairs`, `cash`, `reports`, `settings`; plus `/dashboard/account` (profile).

## Where this app deviates from `reference-app`

- No SSR and no Playwright project. The Hono API runs as a Cloudflare Worker, with its own Drizzle schema and integration
  tests (see [`brillante-backend.md`](brillante-backend.md)).
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

- Sign-in, the forced password change and the legacy token were exercised by automated tests and the legacy bridge
  smoke script, not yet by a real staff account against the deployed Worker.
- Customers (role 5) were not migrated, so the customer registration branch of the profile page cannot be reached by a
  signed-in customer until they are.
- The Auth0 tenant is no longer used. It can be shut down once the legacy API is retired; nothing in this repository refers to it.
- Role-to-permission mapping follows the legacy route guards; legacy "everyone except accountant" access is narrowed to the
  internal roles, and the legacy finished-registration redirect for customers is not ported.
- Several store methods blocks exceed the 50-line function limit (the same shape as the reference stores); the cold CI and
  lint do not enforce it.
- Story files for shared components are not rendered because Storybook is wired to `reference-app` only.
