import { z } from 'zod'
import { QUERY_DEFAULTS } from '../common/query.constants'
import { authUserSchema } from '../user/user.schemas'
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from './auth.constants'

// ============================================================================
// Request Schemas
// ============================================================================

export const loginRequestSchema = z.object({
	email: z.string().email('Invalid email format'),
	password: z.string().min(QUERY_DEFAULTS.FIELD_MIN_LENGTH, 'Password is required'),
})

/**
 * Body for `POST /api/auth/change-password`. The authenticated user supplies their current
 * password plus the new one. `newPassword` must differ from `oldPassword` and satisfy the
 * shared length bounds; the refinement surfaces the mismatch on the `newPassword` field.
 */
export const changePasswordRequestSchema = z
	.object({
		oldPassword: z.string().min(1, 'Current password is required'),
		newPassword: z
			.string()
			.min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
			.max(MAX_PASSWORD_LENGTH, `Password must be no more than ${MAX_PASSWORD_LENGTH} characters`),
	})
	.refine((data) => data.oldPassword !== data.newPassword, {
		message: 'New password must be different from the current password',
		path: ['newPassword'],
	})

// ============================================================================
// Response Schemas
// ============================================================================

/**
 * Schema for authentication error responses.
 * Maps to the AuthErrorResponse interface from auth.errors.ts.
 *
 * Named "auth" (not "login") because it represents the system's authentication
 * interaction with the user, not the specific login action.
 * See auth.md § Naming: "login" = user action, "auth" = system interaction.
 */
export const authErrorResponseSchema = z.object({
	code: z.string(),
	message: z.string(),
})

export const loginResponseSchema = z.object({
	user: authUserSchema,
	mustChangePassword: z.boolean(),
})

export const refreshResponseSchema = z.object({})

export const changePasswordResponseSchema = z.object({
	message: z.string(),
})

/**
 * `/api/auth/me` returns the same shape `authUserSchema` describes — the authenticated
 * user with full roles + permissions. Aliasing keeps the two endpoints' payloads in sync.
 */
export const meResponseSchema = authUserSchema

export const logoutResponseSchema = z.object({
	message: z.string(),
})

export const cleanupTokensResponseSchema = z.object({
	message: z.string(),
	deletedCount: z.number(),
	incomplete: z.boolean(),
})
