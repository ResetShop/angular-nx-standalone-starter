import type { z } from 'zod'
import type {
	changePasswordRequestSchema,
	changePasswordResponseSchema,
	cleanupTokensResponseSchema,
	loginRequestSchema,
	loginResponseSchema,
	logoutResponseSchema,
	meResponseSchema,
	refreshResponseSchema,
} from './auth.schemas'

// ============================================================================
// Request Types
// ============================================================================

export type LoginRequest = z.infer<typeof loginRequestSchema>

export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>

// ============================================================================
// Response Types
// ============================================================================

export type LoginResponse = z.infer<typeof loginResponseSchema>

export type RefreshResponse = z.infer<typeof refreshResponseSchema>

export type ChangePasswordResponse = z.infer<typeof changePasswordResponseSchema>

export type MeResponse = z.infer<typeof meResponseSchema>

export type LogoutResponse = z.infer<typeof logoutResponseSchema>

export type CleanupTokensResponse = z.infer<typeof cleanupTokensResponseSchema>
