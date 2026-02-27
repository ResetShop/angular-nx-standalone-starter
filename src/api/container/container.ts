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
import { BaseContainer } from './container.base';
import type { Cradle } from './container.types';
import { validateEnvironment } from './validate-environment';

function registerInfrastructure(c: AwilixContainer<Cradle>): void {
	c.register({
		db: asValue(drizzlePgConnector),
		generatePassword: asValue(generatePassword),
		emailRepository:
			process.env['EMAIL_PROVIDER'] === 'ethereal'
				? asClass(EtherealEmailRepository).singleton()
				: asClass(NodemailerRepository).singleton(),
	});
}

function registerRepositories(c: AwilixContainer<Cradle>): void {
	c.register({
		userRepository: asClass(UserRepository).singleton(),
		authRepository: asClass(AuthenticationRepository).singleton(),
		refreshTokenRepository: asClass(RefreshTokenRepository).singleton(),
		roleRepository: asClass(RoleRepository).singleton(),
		permissionRepository: asClass(PermissionRepository).singleton(),
		userRoleRepository: asClass(UserRoleRepository).singleton(),
		userManagementRepository: asClass(UserManagementRepository).singleton(),
	});
}

function registerServices(c: AwilixContainer<Cradle>): void {
	c.register({
		emailService: asClass(EmailService).singleton(),
		healthService: asClass(HealthService).singleton(),
		pasetoService: asClass(PasetoService).singleton(),
		authService: asClass(AuthService).singleton(),
		roleService: asClass(RoleService).singleton(),
		permissionService: asClass(PermissionService).singleton(),
		userRoleService: asClass(UserRoleService).singleton(),
		userManagementService: asClass(UserManagementService).singleton(),
	});
}

/**
 * Creates and wires the Awilix DI container.
 * Environment validation and container wiring happen on first access,
 * not at module import time. This keeps the module pure and avoids
 * throwing in test files that only use the mock container.
 *
 * Using PROXY injection mode for:
 * - Works with minified code (production builds)
 * - Dependencies resolved via property access on proxy object
 * - Destructured constructor parameters work correctly
 */
function createAwilixContainer(): Readonly<AwilixContainer<Cradle>> {
	validateEnvironment();

	const c = createContainer<Cradle>({
		injectionMode: InjectionMode.PROXY,
		strict: true,
	});

	registerInfrastructure(c);
	registerRepositories(c);
	registerServices(c);

	return c;
}

/**
 * Singleton DI container that supports delegate-based test isolation.
 * In production, cradle/resolve access the real Awilix container (lazy-initialized).
 * In tests, call use(mockContainer) to redirect all resolution to a MockContainer,
 * then restore() in afterEach to revert to the real container.
 */
class Container extends BaseContainer {
	private awilix: Readonly<AwilixContainer<Cradle>> | null = null;
	private delegate: BaseContainer | null = null;

	private initAwilix(): Readonly<AwilixContainer<Cradle>> {
		this.awilix ??= createAwilixContainer();
		return this.awilix;
	}

	get cradle(): Cradle {
		if (this.delegate) return this.delegate.cradle;
		return this.initAwilix().cradle;
	}

	resolve<K extends keyof Cradle>(key: K): Cradle[K] {
		if (this.delegate) return this.delegate.resolve(key);
		return this.initAwilix().resolve(key);
	}

	/**
	 * Verifies that all registered dependencies can be resolved.
	 * Always operates on the real Awilix container, not the delegate.
	 * Call at server startup to fail fast if configuration is invalid.
	 * @throws Error if any dependency fails to resolve
	 */
	verify(): void {
		const awilix = this.initAwilix();
		for (const dep of Object.keys(awilix.registrations)) {
			// Use string overload intentionally — verifying all registered keys at startup
			awilix.resolve(dep);
		}
	}

	/**
	 * Replaces the active container with a delegate (e.g. MockContainer for tests).
	 * While a delegate is active, cradle and resolve() forward to it.
	 */
	use(delegate: BaseContainer): void {
		this.delegate = delegate;
	}

	/**
	 * Removes the delegate, restoring the real Awilix container.
	 * Call in afterEach to ensure clean state between tests.
	 */
	restore(): void {
		this.delegate = null;
	}
}

export const container = new Container();
