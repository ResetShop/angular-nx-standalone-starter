/**
 * Minimum length for CRON_SECRET.
 * 32 characters = 256 bits of entropy when hex-encoded.
 */
export const MIN_CRON_SECRET_LENGTH = 32

/**
 * Default maximum failed login attempts before account lockout.
 * Configurable via AUTH_MAX_FAILED_ATTEMPTS environment variable.
 */
export const DEFAULT_MAX_FAILED_ATTEMPTS = 5

/**
 * Default account lockout duration after max failed attempts.
 * Configurable via AUTH_LOCKOUT_DURATION environment variable.
 * Supports duration formats: "15m", "1h", "30s", "1d"
 */
export const DEFAULT_LOCKOUT_DURATION = '15m'

/**
 * Expiry buffer for refresh token cleanup (duration string notation).
 * Tokens must be expired for at least this duration before deletion,
 * preventing race conditions during active refresh operations.
 */
export const REFRESH_TOKEN_EXPIRY_BUFFER = '1h'

/**
 * Default access token expiry (duration string notation).
 * Configurable via PASETO_ACCESS_TOKEN_EXPIRY environment variable.
 */
export const DEFAULT_ACCESS_TOKEN_EXPIRY = '15m'

/** Lifetime of the HS256 token the legacy API accepts. The legacy API itself never expires its tokens; ours do. */
export const DEFAULT_LEGACY_TOKEN_EXPIRY = '1h'

/**
 * Default refresh token expiry (duration string notation).
 * Configurable via PASETO_REFRESH_TOKEN_EXPIRY environment variable.
 */
export const DEFAULT_REFRESH_TOKEN_EXPIRY = '7d'

/** HttpOnly cookie name for the PASETO refresh token. */
export const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token'

/** HttpOnly cookie name for the PASETO access token. */
export const ACCESS_TOKEN_COOKIE_NAME = 'access_token'

/**
 * Expiry for self-service password-reset tokens (duration string).
 * Tokens are single-use and rejected after this window.
 */
export const PASSWORD_RESET_TOKEN_EXPIRY = '1h'

/**
 * Expiry for the reset links sent when existing users are onboarded in bulk (duration string). Longer than the
 * self-service window because the emails go out together and are read when people get to them.
 */
export const ONBOARDING_RESET_TOKEN_EXPIRY = '1d'

/** Frontend path where users complete a password reset (raw token passed as the `token` query param). */
export const PASSWORD_RESET_PATH = '/auth/reset-password/confirm'

/** Path of the sign-in page, linked from the emails that give a user new credentials. */
export const LOGIN_PATH = '/auth/login'
