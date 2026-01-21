import type { z } from 'zod';
import type {
	cleanupTokensResponseSchema,
	loginRequestSchema,
	loginResponseSchema,
	logoutResponseSchema,
	meResponseSchema,
	refreshResponseSchema,
} from './auth.schemas';

// ============================================================================
// Request Types
// ============================================================================

/**
 * Login request body type.
 */
export type LoginRequest = z.infer<typeof loginRequestSchema>;

// ============================================================================
// Response Types
// ============================================================================

/**
 * Login response type containing user data and access token.
 */
export type LoginResponse = z.infer<typeof loginResponseSchema>;

/**
 * Refresh token response type containing new access token.
 */
export type RefreshResponse = z.infer<typeof refreshResponseSchema>;

/**
 * Current user (me) response type with roles and permissions.
 */
export type MeResponse = z.infer<typeof meResponseSchema>;

/**
 * Logout response type.
 */
export type LogoutResponse = z.infer<typeof logoutResponseSchema>;

/**
 * Token cleanup response type.
 */
export type CleanupTokensResponse = z.infer<typeof cleanupTokensResponseSchema>;
