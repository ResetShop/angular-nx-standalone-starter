import { V3 } from 'paseto'
import { DEFAULT_ACCESS_TOKEN_EXPIRY, DEFAULT_REFRESH_TOKEN_EXPIRY } from '../../constants/auth.constants'
import { type IPasetoService, type RefreshTokenPayload, type TokenPayload } from './interfaces'

/**
 * Service to interact with PASETO tokens. It allows for the generation and validation of access and refresh tokens
 * using Paseto v3. This class acts as an abstraction layer above the PASETO library.
 *
 * For this service to work properly, the PASETO_SECRET_KEY and PASETO_ISSUER env vars are mandatory.
 * Optionally, the PASETO_ACCESS_TOKEN_EXPIRY env var can also be defined.
 *
 * */
export class PasetoService implements IPasetoService {
	private readonly secretKey: Buffer
	private readonly issuer: string

	constructor() {
		// Defense-in-depth: This validation is also performed in container.ts at startup.
		// Keeping it here ensures the service fails safely even if instantiated outside the DI container.
		const keyHex = process.env['PASETO_SECRET_KEY']
		if (!keyHex) {
			throw new Error('PASETO_SECRET_KEY not configured')
		}

		// Validate key length: PASETO v3.local requires a 32-byte key (64 hex characters)
		if (keyHex.length < 64) {
			throw new Error(
				'PASETO_SECRET_KEY must be at least 32 bytes (64 hex characters). ' +
					'Generate a secure key with: openssl rand -hex 32',
			)
		}

		this.secretKey = Buffer.from(keyHex, 'hex')

		const issuer = process.env['PASETO_ISSUER']
		if (!issuer) {
			throw new Error('PASETO_ISSUER not configured')
		}
		this.issuer = issuer
	}

	/**
	 * Generates a short-lived access token for API authentication.
	 * Expiry is configurable via PASETO_ACCESS_TOKEN_EXPIRY env variable (default: 15m).
	 *
	 * @param payload - Token payload containing user information (sub, email, firstName, lastName)
	 * @returns Encrypted PASETO v3.local token string
	 */
	async generateAccessToken(payload: TokenPayload): Promise<string> {
		// ExpiresIn is read directly from env vars to allow changing the token expiration time at runtime
		const expiresIn = process.env['PASETO_ACCESS_TOKEN_EXPIRY'] ?? DEFAULT_ACCESS_TOKEN_EXPIRY

		return await V3.encrypt(
			{
				sub: payload.sub,
				email: payload.email,
				firstName: payload.firstName,
				lastName: payload.lastName,
				iss: this.issuer,
			},
			this.secretKey,
			{
				expiresIn,
				iat: true, // Include issued-at timestamp
			},
		)
	}

	/**
	 * Generates a long-lived refresh token for token rotation.
	 * Expiry is configurable via PASETO_REFRESH_TOKEN_EXPIRY env variable (default: 7d).
	 *
	 * @param userId - The user's ID as a string
	 * @param tokenFamily - Token family UUID for rotation tracking. If not provided, a new UUID is generated.
	 * @returns Encrypted PASETO v3.local token string
	 */
	async generateRefreshToken(userId: string, tokenFamily?: string): Promise<string> {
		// ExpiresIn is read directly from env vars to allow changing the token expiration time at runtime
		const expiresIn = process.env['PASETO_REFRESH_TOKEN_EXPIRY'] ?? DEFAULT_REFRESH_TOKEN_EXPIRY

		return await V3.encrypt(
			{
				sub: userId,
				tokenFamily: tokenFamily || crypto.randomUUID(),
				iss: this.issuer,
			},
			this.secretKey,
			{
				expiresIn,
				iat: true,
			},
		)
	}

	/**
	 * Verifies and decodes an access token.
	 * Validates signature, expiration, and issuer claims.
	 *
	 * @param token - The PASETO token string to verify
	 * @returns Decoded token payload with user information
	 * @throws Error if token is invalid, expired, or has wrong issuer
	 */
	async verifyAccessToken(token: string): Promise<TokenPayload> {
		try {
			const result = await V3.decrypt<TokenPayload>(token, this.secretKey, {
				issuer: this.issuer,
				clockTolerance: process.env['PASETO_CLOCK_TOLERANCE'] ?? '1m', // Allow default 1 minute clock drift
			})

			return result
		} catch (error) {
			throw new Error('Invalid or expired token', { cause: error })
		}
	}

	/**
	 * Verifies and decodes a refresh token.
	 * Validates signature, expiration, and issuer claims.
	 *
	 * @param token - The PASETO refresh token string to verify
	 * @returns Decoded token payload with user ID and token family
	 * @throws Error if token is invalid, expired, or has wrong issuer
	 */
	async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
		try {
			const result = await V3.decrypt<RefreshTokenPayload>(token, this.secretKey, {
				issuer: this.issuer,
				clockTolerance: process.env['PASETO_CLOCK_TOLERANCE'] ?? '1m', // Allow default 1 minute clock drift
			})

			return result
		} catch (error) {
			throw new Error('Invalid or expired refresh token', { cause: error })
		}
	}
}
