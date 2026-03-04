# Authentication System

This document describes the authentication system implemented in this Angular + Hono starter repository using PASETO (Platform-Agnostic Security Tokens) for secure, stateless authentication.

## Overview

The authentication system uses a dual-token approach:

- **Access Token**: Short-lived PASETO token (default: 15 minutes) for API authentication
- **Refresh Token**: Long-lived PASETO token (default: 7 days) for obtaining new access tokens

## Why PASETO over JWT?

PASETO was chosen over JWT for the following reasons:

1. **No Algorithm Confusion**: PASETO doesn't allow algorithm selection in the token header, preventing algorithm confusion attacks
2. **Versioned Protocols**: Uses versioned protocols (v3, v4) with modern, secure cryptography
3. **Simpler API**: Fewer configuration options means fewer ways to misconfigure
4. **Strong Defaults**: v3.local uses AES-256-CTR for encryption with HMAC-SHA384 for authentication in an Encrypt-then-MAC construction

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Angular)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐    ┌────────────────────┐    ┌──────────────────────┐  │
│  │   Auth Provider │    │  Auth Interceptor  │    │ Token Refresh        │  │
│  │                 │    │                    │    │ Interceptor          │  │
│  │ - login()       │    │ - Attaches Bearer  │    │                      │  │
│  │ - logout()      │    │   token to API     │    │ - Handles 401 errors │  │
│  │ - refreshToken()│    │   requests         │    │ - Mutex pattern for  │  │
│  │ - currentUser   │    │ - Sets credentials │    │   concurrent refresh │  │
│  └─────────────────┘    └────────────────────┘    └──────────────────────┘  │
│                                                                              │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    │ HTTP Requests
                                    │
┌───────────────────────────────────▼─────────────────────────────────────────┐
│                              BACKEND (Hono)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Authentication Middleware                          │   │
│  │                                                                       │   │
│  │  - Verifies access token on protected routes                         │   │
│  │  - Extracts user info and attaches to request context                │   │
│  │  - Public paths: /api/auth/login                                     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────┐    ┌────────────────────┐    ┌──────────────────────┐  │
│  │ Auth Controller │    │   Auth Service     │    │   PASETO Service     │  │
│  │                 │    │                    │    │                      │  │
│  │ POST /login     │───►│ - authenticate()   │───►│ - generateAccessToken│  │
│  │ POST /refresh   │    │ - refreshToken()   │    │ - generateRefreshTok │  │
│  │ POST /logout    │    │ - logout()         │    │ - verifyAccessToken  │  │
│  │                 │    │                    │    │ - verifyRefreshToken │  │
│  └─────────────────┘    └────────────────────┘    └──────────────────────┘  │
│                                   │                                          │
│                                   ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        Database (Postgres)                              │   │
│  │                                                                       │   │
│  │  ┌────────────┐    ┌──────────────────┐    ┌─────────────────────┐   │   │
│  │  │   users    │    │  authentication  │    │   refresh_tokens    │   │   │
│  │  │            │    │                  │    │                     │   │   │
│  │  │ - id       │    │ - user_id (FK)   │    │ - user_id (FK)      │   │   │
│  │  │ - email    │    │ - password_hash  │    │ - token_hash        │   │   │
│  │  │ - status   │    │                  │    │ - token_family      │   │   │
│  │  │ - deleted_at│   │                  │    │ - expires_at        │   │   │
│  │  │            │    │                  │    │ - is_revoked        │   │   │
│  │  └────────────┘    └──────────────────┘    └─────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Authentication Flow

### Login Flow

```
1. User submits email/password
2. Backend validates credentials
3. Backend checks user status is active (rejects disabled or deleted)
4. Backend generates access token (15min) and refresh token (7 days)
5. Refresh token is stored in database (hashed)
6. Refresh token is set as HttpOnly cookie
7. Access token is returned in response body
8. Frontend stores access token in memory/localStorage
```

### API Request Flow

```
1. Frontend makes API request
2. Auth interceptor attaches Authorization header with access token
3. Backend middleware verifies access token
4. If valid, request proceeds to handler
5. If 401, token refresh interceptor kicks in
```

### Token Refresh Flow

```
1. API returns 401 Unauthorized
2. Token refresh interceptor catches error
3. If refresh already in progress, wait for it (mutex pattern)
4. Otherwise, call /api/auth/refresh
5. Backend reads refresh token from HttpOnly cookie
6. Backend validates refresh token
7. Backend generates new access + refresh tokens
8. Old refresh token is revoked
9. New tokens are returned/set
10. Original request is retried with new access token
```

### Logout Flow

```
1. Frontend calls logout()
2. User state is cleared immediately (for responsive UI)
3. Backend request is sent (no access token needed)
4. Backend reads refresh token from HttpOnly cookie
5. Backend revokes all refresh tokens for user
6. Backend deletes refresh token cookie
7. Logout always succeeds (fail-safe design)
```

