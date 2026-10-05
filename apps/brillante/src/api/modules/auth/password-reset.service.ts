import { AuthError, InternalAuthErrorCode } from '@contracts/auth/auth.errors'
import { UserStatus } from '@contracts/user/user.constants'
import { logger, parseDurationToMs } from '@resetshop/util'
import { PASSWORD_RESET_TOKEN_EXPIRY } from '../../constants/auth.constants'
import { buildForgotPasswordEmail } from '../../services/email/forgot-password-email.builder'
import { type EmailService } from '../../services/email/interfaces'
import { type UserRepository } from '../user/interfaces'
import {
	type AuthenticationRepository,
	type PasswordResetService as IPasswordResetService,
	type PasswordResetTokenRepository,
	type RefreshTokenRepository,
} from './interfaces'
import { buildPasswordResetUrl, generateResetToken, hashResetToken } from './reset-token'

interface PasswordResetServiceDeps {
	userRepository: UserRepository
	authRepository: AuthenticationRepository
	passwordResetTokenRepository: PasswordResetTokenRepository
	refreshTokenRepository: RefreshTokenRepository
	emailService: EmailService
	hashPassword: (plain: string) => Promise<string>
}

/**
 * Owns the unauthenticated self-service password-reset flow: issuing single-use, time-limited reset
 * tokens by email and consuming them to set a new password. Kept separate from AuthService (which
 * orchestrates authenticated flows) — keeping unauthenticated self-service flows apart from
 * authenticated session management is a deliberate single-responsibility boundary.
 */
export class PasswordResetService implements IPasswordResetService {
	private readonly userRepository: UserRepository
	private readonly authRepository: AuthenticationRepository
	private readonly passwordResetTokenRepository: PasswordResetTokenRepository
	private readonly refreshTokenRepository: RefreshTokenRepository
	private readonly emailService: EmailService
	private readonly hashPassword: (plain: string) => Promise<string>

	constructor({
		userRepository,
		authRepository,
		passwordResetTokenRepository,
		refreshTokenRepository,
		emailService,
		hashPassword,
	}: PasswordResetServiceDeps) {
		this.userRepository = userRepository
		this.authRepository = authRepository
		this.passwordResetTokenRepository = passwordResetTokenRepository
		this.refreshTokenRepository = refreshTokenRepository
		this.emailService = emailService
		this.hashPassword = hashPassword
	}

	/**
	 * Initiates a reset for the given email.
	 *
	 * SECURITY: resolves silently for unknown/inactive accounts so the caller's observable behaviour
	 * is identical regardless of whether the email belongs to an active user (no enumeration). Only
	 * active users have a token created and an email sent.
	 */
	public async requestPasswordReset(email: string): Promise<void> {
		const user = await this.userRepository.findByEmail(email)
		if (!user || user.status !== UserStatus.ACTIVE) {
			return
		}

		// Only the latest link should be valid — drop any outstanding unused tokens first.
		await this.passwordResetTokenRepository.invalidateAllForUser(user.id)

		const rawToken = generateResetToken()
		await this.passwordResetTokenRepository.create({
			userId: user.id,
			tokenHash: hashResetToken(rawToken),
			expiresAt: new Date(Date.now() + parseDurationToMs(PASSWORD_RESET_TOKEN_EXPIRY)),
		})

		const emailContent = buildForgotPasswordEmail({
			firstName: user.firstName,
			resetUrl: buildPasswordResetUrl(rawToken),
		})
		await this.emailService.send({ to: user.email, ...emailContent })
	}

	/**
	 * Completes a reset: validates the token (exists, unexpired, unused) and the user (still active),
	 * then atomically sets the new password + consumes the token and revokes all of the user's sessions.
	 *
	 * @throws AuthError RESET_TOKEN_INVALID for any missing/expired/used token or inactive user
	 */
	public async resetPassword(token: string, newPassword: string): Promise<void> {
		const tokenHash = hashResetToken(token)
		const record = await this.passwordResetTokenRepository.findByTokenHash(tokenHash)
		if (!record || record.usedAt !== null || record.expiresAt < new Date()) {
			throw new AuthError(InternalAuthErrorCode.RESET_TOKEN_INVALID)
		}

		const user = await this.userRepository.findById(record.userId)
		if (!user || user.status !== UserStatus.ACTIVE) {
			throw new AuthError(InternalAuthErrorCode.RESET_TOKEN_INVALID)
		}

		const newPasswordHash = await this.hashPassword(newPassword)
		await this.passwordResetTokenRepository.runInTransaction(async (tx) => {
			await this.authRepository.setPassword(record.userId, newPasswordHash, false, tx)
			await this.passwordResetTokenRepository.markUsed(tokenHash, tx)
		})

		await this.refreshTokenRepository.revokeAllForUser(record.userId)
		logger.security('password_reset_completed', { userId: record.userId })
	}
}
