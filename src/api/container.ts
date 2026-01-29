import { asClass, asValue, type AwilixContainer, createContainer, InjectionMode } from 'awilix';
import { getTestCradle } from './container.mock';
import { drizzlePgConnector, type DrizzlePgConnector } from './helpers/drizzle-postgres-connector';
import { AuthService } from './modules/auth/auth.service';
import { AuthenticationRepository } from './modules/auth/authentication.repository';
import { RefreshTokenRepository } from './modules/auth/refresh-token.repository';
import { PermissionRepository } from './modules/permission/permission.repository';
import { PermissionService } from './modules/permission/permission.service';
import { RoleRepository } from './modules/role/role.repository';
import { RoleService } from './modules/role/role.service';
import { UserManagementRepository } from './modules/user/user-management.repository';
import { UserManagementService } from './modules/user/user-management.service';
import { UserRoleRepository } from './modules/user/user-role.repository';
import { UserRoleService } from './modules/user/user-role.service';
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
	if (!/^[0-9a-fA-F]{64,}$/.test(pasetoKey)) {
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
 * UserManagementService
 *   └── UserManagementRepository ► db
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
	roleRepository: RoleRepository;
	permissionRepository: PermissionRepository;
	userRoleRepository: UserRoleRepository;
	userManagementRepository: UserManagementRepository;

	// Application Services
	authService: AuthService;
	roleService: RoleService;
	permissionService: PermissionService;
	userRoleService: UserRoleService;
	userManagementService: UserManagementService;
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
const realContainer = createContainer<Cradle>({
	injectionMode: InjectionMode.PROXY,
	strict: true,
});

realContainer.register({
	// Infrastructure (values)
	db: asValue(drizzlePgConnector),

	// Services (singletons - stateless, hold config)
	pasetoService: asClass(PasetoService).singleton(),

	// Repositories (singletons - stateless, share db connection)
	userRepository: asClass(UserRepository).singleton(),
	authRepository: asClass(AuthenticationRepository).singleton(),
	refreshTokenRepository: asClass(RefreshTokenRepository).singleton(),
	roleRepository: asClass(RoleRepository).singleton(),
	permissionRepository: asClass(PermissionRepository).singleton(),
	userRoleRepository: asClass(UserRoleRepository).singleton(),
	userManagementRepository: asClass(UserManagementRepository).singleton(),

	// Services that depend on repositories
	authService: asClass(AuthService).singleton(),
	roleService: asClass(RoleService).singleton(),
	permissionService: asClass(PermissionService).singleton(),
	userRoleService: asClass(UserRoleService).singleton(),
	userManagementService: asClass(UserManagementService).singleton(),
});

/**
 * Container proxy that supports test mode.
 * When a test cradle is set (via setTestCradle), the proxy returns mock services.
 * In production, it delegates to the real Awilix container.
 */
export const container: Pick<AwilixContainer<Cradle>, 'cradle' | 'resolve' | 'registrations'> = {
	get cradle(): Cradle {
		const testCradle = getTestCradle();
		if (testCradle) {
			// Return a proxy that throws for unmocked services
			return new Proxy(testCradle as Cradle, {
				get(target, prop: keyof Cradle) {
					if (prop in target) {
						return target[prop];
					}
					throw new Error(`Test mock missing for service: ${String(prop)}`);
				},
			});
		}
		return realContainer.cradle;
	},
	resolve<K extends keyof Cradle>(key: K): Cradle[K] {
		const testCradle = getTestCradle();
		if (testCradle && key in testCradle) {
			return testCradle[key] as Cradle[K];
		}
		return realContainer.resolve(key);
	},
	get registrations() {
		return realContainer.registrations;
	},
};

/**
 * Verifies that all registered dependencies can be resolved from the container.
 * Call this at server startup to fail fast if configuration is invalid.
 * @throws Error if any dependency fails to resolve
 */
export function verifyContainer(): void {
	for (const dep of Object.keys(realContainer.registrations)) {
		realContainer.resolve(dep);
	}
}
