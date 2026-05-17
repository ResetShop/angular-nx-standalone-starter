import { V3 } from 'paseto'
import { type RefreshTokenPayload, type TokenPayload } from './interfaces'
import type { PasetoConfig } from './paseto.config'

/**
 * Service to interact with PASETO tokens. It allows for the generation and validation of access and refresh tokens
 * using Paseto v3. This class acts as an abstraction layer above the PASETO library.
 *
 * All configuration (secret key, issuer, token expiries, clock tolerance) is injected via `PasetoConfig`
 * from the DI container. The service does not read environment variables directly.
 */
export class PasetoService {
	private readonly secretKey: Buffer
	private readonly issuer: string
	private readonly accessTokenExpiry: string
	private readonly refreshTokenExpiry: string
	private readonly clockTolerance: string

	constructor({ pasetoConfig }: { pasetoConfig: PasetoConfig }) {
		this.secretKey = pasetoConfig.secretKey
		this.issuer = pasetoConfig.issuer
		this.accessTokenExpiry = pasetoConfig.accessTokenExpiry
		this.refreshTokenExpiry = pasetoConfig.refreshTokenExpiry
		this.clockTolerance = pasetoConfig.clockTolerance
	}

	/**
	 * Generates a short-lived access token for API authentication.
	 *
	 * @param payload - Token payload containing user information (sub, email, firstName, lastName)
	 * @returns Encrypted PASETO v3.local token string
	 */
	public async generateAccessToken(payload: TokenPayload): Promise<string> {
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
				expiresIn: this.accessTokenExpiry,
				iat: true, // Include issued-at timestamp
			},
		)
	}

	/**
	 * Generates a long-lived refresh token for token rotation.
	 *
	 * @param userId - The user's ID as a string
	 * @param tokenFamily - Token family UUID for rotation tracking. If not provided, a new UUID is generated.
	 * @returns Encrypted PASETO v3.local token string
	 */
	public async generateRefreshToken(userId: string, tokenFamily?: string): Promise<string> {
		return await V3.encrypt(
			{
				sub: userId,
				tokenFamily: tokenFamily || crypto.randomUUID(),
				iss: this.issuer,
			},
			this.secretKey,
			{
				expiresIn: this.refreshTokenExpiry,
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
	public async verifyAccessToken(token: string): Promise<TokenPayload> {
		try {
			const result = await V3.decrypt<TokenPayload>(token, this.secretKey, {
				issuer: this.issuer,
				clockTolerance: this.clockTolerance,
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
	public async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
		try {
			const result = await V3.decrypt<RefreshTokenPayload>(token, this.secretKey, {
				issuer: this.issuer,
				clockTolerance: this.clockTolerance,
			})

			return result
		} catch (error) {
			throw new Error('Invalid or expired refresh token', { cause: error })
		}
	}
}
