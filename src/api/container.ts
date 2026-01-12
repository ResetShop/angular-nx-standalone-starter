import { asClass, asValue, createContainer, InjectionMode } from 'awilix';
import { drizzlePgConnector, type DrizzlePgConnector } from './helpers/drizzle-postgres-connector';
import { AuthService } from './modules/auth/auth.service';
import { AuthenticationRepository } from './modules/auth/authentication.repository';
import { RefreshTokenRepository } from './modules/auth/refresh-token.repository';
import { UserRepository } from './modules/user/user.repository';
import { PasetoService } from './services/paseto/paseto.service';

/**
 * Validates required environment variables at container setup time.
 * Fails fast if critical configuration is missing or invalid.
 */
function validateEnvironment(): void {
	const pasetoKey = process.env['PASETO_SECRET_KEY'];
	if (!pasetoKey) {
		throw new Error('PASETO_SECRET_KEY environment variable is required');
	}
	if (pasetoKey.length < 64) {
		throw new Error(
			'PASETO_SECRET_KEY must be at least 32 bytes (64 hex characters). ' + 'Generate with: openssl rand -hex 32',
		);
	}
}

validateEnvironment();

/**
 * Cradle interface defines all dependencies available in the container.
 * This provides type safety when resolving dependencies.
 *
 * Dependency Graph:
 *
 * AuthService
 *   ├── UserRepository ──────► db
 *   ├── AuthRepository ──────► db
 *   ├── RefreshTokenRepository ► db
 *   └── PasetoService (no deps)
 *
 * Middleware/Controllers resolve services lazily at runtime.
 * All services are registered as singletons.
 */
export interface Cradle {
	// Infrastructure
	db: DrizzlePgConnector;

	// Services
	pasetoService: PasetoService;

	// Repositories
	userRepository: UserRepository;
	authRepository: AuthenticationRepository;
	refreshTokenRepository: RefreshTokenRepository;

	// Application Services
	authService: AuthService;
}

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
export const container = createContainer<Cradle>({
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

/**
 * Verifies that all registered dependencies can be resolved from the container.
 * Call this at server startup to fail fast if configuration is invalid.
 * @throws Error if any dependency fails to resolve
 */
export function verifyContainer(): void {
	for (const dep of Object.keys(container.registrations)) {
		container.resolve(dep);
	}
}
