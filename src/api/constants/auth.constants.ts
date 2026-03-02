/**
 * Minimum length for CRON_SECRET.
 * 32 characters = 256 bits of entropy when hex-encoded.
 */
export const MIN_CRON_SECRET_LENGTH = 32;

/**
 * Default maximum failed login attempts before account lockout.
 * Configurable via AUTH_MAX_FAILED_ATTEMPTS environment variable.
 */
export const DEFAULT_MAX_FAILED_ATTEMPTS = 5;

/**
 * Default account lockout duration after max failed attempts.
 * Configurable via AUTH_LOCKOUT_DURATION environment variable.
 * Supports duration formats: "15m", "1h", "30s", "1d"
 */
export const DEFAULT_LOCKOUT_DURATION = '15m';

/**
 * Number of salt rounds used for bcrypt password hashing.
 * Higher values increase security but also computation time.
 */
export const BCRYPT_SALT_ROUNDS = 12;

/** HttpOnly cookie name for the PASETO refresh token. */
export const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';

/** HttpOnly cookie name for the PASETO access token. */
export const ACCESS_TOKEN_COOKIE_NAME = 'access_token';
