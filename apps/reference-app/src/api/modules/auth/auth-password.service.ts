import { AuthError, getInternalErrorMessage, InternalAuthErrorCode } from '@contracts/auth/auth.errors'
import { UserStatus } from '@contracts/user/user.constants'
import { logger } from '@resetshop/util'
import { type UserData } from '../user/interfaces'
import {
	type AuthenticationData,
	type AuthenticationRepository,
	type AuthPasswordService as IAuthPasswordService,
} from './interfaces'

interface AuthPasswordServiceDeps {
	authRepository: AuthenticationRepository
	verifyPassword: (plain: string, hash: string) => Promise<boolean>
}

/**
 * Service owning password-credential verification and failed-login tracking.
 *
 * Extracted from `AuthService` so the core authentication orchestrator stays free of
 * password-mechanism details, and so future non-password mechanisms (OAuth, SSO, passkeys)
 * can be added as sibling collaborators without changing `AuthService`.
 */
export class AuthPasswordService implements IAuthPasswordService {
	private readonly authRepository: AuthenticationRepository
	private readonly verifyPassword: (plain: string, hash: string) => Promise<boolean>

	constructor({ authRepository, verifyPassword }: AuthPasswordServiceDeps) {
		this.authRepository = authRepository
		this.verifyPassword = verifyPassword
	}

	/**
	 * Validates user credentials with timing-safe comparison.
	 *
	 * SECURITY: Accepts nullable parameters to maintain timing-safety. Even when user
	 * or authRecord is null (invalid email), we MUST perform the expensive bcrypt
	 * password comparison using a dummy hash. Skipping bcrypt for invalid cases would
	 * create a timing vulnerability: valid emails take ~200ms (DB + bcrypt), invalid
	 * emails take ~50ms (DB only), allowing attackers to enumerate valid emails by
	 * measuring response times. The cost is intentional and necessary for security.
	 *
	 * Handles failed login tracking before throwing.
	 *
	 * @param user - User object or null
	 * @param authRecord - Authentication record or null
	 * @param password - Password to verify
	 * @returns Validated user and auth record
	 * @throws AuthError with INVALID_CREDENTIALS code if validation fails
	 */
	public async validateCredentials(
		user: UserData | null,
		authRecord: AuthenticationData | null,
		password: string,
	): Promise<{ user: UserData; authRecord: AuthenticationData }> {
		const dummyHash = '$2a$10$dummyhashdummyhashdummyhashdummyhashdummyhashdummy'
		const hashToCompare = authRecord?.passwordHash ?? dummyHash
		const passwordMatch = await this.verifyPassword(password, hashToCompare)

		if (!user || !authRecord || !passwordMatch || user.status !== UserStatus.ACTIVE) {
			await this.handleFailedLogin(user, authRecord)
			throw new AuthError(InternalAuthErrorCode.INVALID_CREDENTIALS)
		}

		return { user, authRecord }
	}

	/**
	 * Handles failed login attempt by tracking failures and locking the account if the threshold is reached.
	 */
	private async handleFailedLogin(user: UserData | null, authRecord: AuthenticationData | null): Promise<void> {
		if (!user || !authRecord) {
			this.logAuthFailure(user, authRecord)
			return
		}

		const result = await this.authRepository.incrementAndLockIfNeeded(user.id)

		if (result.wasLocked && result.lockedUntil) {
			logger.security('account_locked', {
				userId: user.id,
				failedAttempts: result.failedAttempts,
				lockedUntil: result.lockedUntil.toISOString(),
			})
		}

		this.logAuthFailure(user, authRecord)
	}

	/**
	 * Logs authentication failure reasons for debugging.
	 */
	private logAuthFailure(user: UserData | null, authRecord: AuthenticationData | null): void {
		if (!user) {
			logger.error('AuthPasswordService', getInternalErrorMessage(InternalAuthErrorCode.USER_NOT_FOUND))
		} else if (!authRecord) {
			logger.error('AuthPasswordService', getInternalErrorMessage(InternalAuthErrorCode.AUTH_RECORD_NOT_FOUND))
		} else if (user.status === UserStatus.DELETED) {
			logger.error('AuthPasswordService', getInternalErrorMessage(InternalAuthErrorCode.ACCOUNT_DELETED))
		} else if (user.status === UserStatus.DISABLED) {
			logger.error('AuthPasswordService', getInternalErrorMessage(InternalAuthErrorCode.ACCOUNT_DISABLED))
		} else {
			logger.error('AuthPasswordService', getInternalErrorMessage(InternalAuthErrorCode.INVALID_CREDENTIALS))
		}
	}
}