## Security Features

### Token Security

- **PASETO v3.local**: Uses AES-256-CTR for encryption with HMAC-SHA384 for authentication (Encrypt-then-MAC)
- **Token Hashing**: Refresh tokens are hashed (SHA-256) before database storage
- **Token Families**: Enables detection of token reuse attacks
- **Key Validation**: Enforces minimum 32-byte (256-bit) secret key

### Cookie Security

| Attribute  | Value           | Purpose                                     |
| ---------- | --------------- | ------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `httpOnly` | `true`          | Prevents JavaScript access (XSS protection) |
| `secure`   | `COOKIE_SECURE` | No                                          | "true" | Controls the `secure` flag on cookies. **MUST be "true" in production** (requires HTTPS). Only set to "false" for local HTTP development. |
| `sameSite` | `Strict`        | CSRF protection                             |
| `path`     | `/`             | Available site-wide                         |
| `maxAge`   | 7 days          | Matches refresh token expiry                |

### Account Protection

- **Deleted accounts**: Return generic "Invalid credentials" (prevents enumeration)
- **Disabled accounts**: Return specific "Account is disabled" message
- **Rate limiting**: (Recommended) Should be added for production
- **Failed login tracking**: (TODO) Increment failed attempts counter

### Race Condition Protection

The token refresh interceptor implements a mutex pattern to prevent multiple concurrent refresh attempts. The state is managed in the `Auth` service (not module-level) to ensure proper cleanup when the Angular app is destroyed and recreated:

```typescript
// Auth service manages refresh state
public refreshTokenSubject = new BehaviorSubject<string | null>(null);
readonly isTokenRefreshing = signal(false);

// Interceptor checks service state
if (authService.isTokenRefreshing()) {
  return authService.refreshTokenSubject.pipe(
    filter(token => token !== null),
    take(1),
    switchMap(token => /* retry with new token */)
  );
}
```

## Environment Variables

| Variable                      | Required | Default                 | Description                                             |
| ----------------------------- | -------- | ----------------------- | ------------------------------------------------------- |
| `PASETO_SECRET_KEY`           | Yes      | -                       | 32-byte hex-encoded secret key                          |
| `PASETO_ISSUER`               | No       | "Reset Shop"            | Token issuer claim                                      |
| `PASETO_ACCESS_TOKEN_EXPIRY`  | No       | "15m"                   | Access token lifetime                                   |
| `PASETO_REFRESH_TOKEN_EXPIRY` | No       | "7d"                    | Refresh token lifetime                                  |
| `PASETO_CLOCK_TOLERANCE`      | No       | "1m"                    | Clock drift tolerance for token validation              |
| `COOKIE_SECURE`               | No       | "true"                  | Set to "false" to disable secure cookies (dev only)     |
| `CORS_ORIGIN`                 | No       | "http://localhost:4200" | Allowed origin for CORS requests                        |
| `CORS_MAX_AGE`                | No       | 86400                   | Preflight cache duration in seconds (default: 24h)      |
| `TOKEN_CLEANUP_INTERVAL_MS`   | No       | 86400000                | Cleanup interval in ms (min: 1m, max: 7d, default: 24h) |
| `IS_SERVERLESS`               | No       | "false"                 | Adapts for serverless (see Connection Pooling below)    |
| `CRON_SECRET`                 | No       | -                       | Secret for scheduled jobs to call cleanup endpoint      |

### Generating a Secret Key

