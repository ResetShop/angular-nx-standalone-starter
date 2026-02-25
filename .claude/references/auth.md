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

## Session Validation Lifecycle

```
┌──────────────────────────────────────────────────────────────┐
│  Router evaluates guards on every navigation                 │
│                                                              │
│  authGuard / noAuthGuard call AuthStore.validateSession()    │
│                                                              │
│  1. validateSession() calls GET /api/auth/me                 │
│  2. Browser: cookies sent automatically (withCredentials)    │
│     Server: ssrCookieInterceptor forwards cookies            │
│  3. On success → currentUser patched, guard allows/redirects │
│     On error  → guard redirects to login / allows through    │
└──────────────────────────────────────────────────────────────┘
```

**Key invariant:** Every protected-route navigation validates the session against the backend. The `tokenRefreshInterceptor` transparently handles 401 → refresh → retry inside `validateSession()`, so an expired access token is refreshed before the error reaches the guard. No APP_INITIALIZER is used for auth — the guards own the full validation lifecycle.

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

All interceptors use `new URL().pathname.startsWith('/api/')` for safe pathname matching
that ignores query parameters:

- **`authInterceptor`** — `new URL(req.url, location.origin)` (browser only, `isPlatformBrowser` guard)
- **`tokenRefreshInterceptor`** — `new URL(req.url, location.origin)` (browser only, `isPlatformBrowser` guard)
- **`ssrCookieInterceptor`** — `new URL(req.url, request.url)` (server only, `isPlatformBrowser` guard)

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
