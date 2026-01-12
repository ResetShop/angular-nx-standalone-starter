import { hash } from 'bcryptjs';
import { createHash } from 'crypto';
import { MockPasetoService } from '../../services/paseto/paseto.service.mock';
import { MockUserRepository } from '../user/user.repository.mock';
import { AUTH_ERRORS, AuthService } from './auth.service';
import { MockAuthenticationRepository } from './authentication.repository.mock';
import { MockRefreshTokenRepository } from './refresh-token.repository.mock';

describe('AuthService', () => {
	let authService: AuthService;
	let mockUserRepo: MockUserRepository;
	let mockAuthRepo: MockAuthenticationRepository;
	let mockRefreshTokenRepo: MockRefreshTokenRepository;
	let mockPasetoService: MockPasetoService;

	// Test data
	const testPassword = 'password123';
	let testPasswordHash: string;

	const testUser = {
		id: 1,
		email: 'test@example.com',
		firstName: 'Test',
		lastName: 'User',
		enabled: true,
		deleted: false,
	};

	beforeAll(async () => {
		// Create a real bcrypt hash for testing
		testPasswordHash = await hash(testPassword, 10);
	});

	beforeEach(() => {
		mockUserRepo = new MockUserRepository();
		mockAuthRepo = new MockAuthenticationRepository();
		mockRefreshTokenRepo = new MockRefreshTokenRepository();
		mockPasetoService = new MockPasetoService();

		authService = new AuthService({
			userRepository: mockUserRepo,
			authRepository: mockAuthRepo,
			refreshTokenRepository: mockRefreshTokenRepo,
			pasetoService: mockPasetoService,
		});
	});

	afterEach(() => {
		mockUserRepo.clear();
		mockAuthRepo.clear();
		mockRefreshTokenRepo.clear();
		mockPasetoService.clear();
	});

	describe('authenticate', () => {
		beforeEach(() => {
			// Set up valid user and auth record
			mockUserRepo.addUser(testUser);
			mockAuthRepo.addAuthRecord(testUser.id, { passwordHash: testPasswordHash });
		});

		it('should return user, access token, and refresh token on successful authentication', async () => {
			const result = await authService.authenticate({
				email: testUser.email,
				password: testPassword,
			});

			expect(result.user).toEqual(testUser);
			expect(result.token).toBe('mock-access-token-1');
			expect(result.refreshToken).toBe('mock-refresh-token-1');
		});

		it('should generate access token with correct payload', async () => {
			await authService.authenticate({
				email: testUser.email,
				password: testPassword,
			});

			expect(mockPasetoService.generatedAccessTokens).toHaveLength(1);
			expect(mockPasetoService.generatedAccessTokens[0].payload).toEqual({
				sub: testUser.id.toString(),
				email: testUser.email,
				firstName: testUser.firstName,
				lastName: testUser.lastName,
			});
		});

		it('should store refresh token in repository', async () => {
			await authService.authenticate({
				email: testUser.email,
				password: testPassword,
			});

			expect(mockRefreshTokenRepo.createdTokens).toHaveLength(1);
			expect(mockRefreshTokenRepo.createdTokens[0].userId).toBe(testUser.id);
		});

		it('should cleanup expired tokens on successful authentication', async () => {
			await authService.authenticate({
				email: testUser.email,
				password: testPassword,
			});

			expect(mockRefreshTokenRepo.deletedExpiredForUsers).toContain(testUser.id);
		});

		it('should throw INVALID_CREDENTIALS when user not found', async () => {
			await expect(
				authService.authenticate({
					email: 'nonexistent@example.com',
					password: testPassword,
				}),
			).rejects.toThrow(AUTH_ERRORS.INVALID_CREDENTIALS);
		});

		it('should throw INVALID_CREDENTIALS when user is deleted', async () => {
			mockUserRepo.clear();
			mockUserRepo.addUser({ ...testUser, deleted: true });

			await expect(
				authService.authenticate({
					email: testUser.email,
					password: testPassword,
				}),
			).rejects.toThrow(AUTH_ERRORS.INVALID_CREDENTIALS);
		});

		it('should throw INVALID_CREDENTIALS when user is disabled', async () => {
			mockUserRepo.clear();
			mockUserRepo.addUser({ ...testUser, enabled: false });

			await expect(
				authService.authenticate({
					email: testUser.email,
					password: testPassword,
				}),
			).rejects.toThrow(AUTH_ERRORS.INVALID_CREDENTIALS);
		});

		it('should throw INVALID_CREDENTIALS when auth record not found', async () => {
			mockAuthRepo.clear();

			await expect(
				authService.authenticate({
					email: testUser.email,
					password: testPassword,
				}),
			).rejects.toThrow(AUTH_ERRORS.INVALID_CREDENTIALS);
		});

		it('should throw INVALID_CREDENTIALS when password does not match', async () => {
			await expect(
				authService.authenticate({
					email: testUser.email,
					password: 'wrongpassword',
				}),
			).rejects.toThrow(AUTH_ERRORS.INVALID_CREDENTIALS);
		});
	});

	describe('refreshToken', () => {
		const existingRefreshToken = 'existing-refresh-token';
		const tokenFamily = 'test-token-family';

		beforeEach(() => {
			mockUserRepo.addUser(testUser);

			// Set up the mock to verify the refresh token
			mockPasetoService.setRefreshTokenPayload(existingRefreshToken, {
				sub: testUser.id.toString(),
				tokenFamily,
			});

			// Add the token to the repository
			const tokenHash = createHash('sha256').update(existingRefreshToken).digest('hex');
			mockRefreshTokenRepo.addToken(tokenHash, {
				userId: testUser.id,
				tokenFamily,
				isRevoked: false,
				expiresAt: new Date(Date.now() + 86400000), // 1 day from now
			});
		});

		it('should return new access and refresh tokens', async () => {
			const result = await authService.refreshToken(existingRefreshToken);

			expect(result.token).toBe('mock-access-token-1');
			expect(result.refreshToken).toBe('mock-refresh-token-1');
		});

		it('should revoke old token and create new one (token rotation)', async () => {
			await authService.refreshToken(existingRefreshToken);

			// Old token should be revoked
			expect(mockRefreshTokenRepo.revokedTokenIds).toHaveLength(1);

			// New token should be created
			expect(mockRefreshTokenRepo.createdTokens).toHaveLength(1);
			expect(mockRefreshTokenRepo.createdTokens[0].tokenFamily).toBe(tokenFamily);
		});

		it('should maintain token family during rotation', async () => {
			await authService.refreshToken(existingRefreshToken);

			expect(mockPasetoService.generatedRefreshTokens[0].tokenFamily).toBe(tokenFamily);
		});

		it('should throw when token family is missing', async () => {
			mockPasetoService.setRefreshTokenPayload(existingRefreshToken, {
				sub: testUser.id.toString(),
				// No tokenFamily
			});

			await expect(authService.refreshToken(existingRefreshToken)).rejects.toThrow(
				'Invalid refresh token: missing token family',
			);
		});

		it('should throw when token is revoked', async () => {
			// Clear and add a revoked token
			mockRefreshTokenRepo.clear();
			const tokenHash = createHash('sha256').update(existingRefreshToken).digest('hex');
			mockRefreshTokenRepo.addToken(tokenHash, {
				userId: testUser.id,
				tokenFamily,
				isRevoked: true,
				expiresAt: new Date(Date.now() + 86400000),
			});

			await expect(authService.refreshToken(existingRefreshToken)).rejects.toThrow('Invalid refresh token');
		});

		it('should throw when token is expired', async () => {
			// Clear and add an expired token
			mockRefreshTokenRepo.clear();
			const tokenHash = createHash('sha256').update(existingRefreshToken).digest('hex');
			mockRefreshTokenRepo.addToken(tokenHash, {
				userId: testUser.id,
				tokenFamily,
				isRevoked: false,
				expiresAt: new Date(Date.now() - 86400000), // 1 day ago
			});

			await expect(authService.refreshToken(existingRefreshToken)).rejects.toThrow('Refresh token expired');
		});

		it('should throw when user not found', async () => {
			mockUserRepo.clear();

			await expect(authService.refreshToken(existingRefreshToken)).rejects.toThrow('User not found');
		});

		it('should throw when user is deleted', async () => {
			mockUserRepo.clear();
			mockUserRepo.addUser({ ...testUser, deleted: true });

			await expect(authService.refreshToken(existingRefreshToken)).rejects.toThrow('User not found');
		});

		it('should throw when user is disabled', async () => {
			mockUserRepo.clear();
			mockUserRepo.addUser({ ...testUser, enabled: false });

			await expect(authService.refreshToken(existingRefreshToken)).rejects.toThrow('Account is disabled');
		});

		it('should throw when token verification fails', async () => {
			await expect(authService.refreshToken('invalid-token')).rejects.toThrow('Invalid or expired refresh token');
		});
	});

	describe('logout', () => {
		it('should revoke all tokens for user', async () => {
			await authService.logout(testUser.id);

			expect(mockRefreshTokenRepo.revokedUserIds).toContain(testUser.id);
		});

		it('should delete expired tokens for user', async () => {
			await authService.logout(testUser.id);

			expect(mockRefreshTokenRepo.deletedExpiredForUsers).toContain(testUser.id);
		});
	});

	describe('cleanupExpiredTokens', () => {
		it('should acquire lock and delete all expired tokens', async () => {
			const result = await authService.cleanupExpiredTokens();

			expect(mockRefreshTokenRepo.cleanupLockAcquired).toBe(false); // Lock released after cleanup
			expect(mockRefreshTokenRepo.deleteAllExpiredCalled).toBe(true);
			expect(result).toBeGreaterThanOrEqual(0);
		});

		it('should return -1 when lock cannot be acquired', async () => {
			// Simulate another process holding the lock
			mockRefreshTokenRepo.cleanupLockAcquired = true;

			const result = await authService.cleanupExpiredTokens();

			expect(result).toBe(-1);
			expect(mockRefreshTokenRepo.deleteAllExpiredCalled).toBe(false);
		});

		it('should release lock after successful cleanup', async () => {
			await authService.cleanupExpiredTokens();

			// Lock should be released
			expect(mockRefreshTokenRepo.cleanupLockAcquired).toBe(false);
		});

		it('should delete expired tokens and return count', async () => {
			// Add some expired tokens
			mockRefreshTokenRepo.addToken('expired-1', {
				userId: 1,
				expiresAt: new Date(Date.now() - 86400000), // 1 day ago
			});
			mockRefreshTokenRepo.addToken('expired-2', {
				userId: 2,
				expiresAt: new Date(Date.now() - 86400000), // 1 day ago
			});
			mockRefreshTokenRepo.addToken('valid', {
				userId: 3,
				expiresAt: new Date(Date.now() + 86400000), // 1 day from now
			});

			const result = await authService.cleanupExpiredTokens();

			expect(result).toBe(2);
		});
	});
});
