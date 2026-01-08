import { V3 } from 'paseto';

interface TokenPayload {
	sub: string; // Subject (user ID)
	email: string;
	firstName: string;
	lastName: string;
	iat?: string; // Issued at (auto-added)
	exp?: string; // Expiration (auto-added)
	iss?: string; // Issuer
}

interface RefreshTokenPayload {
	sub: string; // Subject (user ID)
	tokenFamily?: string; // For refresh token rotation
}

/**
 * Service to interact with PASETO tokens. It allows for the generation and validation of access and refresh tokens
 * using Paseto v3. This class acts as an abstraction layer above the PASETO library.
 *
 * For this service to work properly, the PASETO_SECRET_KEY env var is mandatory.
 * Optionally, the PASETO_ISSUER and PASETO_ACCESS_TOKEN_EXPIRY env vars can also be defined.
 *
 * */
export class PasetoService {
	private readonly secretKey: Buffer;
	private readonly issuer: string;

	constructor() {
		const keyHex = process.env['PASETO_SECRET_KEY'];
		if (!keyHex) {
			throw new Error('PASETO_SECRET_KEY not configured');
		}

		// Validate key length: PASETO v3.local requires a 32-byte key (64 hex characters)
		if (keyHex.length < 64) {
			throw new Error(
				'PASETO_SECRET_KEY must be at least 32 bytes (64 hex characters). ' +
					'Generate a secure key with: openssl rand -hex 32',
			);
		}

		this.secretKey = Buffer.from(keyHex, 'hex');
		this.issuer = process.env['PASETO_ISSUER'] || 'Reset Shop';
	}

	/**
	 * Generate access token (short-lived)
	 * @param payload Token payload
	 */
	async generateAccessToken(payload: TokenPayload): Promise<string> {
		// ExpiresIn is read directly from env vars to allow changing the token expiration time at runtime
		const expiresIn = process.env['PASETO_ACCESS_TOKEN_EXPIRY'] ?? '15m';

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
		);
	}

	/**
	 * Generate refresh token (long-lived)
	 * @param userId User ID
	 * @param tokenFamily Optional token family. If not provided, a random UUID will be generated. This is used to rotate refresh tokens, e.g. when the user changes their password.
	 */
	async generateRefreshToken(userId: string, tokenFamily?: string): Promise<string> {
		// ExpiresIn is read directly from env vars to allow changing the token expiration time at runtime
		const expiresIn = process.env['PASETO_REFRESH_TOKEN_EXPIRY'] ?? '7d';

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
		);
	}

	/**
	 * Verify and decode access token
	 */
	async verifyAccessToken(token: string): Promise<TokenPayload> {
		try {
			const result = await V3.decrypt<TokenPayload>(token, this.secretKey, {
				issuer: this.issuer,
				clockTolerance: process.env['PASETO_CLOCK_TOLERANCE'] ?? '1m', // Allow default 1 minute clock drift
			});

			return result;
		} catch (error) {
			throw new Error('Invalid or expired token', { cause: error });
		}
	}

	/**
	 * Verify and decode refresh token
	 */
	async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
		try {
			const result = await V3.decrypt<RefreshTokenPayload>(token, this.secretKey, {
				issuer: this.issuer,
				clockTolerance: process.env['PASETO_CLOCK_TOLERANCE'] ?? '1m', // Allow default 1 minute clock drift
			});

			return result;
		} catch (error) {
			throw new Error('Invalid or expired refresh token', { cause: error });
		}
	}
}
