import { getInternalErrorMessage, InternalAuthErrorCode } from '@contracts/auth/auth.errors'
import { UserStatus } from '@contracts/user/user.constants'
import { fn } from '@test-utils'
import { parseDurationToMs } from '@utils/duration'
import { hash } from 'bcryptjs'
import { createHash } from 'crypto'
import { DEFAULT_LOCKOUT_DURATION } from '../../constants/auth.constants'
import { InMemoryPasetoService } from '../../services/paseto/paseto.service.mock'
import { InMemoryUserRepository } from '../user/user.repository.mock'
import { AuthService } from './auth.service'
import { InMemoryAuthenticationRepository } from './authentication.repository.mock'
import { InMemoryRefreshTokenRepository } from './refresh-token.repository.mock'

describe('AuthService', () => {
	let authService: AuthService
	let mockUserRepo: InMemoryUserRepository
	let mockAuthRepo: InMemoryAuthenticationRepository
	let mockRefreshTokenRepo: InMemoryRefreshTokenRepository
	let mockPasetoService: InMemoryPasetoService

	// Test data
	const testPassword = 'password123'
	let testPasswordHash: string

	const testUser = {
		id: 1,
		email: 'test@example.com',
		firstName: 'Test',
		lastName: 'User',
		status: UserStatus.ACTIVE,
	}

	const expectedAuthUser = {
		id: testUser.id,
		email: testUser.email,
		firstName: testUser.firstName,
		lastName: testUser.lastName,
	}

	beforeAll(async () => {
		// Create a real bcrypt hash for testing
		testPasswordHash = await hash(testPassword, 10)
	})

	beforeEach(() => {
		mockUserRepo = new InMemoryUserRepository()
		mockAuthRepo = new InMemoryAuthenticationRepository()
		mockRefreshTokenRepo = new InMemoryRefreshTokenRepository()
		mockPasetoService = new InMemoryPasetoService()

		authService = new AuthService({
			userRepository: mockUserRepo,
			authRepository: mockAuthRepo,
			refreshTokenRepository: mockRefreshTokenRepo,
			pasetoService: mockPasetoService,
		})
	})

	afterEach(() => {
		mockUserRepo.clear()
		mockAuthRepo.clear()
		mockRefreshTokenRepo.clear()
		mockPasetoService.clear()
	})

	describe('authenticate', () => {
		beforeEach(() => {
			// Set up valid user and auth record
			mockUserRepo.addUser(testUser)
			mockAuthRepo.addAuthRecord(testUser.id, { passwordHash: testPasswordHash })
		})

		it('should return user, access token, and refresh token on successful authentication', async () => {
			const result = await authService.authenticate({
				email: testUser.email,
				password: testPassword,
			})

			expect(result.user).toEqual(expectedAuthUser)
			expect(result.token).toBe('mock-access-token-1')
			expect(result.refreshToken).toBe('mock-refresh-token-1')
		})

		it('should generate access token with correct payload', async () => {
			await authService.authenticate({
				email: testUser.email,
				password: testPassword,
			})

			expect(mockPasetoService.generatedAccessTokens).toHaveLength(1)
			expect(mockPasetoService.generatedAccessTokens[0].payload).toEqual({
				sub: testUser.id.toString(),
				email: testUser.email,
				firstName: testUser.firstName,
				lastName: testUser.lastName,
			})
		})

		it('should store refresh token in repository', async () => {
			await authService.authenticate({
				email: testUser.email,
				password: testPassword,
			})

			expect(mockRefreshTokenRepo.createdTokens).toHaveLength(1)
			expect(mockRefreshTokenRepo.createdTokens[0].userId).toBe(testUser.id)
		})

		it('should cleanup expired tokens on successful authentication', async () => {
			await authService.authenticate({
				email: testUser.email,
				password: testPassword,
			})

			expect(mockRefreshTokenRepo.deletedExpiredForUsers).toContain(testUser.id)
		})

		it('should throw INVALID_CREDENTIALS error when user not found', async () => {
			await expect(
				authService.authenticate({
					email: 'nonexistent@example.com',
					password: testPassword,
				}),
			).rejects.toThrow(getInternalErrorMessage(InternalAuthErrorCode.INVALID_CREDENTIALS))
		})

		it('should throw INVALID_CREDENTIALS error when user is deleted', async () => {
			mockUserRepo.clear()
			mockUserRepo.addUser({ ...testUser, status: UserStatus.DELETED })

			await expect(
				authService.authenticate({
					email: testUser.email,
					password: testPassword,
				}),
			).rejects.toThrow(getInternalErrorMessage(InternalAuthErrorCode.INVALID_CREDENTIALS))
		})

		it('should throw INVALID_CREDENTIALS error when user is disabled', async () => {
			mockUserRepo.clear()
			mockUserRepo.addUser({ ...testUser, status: UserStatus.DISABLED })

			await expect(
				authService.authenticate({
					email: testUser.email,
					password: testPassword,
				}),
			).rejects.toThrow(getInternalErrorMessage(InternalAuthErrorCode.INVALID_CREDENTIALS))
		})

		it('should throw INVALID_CREDENTIALS error when auth record not found', async () => {
			mockAuthRepo.clear()

			await expect(
				authService.authenticate({
					email: testUser.email,
					password: testPassword,
				}),
			).rejects.toThrow(getInternalErrorMessage(InternalAuthErrorCode.INVALID_CREDENTIALS))
		})

		it('should throw INVALID_CREDENTIALS error when password does not match', async () => {
			await expect(
				authService.authenticate({
					email: testUser.email,
					password: 'wrongpassword',
				}),
			).rejects.toThrow(getInternalErrorMessage(InternalAuthErrorCode.INVALID_CREDENTIALS))
		})

		it('should return mustChangePassword as false for normal users', async () => {
			const result = await authService.authenticate({
				email: testUser.email,
				password: testPassword,
			})

			expect(result.mustChangePassword).toBe(false)
		})

		it('should return mustChangePassword as true when auth record has mustChangePassword set to true', async () => {
			mockAuthRepo.clear()
			mockAuthRepo.addAuthRecord(testUser.id, { passwordHash: testPasswordHash, mustChangePassword: true })

			const result = await authService.authenticate({
				email: testUser.email,
				password: testPassword,
			})

			expect(result.mustChangePassword).toBe(true)
		})
	})

	describe('account lockout', () => {
		beforeEach(() => {
			mockUserRepo.addUser(testUser)
			mockAuthRepo.addAuthRecord(testUser.id, { passwordHash: testPasswordHash })
		})

		it('should increment failed attempts on wrong password', async () => {
			await expect(
				authService.authenticate({
					email: testUser.email,
					password: 'wrongpassword',
				}),
			).rejects.toThrow(getInternalErrorMessage(InternalAuthErrorCode.INVALID_CREDENTIALS))

			expect(mockAuthRepo.incrementedUsers).toContain(testUser.id)
		})

		it('should not increment failed attempts when user not found', async () => {
			await expect(
				authService.authenticate({
					email: 'nonexistent@example.com',
					password: 'anypassword',
				}),
			).rejects.toThrow(getInternalErrorMessage(InternalAuthErrorCode.INVALID_CREDENTIALS))

			// Should not increment for non-existent users (timing attack prevention)
			expect(mockAuthRepo.incrementedUsers).not.toContain(testUser.id)
			expect(mockAuthRepo.incrementedUsers).toHaveLength(0)
		})

		it('should lock account after max failed attempts', async () => {
			// Set up user with 4 failed attempts (one below threshold)
			mockAuthRepo.clear()
			mockAuthRepo.addAuthRecord(testUser.id, {
				passwordHash: testPasswordHash,
				failedLoginAttempts: 4,
			})

			// This should be the 5th attempt, triggering lockout
			await expect(
				authService.authenticate({
					email: testUser.email,
					password: 'wrongpassword',
				}),
			).rejects.toThrow(getInternalErrorMessage(InternalAuthErrorCode.INVALID_CREDENTIALS))

			expect(mockAuthRepo.lockedUsers).toHaveLength(1)
			expect(mockAuthRepo.lockedUsers[0].userId).toBe(testUser.id)
		})

		it('should throw ACCOUNT_LOCKED error when account is locked', async () => {
			// Set up user with active lockout
			mockAuthRepo.clear()
			mockAuthRepo.addAuthRecord(testUser.id, {
				passwordHash: testPasswordHash,
				failedLoginAttempts: 5,
				lockedUntil: new Date(Date.now() + parseDurationToMs(DEFAULT_LOCKOUT_DURATION)),
			})

			await expect(
				authService.authenticate({
					email: testUser.email,
					password: testPassword, // Even correct password should fail
				}),
			).rejects.toThrow(getInternalErrorMessage(InternalAuthErrorCode.ACCOUNT_LOCKED))
		})

		it('should allow login after lockout expires', async () => {
			// Set up user with expired lockout
			mockAuthRepo.clear()
			mockAuthRepo.addAuthRecord(testUser.id, {
				passwordHash: testPasswordHash,
				failedLoginAttempts: 5,
				lockedUntil: new Date(Date.now() - parseDurationToMs('1s')), // 1 second ago (expired)
			})

			const result = await authService.authenticate({
				email: testUser.email,
				password: testPassword,
			})

			expect(result.user).toEqual(expectedAuthUser)
			expect(result.token).toBeDefined()
		})

		it('should reset failed attempts on successful login', async () => {
			// Set up user with some failed attempts (but not locked)
			mockAuthRepo.clear()
			mockAuthRepo.addAuthRecord(testUser.id, {
				passwordHash: testPasswordHash,
				failedLoginAttempts: 3,
			})

			await authService.authenticate({
				email: testUser.email,
				password: testPassword,
			})

			expect(mockAuthRepo.resetUsers).toContain(testUser.id)
		})

		it('should successfully authenticate when counter is zero', async () => {
			// User with no failed attempts
			const result = await authService.authenticate({
				email: testUser.email,
				password: testPassword,
			})

			// Assert on observable outcome
			expect(result.user).toEqual(expectedAuthUser)
			expect(result.token).toBeDefined()
			expect(result.refreshToken).toBeDefined()

			// Verify auth record state remains at zero
			const authRecord = await mockAuthRepo.findByUserId(testUser.id)
			expect(authRecord?.failedLoginAttempts).toBe(0)
		})

		it('should respect custom AUTH_MAX_FAILED_ATTEMPTS env variable', async () => {
			const originalEnv = process.env['AUTH_MAX_FAILED_ATTEMPTS']
			process.env['AUTH_MAX_FAILED_ATTEMPTS'] = '3'

			try {
				// Set up user with 2 failed attempts
				mockAuthRepo.clear()
				mockAuthRepo.addAuthRecord(testUser.id, {
					passwordHash: testPasswordHash,
					failedLoginAttempts: 2,
				})

				// This should be the 3rd attempt, triggering lockout with custom threshold
				await expect(
					authService.authenticate({
						email: testUser.email,
						password: 'wrongpassword',
					}),
				).rejects.toThrow(getInternalErrorMessage(InternalAuthErrorCode.INVALID_CREDENTIALS))

				expect(mockAuthRepo.lockedUsers).toHaveLength(1)
			} finally {
				if (originalEnv === undefined) {
					delete process.env['AUTH_MAX_FAILED_ATTEMPTS']
				} else {
					process.env['AUTH_MAX_FAILED_ATTEMPTS'] = originalEnv
				}
			}
		})
	})

	describe('refreshToken', () => {
		const existingRefreshToken = 'existing-refresh-token'
		const tokenFamily = 'test-token-family'

		beforeEach(() => {
			mockUserRepo.addUser(testUser)
			mockRefreshTokenRepo.setUser(testUser)

			// Set up the mock to verify the refresh token
			mockPasetoService.setRefreshTokenPayload(existingRefreshToken, {
				sub: testUser.id.toString(),
				tokenFamily,
			})

			// Add the token to the repository
			const tokenHash = createHash('sha256').update(existingRefreshToken).digest('hex')
			mockRefreshTokenRepo.addToken(tokenHash, {
				userId: testUser.id,
				tokenFamily,
				isRevoked: false,
				expiresAt: new Date(Date.now() + parseDurationToMs('1d')), // 1 day from now
			})
		})

		it('should return new access and refresh tokens', async () => {
			const result = await authService.refreshToken(existingRefreshToken)

			expect(result.token).toBe('mock-access-token-1')
			expect(result.refreshToken).toBe('mock-refresh-token-1')
		})

		it('should revoke old token and create new one (token rotation)', async () => {
			await authService.refreshToken(existingRefreshToken)

			// Old token should be revoked
			expect(mockRefreshTokenRepo.revokedTokenIds).toHaveLength(1)

			// New token should be created
			expect(mockRefreshTokenRepo.createdTokens).toHaveLength(1)
			expect(mockRefreshTokenRepo.createdTokens[0].tokenFamily).toBe(tokenFamily)
		})

		it('should maintain token family during rotation', async () => {
			await authService.refreshToken(existingRefreshToken)

			expect(mockPasetoService.generatedRefreshTokens[0].tokenFamily).toBe(tokenFamily)
		})

		it('should throw TOKEN_MISSING_FAMILY error when token family is missing', async () => {
			mockPasetoService.setRefreshTokenPayload(existingRefreshToken, {
				sub: testUser.id.toString(),
				// No tokenFamily
			})

			await expect(authService.refreshToken(existingRefreshToken)).rejects.toThrow(
				getInternalErrorMessage(InternalAuthErrorCode.TOKEN_MISSING_FAMILY),
			)
		})

		it('should throw TOKEN_REUSE_DETECTED and revoke token family when replaying a revoked token', async () => {
			mockRefreshTokenRepo.clear()
			mockRefreshTokenRepo.setUser(testUser)
			const tokenHash = createHash('sha256').update(existingRefreshToken).digest('hex')
			mockRefreshTokenRepo.addToken(tokenHash, {
				userId: testUser.id,
				tokenFamily,
				isRevoked: true,
				expiresAt: new Date(Date.now() + parseDurationToMs('1d')),
			})

			await expect(authService.refreshToken(existingRefreshToken)).rejects.toThrow(
				getInternalErrorMessage(InternalAuthErrorCode.TOKEN_REUSE_DETECTED),
			)

			expect(mockRefreshTokenRepo.revokedTokenFamilies).toContain(tokenFamily)
		})

		it('should throw TOKEN_REVOKED when token is not found in database', async () => {
			// Clear the repository so no tokens exist
			mockRefreshTokenRepo.clear()

			await expect(authService.refreshToken(existingRefreshToken)).rejects.toThrow(
				getInternalErrorMessage(InternalAuthErrorCode.TOKEN_REVOKED),
			)

			// No family revocation should occur (no token family info available)
			expect(mockRefreshTokenRepo.revokedTokenFamilies).toHaveLength(0)
		})

		it('should revoke all sibling tokens in the same family when reuse is detected', async () => {
			mockRefreshTokenRepo.clear()
			mockRefreshTokenRepo.setUser(testUser)
			const tokenHash = createHash('sha256').update(existingRefreshToken).digest('hex')

			// Add the revoked (old) token
			mockRefreshTokenRepo.addToken(tokenHash, {
				userId: testUser.id,
				tokenFamily,
				isRevoked: true,
				expiresAt: new Date(Date.now() + parseDurationToMs('1d')),
			})

			// Add a sibling token in the same family (the current valid one)
			const siblingToken = mockRefreshTokenRepo.addToken('sibling-hash', {
				userId: testUser.id,
				tokenFamily,
				isRevoked: false,
				expiresAt: new Date(Date.now() + parseDurationToMs('1d')),
			})

			await expect(authService.refreshToken(existingRefreshToken)).rejects.toThrow(
				getInternalErrorMessage(InternalAuthErrorCode.TOKEN_REUSE_DETECTED),
			)

			// The sibling token should also be revoked
			expect(siblingToken.isRevoked).toBe(true)
		})

		it('should throw REFRESH_TOKEN_EXPIRED error when token is expired', async () => {
			mockRefreshTokenRepo.clear()
			mockRefreshTokenRepo.setUser(testUser)
			const tokenHash = createHash('sha256').update(existingRefreshToken).digest('hex')
			mockRefreshTokenRepo.addToken(tokenHash, {
				userId: testUser.id,
				tokenFamily,
				isRevoked: false,
				expiresAt: new Date(Date.now() - parseDurationToMs('1d')), // 1 day ago
			})

			await expect(authService.refreshToken(existingRefreshToken)).rejects.toThrow(
				getInternalErrorMessage(InternalAuthErrorCode.REFRESH_TOKEN_EXPIRED),
			)
		})

		it('should throw REFRESH_TOKEN_EXPIRED (not TOKEN_REUSE_DETECTED) when token is both expired and revoked', async () => {
			// Regression guard: expiry check must run before reuse detection.
			// An expired+revoked token is a routine lifecycle outcome, not an attack.
			mockRefreshTokenRepo.clear()
			mockRefreshTokenRepo.setUser(testUser)
			const tokenHash = createHash('sha256').update(existingRefreshToken).digest('hex')
			mockRefreshTokenRepo.addToken(tokenHash, {
				userId: testUser.id,
				tokenFamily,
				isRevoked: true,
				expiresAt: new Date(Date.now() - parseDurationToMs('1d')),
			})

			await expect(authService.refreshToken(existingRefreshToken)).rejects.toThrow(
				getInternalErrorMessage(InternalAuthErrorCode.REFRESH_TOKEN_EXPIRED),
			)

			// Family must NOT be revoked — expired tokens are routine, not attacks
			expect(mockRefreshTokenRepo.revokedTokenFamilies).toHaveLength(0)
		})

		it('should throw TOKEN_REVOKED error when user not found (joined query returns null)', async () => {
			// When the user doesn't exist, the INNER JOIN returns no rows,
			// so findByTokenHashWithUser returns null — treated as a revoked token.
			// In production, this is prevented by the ON DELETE CASCADE FK,
			// but the error path is still safe.
			mockRefreshTokenRepo.removeUser(testUser.id)

			await expect(authService.refreshToken(existingRefreshToken)).rejects.toThrow(
				getInternalErrorMessage(InternalAuthErrorCode.TOKEN_REVOKED),
			)
		})

		it('should throw USER_NOT_FOUND error when user is deleted', async () => {
			mockRefreshTokenRepo.setUser({ ...testUser, status: UserStatus.DELETED })

			await expect(authService.refreshToken(existingRefreshToken)).rejects.toThrow(
				getInternalErrorMessage(InternalAuthErrorCode.USER_NOT_FOUND),
			)
		})

		it('should throw ACCOUNT_DISABLED error when user is disabled', async () => {
			mockRefreshTokenRepo.setUser({ ...testUser, status: UserStatus.DISABLED })

			await expect(authService.refreshToken(existingRefreshToken)).rejects.toThrow(
				getInternalErrorMessage(InternalAuthErrorCode.ACCOUNT_DISABLED),
			)
		})

		it('should throw when token verification fails', async () => {
			await expect(authService.refreshToken('invalid-token')).rejects.toThrow('Invalid or expired refresh token')
		})
	})

	describe('logout', () => {
		it('should revoke all tokens for user', async () => {
			await authService.logout(testUser.id)

			expect(mockRefreshTokenRepo.revokedUserIds).toContain(testUser.id)
		})

		it('should delete expired tokens for user', async () => {
			await authService.logout(testUser.id)

			expect(mockRefreshTokenRepo.deletedExpiredForUsers).toContain(testUser.id)
		})
	})

	describe('cleanupExpiredTokens', () => {
		it('should acquire lock and delete all expired tokens', async () => {
			const result = await authService.cleanupExpiredTokens()

			expect(mockRefreshTokenRepo.cleanupLockAcquired).toBe(false) // Lock released after cleanup
			expect(mockRefreshTokenRepo.deleteAllExpiredCalled).toBe(true)
			expect(result).not.toBeNull()
			expect(result?.deletedCount).toBeGreaterThanOrEqual(0)
			expect(result?.incomplete).toBe(false)
		})

		it('should return null when lock cannot be acquired', async () => {
			// Simulate another process holding the lock
			mockRefreshTokenRepo.cleanupLockAcquired = true

			const result = await authService.cleanupExpiredTokens()

			expect(result).toBeNull()
			expect(mockRefreshTokenRepo.deleteAllExpiredCalled).toBe(false)
		})

		it('should release lock after successful cleanup', async () => {
			await authService.cleanupExpiredTokens()

			// Lock should be released
			expect(mockRefreshTokenRepo.cleanupLockAcquired).toBe(false)
		})

		it('should delete expired tokens and return count', async () => {
			// Add some expired tokens
			mockRefreshTokenRepo.addToken('expired-1', {
				userId: 1,
				expiresAt: new Date(Date.now() - parseDurationToMs('1d')), // 1 day ago
			})
			mockRefreshTokenRepo.addToken('expired-2', {
				userId: 2,
				expiresAt: new Date(Date.now() - parseDurationToMs('1d')), // 1 day ago
			})
			mockRefreshTokenRepo.addToken('valid', {
				userId: 3,
				expiresAt: new Date(Date.now() + parseDurationToMs('1d')), // 1 day from now
			})

			const result = await authService.cleanupExpiredTokens()

			expect(result?.deletedCount).toBe(2)
			expect(result?.incomplete).toBe(false)
		})

		it('should return cleanup result even when lock release fails', async () => {
			// Save original and replace with a mock that rejects
			const originalRelease = mockRefreshTokenRepo.releaseCleanupLock.bind(mockRefreshTokenRepo)
			const releaseFn = fn<[], Promise<void>>().mockRejectedValue(new Error('Connection lost'))
			mockRefreshTokenRepo.releaseCleanupLock = releaseFn

			try {
				const result = await authService.cleanupExpiredTokens()

				expect(result).not.toBeNull()
				expect(result?.deletedCount).toBeGreaterThanOrEqual(0)
				expect(releaseFn.calls).toHaveLength(1)
			} finally {
				mockRefreshTokenRepo.releaseCleanupLock = originalRelease
			}
		})
	})
})
