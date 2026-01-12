export interface AuthenticationData {
	passwordHash: string;
}

export interface IAuthenticationRepository {
	findByUserId(userId: number): Promise<AuthenticationData | null>;
}

export interface RefreshTokenData {
	id: number;
	userId: number;
	tokenFamily: string;
	tokenHash: string;
	expiresAt: Date;
	isRevoked: boolean | null;
	createdAt: Date | null;
	revokedAt: Date | null;
}

export interface CreateRefreshTokenParams {
	userId: number;
	tokenFamily: string;
	tokenHash: string;
	expiresAt: Date;
}

export interface IRefreshTokenRepository {
	findByTokenHash(tokenHash: string): Promise<RefreshTokenData | null>;
	create(params: CreateRefreshTokenParams): Promise<RefreshTokenData>;
	revokeToken(tokenId: number): Promise<void>;
	revokeAllForUser(userId: number): Promise<void>;
	deleteExpiredTokensForUser(userId: number): Promise<number>;
}