```bash
# Using OpenSSL (recommended)
openssl rand -hex 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## API Endpoints

### POST /api/auth/login

Authenticate user with email and password.

**Request:**

```json
{
	"email": "user@example.com",
	"password": "password123"
}
```

**Response (200):**

```json
{
	"user": {
		"id": 1,
		"email": "user@example.com",
		"firstName": "John",
		"lastName": "Doe"
	},
	"token": "v3.local.xxx..."
}
```

**Response (401):**

```json
{
	"error": "Invalid credentials"
}
```

### POST /api/auth/refresh

Exchange refresh token for new access + refresh tokens. Refresh token is read from HttpOnly cookie.

**Response (200):**

```json
{
	"token": "v3.local.xxx..."
}
```

### GET /api/auth/me

Token introspection endpoint. Returns the current authenticated user's information from the token. Useful for verifying token validity and session management.

**Response (200):**

```json
{
	"id": "1",
	"email": "user@example.com",
	"firstName": "John",
	"lastName": "Doe"
}
```

**Response (401):**

```json
{
	"error": "Unauthorized"
}
```

### POST /api/auth/logout

Revoke all refresh tokens for the user. Uses refresh token from HttpOnly cookie (no access token required). Always succeeds for fail-safe logout.

**Response (200):**

```json
{
	"message": "Logged out successfully"
}
```

### GET /api/auth/cleanup-tokens

Manually trigger expired token cleanup. Requires either `CRON_SECRET` authorization or an authenticated user session. Useful for Vercel Cron Jobs or manual maintenance.

**Authorization:** Either `Authorization: Bearer <CRON_SECRET>` header or authenticated user session.

**Response (200) - Cleanup completed:**

```json
{
	"message": "Cleanup completed",
	"deletedCount": 5,
	"incomplete": false
}
```

**Response (200) - Cleanup incomplete (hit batch limit):**

```json
{
	"message": "Cleanup incomplete - max batch limit reached",
	"deletedCount": 100000,
	"incomplete": true
}
```

**Response (200) - Cleanup already in progress:**

```json
{
	"message": "Cleanup already in progress",
	"deletedCount": 0,
	"incomplete": false
}
```

**Response (401):**

```json
{
	"error": "Unauthorized"
}
```

## Token Cleanup

Expired refresh tokens are automatically cleaned up to prevent database bloat.

### Automatic Cleanup (Traditional Servers)

When running on a traditional server (not serverless), a background job automatically cleans up expired tokens at a configurable interval (default: 24 hours).

Configure the interval with `TOKEN_CLEANUP_INTERVAL_MS` environment variable.

### Manual Cleanup (Serverless Environments)

In serverless environments where background jobs are not supported, use your platform's cron/scheduler feature to call the cleanup endpoint periodically.

**1. Generate a cron secret:**

```bash
openssl rand -hex 32
```

**2. Add `CRON_SECRET` to your environment variables.**

**3. Configure your platform's cron scheduler to call the endpoint:**

```
GET /api/auth/cleanup-tokens
Authorization: Bearer <your-cron-secret>
Schedule: Every hour (e.g., "0 * * * *")
```

**Vercel Example:**

**1. Set required environment variables in Vercel dashboard:**

- `IS_SERVERLESS=true` - Disables background cron jobs and uses connection-pool-safe locks
- `CRON_SECRET` - Your generated secret for cron authentication (minimum 32 characters)

**2. Add to your `vercel.json`:**

```json
{
	"crons": [
		{
			"path": "/api/auth/cleanup-tokens",
			"schedule": "0 * * * *"
		}
	]
}
```

Vercel automatically includes the `CRON_SECRET` as the `Authorization: Bearer <CRON_SECRET>` header when calling cron endpoints.

The endpoint verifies the `CRON_SECRET` before executing. Authenticated users can also trigger cleanup manually.

### Monitoring Token Cleanup

The cleanup process outputs structured JSON logs for monitoring:

```json
{
	"event": "token_cleanup",
	"deletedCount": 5,
	"durationMs": 123,
	"incomplete": false,
	"timestamp": "2026-01-13T12:00:00.000Z"
}
```

**Key Metrics to Monitor:**

| Metric         | Description            | Action Threshold                  |
| -------------- | ---------------------- | --------------------------------- |
| `deletedCount` | Tokens deleted per run | Sudden spikes may indicate issues |
| `durationMs`   | Cleanup duration       | >30s may need smaller batches     |
| `incomplete`   | Hit batch limit        | `true` requires attention         |

**Configuration Tuning:**

- If `incomplete: true` appears regularly, increase `TOKEN_CLEANUP_MAX_BATCH_COUNT` or run cleanup more frequently
- If `durationMs` is consistently high (>10s), consider reducing `TOKEN_CLEANUP_BATCH_SIZE` to minimize lock time
- If `deletedCount` is consistently 0, cleanup frequency can be reduced to save resources

**Alerting Recommendations:**

1. **Alert on `incomplete: true`** - Indicates token backlog building up
2. **Alert if cleanup fails** - Check logs for database connectivity issues
3. **Monitor `durationMs` trend** - Increasing times may indicate database performance issues

### Connection Pooling Considerations

The token cleanup process uses PostgreSQL advisory locks to prevent concurrent cleanup runs across multiple server instances. The lock behavior adapts based on the `IS_SERVERLESS` environment variable:

| Environment                         | Lock Type                                        | Behavior                                                |
| ----------------------------------- | ------------------------------------------------ | ------------------------------------------------------- |
| Traditional (`IS_SERVERLESS=false`) | Session-level (`pg_try_advisory_lock`)           | Lock persists until explicitly released or session ends |
| Serverless (`IS_SERVERLESS=true`)   | Transaction-scoped (`pg_try_advisory_xact_lock`) | Lock auto-releases when request completes               |

**Why This Matters:**

In serverless environments with connection pooling (e.g., PgBouncer in transaction mode, Neon, Supabase pooler):

- Database connections are shared across requests
- Session-level locks can "leak" to subsequent requests using the same connection
- Transaction-scoped locks prevent this by automatically releasing when the transaction ends

**Configuration:**

Set `IS_SERVERLESS=true` when deploying to:

- Vercel (serverless functions)
- AWS Lambda
- Any environment using PgBouncer in transaction mode
- Any managed database with connection pooling

## Database Schema

### refresh_tokens Table

```sql
CREATE TABLE refresh_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL UNIQUE,
  token_family TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Frontend Integration

