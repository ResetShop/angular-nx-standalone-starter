import { asClass, asValue, createContainer, InjectionMode } from 'awilix';
import { drizzlePgConnector } from './helpers/drizzle-postgres-connector';
import { AuthService } from './modules/auth/auth.service';
import { AuthenticationRepository } from './modules/auth/authentication.repository';
import { RefreshTokenRepository } from './modules/auth/refresh-token.repository';
import { UserRepository } from './modules/user/user.repository';
import { PasetoService } from './services/paseto.service';

/**
 * Awilix Dependency Injection Container
 *
 * Using PROXY injection mode for:
 * - Works with minified code (production builds)
 * - Dependencies resolved via property access on proxy object
 * - Destructured constructor parameters work correctly
 *
 * Constructor signature pattern for PROXY mode:
 * ```typescript
 * class MyService {
 *   constructor({ dep1, dep2 }: { dep1: Dep1; dep2: Dep2 }) {
 *     this.dep1 = dep1;
 *     this.dep2 = dep2;
 *   }
 * }
 * ```
 */
export const container = createContainer({
	injectionMode: InjectionMode.PROXY,
	strict: true,
});

container.register({
	// Infrastructure (values)
	db: asValue(drizzlePgConnector),

	// Services (singletons - stateless, hold config)
	pasetoService: asClass(PasetoService).singleton(),

	// Repositories (singletons - stateless, share db connection)
	userRepository: asClass(UserRepository).singleton(),
	authRepository: asClass(AuthenticationRepository).singleton(),
	refreshTokenRepository: asClass(RefreshTokenRepository).singleton(),

	// Services that depend on repositories
	authService: asClass(AuthService).singleton(),
});
