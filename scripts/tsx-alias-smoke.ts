/**
 * tsx alias-resolution smoke test.
 *
 * Run via `npm run ci:tsx-smoke` (and as Stage 0 of `npm run ci`).
 *
 * Imports cover both app-scoped alias families declared in
 * `apps/reference-app/tsconfig.json` so that tsx fails loudly if either fails
 * to resolve under that tsconfig:
 *
 *   - `@contracts/*` — exercised directly here AND transitively by `@schema/user`
 *     (`src/db/schema/user.ts` imports `@contracts/user/user.constants`). This is
 *     the family that triggered #319 — `npm run drizzle:seed` was failing with
 *     `ERR_MODULE_NOT_FOUND: Cannot find package '@contracts/user'` because tsx
 *     was resolving against `tsconfig.base.json`, where `@contracts/*` is not
 *     declared.
 *
 *   - `@schema/*` — not currently used by tsx-invoked scripts (`seed.ts` and
 *     `sync-permissions.ts` use relative `./schema/...` imports), but declared
 *     in the app tsconfig and used heavily by the API layer. Covering it here
 *     guards against a future regression that breaks `@schema/*` resolution
 *     under tsx, ahead of any tsx caller migrating to it.
 *
 * Both imports are side-effect-only — the modules' top-level code is pure data
 * (frozen objects, drizzle table definitions). The smoke fails iff tsx cannot
 * resolve one of the aliased specifiers at module-load time.
 */
import '@contracts/user/user.constants'
import '@schema/user'