### Auth Provider

The `Auth` provider (`src/app/providers/auth/auth.ts`) manages authentication state:

```typescript
// Login
auth.login({ email, password }).subscribe({
	next: () => console.log('Logged in'),
	error: (err) => console.error(err),
});

// Check authentication
if (auth.isAuthenticated()) {
	// User is logged in
}

// Get current user
const user = auth.currentUser();

// Logout
auth.logout();
```

### Interceptors

Two HTTP interceptors handle authentication:

1. **Auth Interceptor** (`auth.interceptor.ts`): Attaches Bearer token to API requests
2. **Token Refresh Interceptor** (`token-refresh.interceptor.ts`): Handles 401 errors and token refresh

### Route Guards

- **authGuard**: Protects routes requiring authentication
- **noAuthGuard**: Prevents authenticated users from accessing login/register pages

## Security Recommendations

### For Production

1. **Enable HTTPS**: Ensure `secure: true` for cookies in production
2. **Add Rate Limiting**: Implement rate limiting on auth endpoints
3. **Monitor Failed Logins**: Track and alert on suspicious login patterns
4. **Rotate Secret Keys**: Have a key rotation strategy
5. **Set Appropriate Token Lifetimes**: Balance security vs. UX

## CORS Configuration

The authentication system uses HttpOnly cookies for refresh tokens, which requires proper CORS configuration when the frontend and backend are on different origins.

### How It Works

CORS middleware is configured in `server.ts` with the following settings:

```typescript
cors({
	origin: process.env['CORS_ORIGIN'] || 'http://localhost:4200',
	credentials: true,
	allowHeaders: ['Content-Type', 'Authorization'],
	allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	maxAge: Number(process.env['CORS_MAX_AGE']) || 86400, // Default: 24 hours
});
```

### Key Points

1. **Credentials Support**: `credentials: true` allows cookies to be sent/received cross-origin
2. **Specific Origin Required**: When using credentials, the origin **cannot** be `*` (wildcard) - it must be a specific domain
3. **Preflight Caching**: `maxAge: 86400` caches preflight responses for 24 hours to reduce OPTIONS requests

### Production Deployment

When deploying to production, set the `CORS_ORIGIN` environment variable to your frontend domain:

```bash
# Single origin
export CORS_ORIGIN=https://app.example.com
```

### Common Issues

#### Cookies Not Being Sent

If cookies aren't being sent with requests:

1. Verify `CORS_ORIGIN` matches your frontend's exact origin (including protocol and port)
2. Ensure the frontend is using `withCredentials: true` in HTTP requests
3. Check that `COOKIE_SECURE` is set appropriately (must be `true` for HTTPS)

#### Preflight Failures

If OPTIONS requests are failing:

1. Verify the CORS middleware is positioned early in the middleware chain
2. Check that your reverse proxy (if any) is forwarding OPTIONS requests

### Token Storage (Frontend)

Currently, access tokens are stored in localStorage. Consider:

- **sessionStorage**: Clears on browser close (more secure, less convenient)
- **In-memory only**: Most secure but lost on page refresh
- **Document trade-offs**: Understand XSS risks with localStorage

## Troubleshooting

### "PASETO_SECRET_KEY not configured"

Set the environment variable with a valid 32-byte hex key:

```bash
export PASETO_SECRET_KEY=$(openssl rand -hex 32)
```

### "Invalid or expired token"

- Check token hasn't expired
- Verify PASETO_SECRET_KEY is the same for generation and verification
- Ensure clock synchronization between client and server

### Token Refresh Loops

If you see repeated refresh attempts:

1. Check refresh token cookie is being set properly
2. Verify `sameSite` and `secure` cookie settings
3. Check for clock drift issues

## Related Files

- `src/api/services/paseto.service.ts` - PASETO token generation/verification
- `src/api/modules/auth/auth.service.ts` - Authentication business logic
- `src/api/modules/auth/auth.controller.ts` - Auth API endpoints
- `src/api/middlewares/verify-access-token.middleware.ts` - Access token middleware
- `src/app/providers/auth/auth.ts` - Frontend auth provider
- `src/app/interceptors/auth.interceptor.ts` - Frontend auth interceptor
- `src/app/interceptors/token-refresh.interceptor.ts` - Frontend token refresh
