<!-- Source: CLAUDE.md | Last updated: 2026-02-12 -->

# Authentication Architecture

## Overview

Authentication uses **HttpOnly cookies** for both access and refresh tokens. JavaScript never reads or stores tokens — the server sets and deletes them via `Set-Cookie` headers. User state lives in memory (NgRx Signal Store) and is restored on each app bootstrap via `GET /api/auth/me`.

## Cookie Strategy

| Cookie          | Type     | Purpose                    | Set by         | Deleted by |
| --------------- | -------- | -------------------------- | -------------- | ---------- |
| `access_token`  | HttpOnly | Authenticates API requests | Login, Refresh | Logout     |
| `refresh_token` | HttpOnly | Obtains new access token   | Login          | Logout     |

**Why HttpOnly cookies over localStorage:**

- XSS cannot read HttpOnly cookies — tokens are invisible to JavaScript
- Cookies are sent automatically on every same-origin request (`withCredentials: true`)
- Works during SSR — cookies from the browser request can be forwarded server-side

## Initialization Lifecycle

```
┌──────────────────────────────────────────────────────────────┐
│  APP_INITIALIZER (initializeAuth)                            │
│  Blocks bootstrap until auth state is resolved               │
│                                                              │
│  1. AuthStore.initialize() calls GET /api/auth/me            │
│  2. Browser: cookies sent automatically (withCredentials)    │
│     Server: ssrCookieInterceptor forwards cookies            │
│  3. On success → currentUser set, isInitialized = true       │
│     On failure → currentUser = null, isInitialized = true    │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  Router evaluates guards (isInitialized is always true)      │
│                                                              │
│  authGuard:   isAuthenticated → allow, else → /auth/login    │
│  noAuthGuard: isAuthenticated → /dashboard, else → allow     │
└──────────────────────────────────────────────────────────────┘
```

**Key invariant:** Guards check `isInitialized()` synchronously. The `toObservable` fallback in guards is a safety net — under normal operation the APP_INITIALIZER guarantees the signal is `true` before any guard runs.

## Interceptor Chain

Interceptors are registered in two configs and merged via `mergeApplicationConfig`:

**`app.config.ts` (both platforms):**

| Order | Interceptor               | Purpose                                            |
| ----- | ------------------------- | -------------------------------------------------- |
| 1     | `authInterceptor`         | Adds `withCredentials: true` for `/api/` requests  |
| 2     | `tokenRefreshInterceptor` | Catches 401s, refreshes token, retries the request |

**`app.config.server.ts` (server only):**

| Order | Interceptor            | Purpose                                                      |
| ----- | ---------------------- | ------------------------------------------------------------ |
| 3     | `ssrCookieInterceptor` | Forwards browser cookies to outgoing API requests during SSR |

### URL matching

All interceptors use `req.url.includes('/api/')` — **not** `startsWith`. During SSR, Angular resolves relative URLs to absolute (e.g., `/api/auth/me` becomes `http://localhost:4200/api/auth/me`). Using `includes` handles both forms.

### Token refresh flow (browser only)

The `tokenRefreshInterceptor` is disabled during SSR because `Set-Cookie` headers on the API response never reach the browser when the request originates from the SSR HTTP client.

```
Request fails with 401
    │
    ├── Is /api/auth/refresh? → logout + redirect (session dead)
    ├── Is /api/auth/login?   → pass through (invalid credentials)
    │
    ├── Is refresh in progress? → wait for it, then retry original request
    │
    └── Start new refresh:
        ├── POST /api/auth/refresh (cookie sent automatically)
        ├── Success → completeTokenRefresh(), retry original request
        └── Failure → failTokenRefresh(), logout + redirect
```

## Server-Side Rendering

### Route rendering modes

Guarded routes use `RenderMode.Client` to avoid SSR latency for authenticated content. All other routes use `RenderMode.Server`. This is configured in `app.routes.server.ts` by filtering `appRoutes` for routes with `canActivate` guards.

### Cookie forwarding

During SSR, `HttpClient` does not automatically include browser cookies. The `ssrCookieInterceptor` reads cookies from Angular's `REQUEST` injection token (the original Express/Node request) and clones outgoing `/api/` requests with a `Cookie` header.

## Backend Middleware

The `verifyAccessToken` Hono middleware reads the `access_token` cookie via `getCookie(c, 'access_token')` and verifies it as a PASETO token. On success, it attaches the decoded user payload to the Hono context. On failure, it returns 401.

## Key Files

| File                                                    | Role                                    |
| ------------------------------------------------------- | --------------------------------------- |
| `src/app/store/auth/auth.store.ts`                      | Auth state (Signal Store)               |
| `src/app/store/auth/auth.initializer.ts`                | APP_INITIALIZER factory                 |
| `src/app/store/auth/auth.types.ts`                      | State shape and initial values          |
| `src/app/interceptors/auth.interceptor.ts`              | Adds `withCredentials` for API requests |
| `src/app/interceptors/token-refresh.interceptor.ts`     | 401 → refresh → retry                   |
| `src/app/interceptors/ssr-cookie.interceptor.ts`        | Forwards cookies during SSR             |
| `src/app/guards/auth.guard.ts`                          | Protects authenticated routes           |
| `src/app/guards/no-auth.guard.ts`                       | Redirects authenticated users away      |
| `src/app/domain/auth/auth.mapper.ts`                    | Maps API responses to domain models     |
| `src/app/providers/auth/auth.ts`                        | AuthApiService — HTTP calls             |
| `src/api/middlewares/verify-access-token.middleware.ts` | Backend cookie validation               |
| `src/api/modules/auth/auth.controller.ts`               | Login/logout/refresh endpoints          |
