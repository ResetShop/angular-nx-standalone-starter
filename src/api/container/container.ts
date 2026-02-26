import { asClass, asValue, type AwilixContainer, createContainer, InjectionMode } from 'awilix';
import { drizzlePgConnector } from '../helpers/drizzle-postgres-connector';
import { PermissionRepository } from '../modules/access/permission/permission.repository';
import { PermissionService } from '../modules/access/permission/permission.service';
import { RoleRepository } from '../modules/access/role/role.repository';
import { RoleService } from '../modules/access/role/role.service';
import { AuthService } from '../modules/auth/auth.service';
import { AuthenticationRepository } from '../modules/auth/authentication.repository';
import { RefreshTokenRepository } from '../modules/auth/refresh-token.repository';
import { HealthService } from '../modules/health/health.service';
import { UserManagementRepository } from '../modules/user/user-management.repository';
import { UserManagementService } from '../modules/user/user-management.service';
import { UserRoleRepository } from '../modules/user/user-role.repository';
import { UserRoleService } from '../modules/user/user-role.service';
import { UserRepository } from '../modules/user/user.repository';
import { EmailService } from '../services/email/email.service';
import { EtherealEmailRepository } from '../services/email/ethereal-email.repository';
import { NodemailerRepository } from '../services/email/nodemailer.repository';
import { PasetoService } from '../services/paseto/paseto.service';
import { generatePassword } from '../utils/password';
import { getTestCradle } from './container.mock';
import type { Cradle } from './container.types';
import { validateEnvironment } from './validate-environment';

validateEnvironment();

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
	emailService: asClass(EmailService).singleton(),
	healthService: asClass(HealthService).singleton(),
	pasetoService: asClass(PasetoService).singleton(),

	// Repositories (singletons - stateless, share db connection)
	emailRepository:
		process.env['EMAIL_PROVIDER'] === 'ethereal'
			? asClass(EtherealEmailRepository).singleton()
			: asClass(NodemailerRepository).singleton(),
	userRepository: asClass(UserRepository).singleton(),
	authRepository: asClass(AuthenticationRepository).singleton(),
	refreshTokenRepository: asClass(RefreshTokenRepository).singleton(),
	roleRepository: asClass(RoleRepository).singleton(),
	permissionRepository: asClass(PermissionRepository).singleton(),
	userRoleRepository: asClass(UserRoleRepository).singleton(),
	userManagementRepository: asClass(UserManagementRepository).singleton(),

	// Utilities
	generatePassword: asValue(generatePassword),

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
