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

	c.register({
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

	return c;
}

let defaultContainer: Container | null = null;
let activeContainer: BaseContainer | null = null;

export class Container extends BaseContainer {
	private awilix: Readonly<AwilixContainer<Cradle>> | null = null;

	static get active(): BaseContainer {
		return activeContainer ?? Container.default;
	}

	static setActive(c: BaseContainer): void {
		activeContainer = c;
	}

	static resetActive(): void {
		activeContainer = null;
	}

	/**
	 * Verifies that all registered dependencies can be resolved.
	 * Call at server startup to fail fast if configuration is invalid.
	 * @throws Error if any dependency fails to resolve
	 */
	static verify(): void {
		const awilix = Container.default.initAwilix();
		for (const dep of Object.keys(awilix.registrations)) {
			awilix.resolve(dep);
		}
	}

	private static get default(): Container {
		defaultContainer ??= new Container();
		return defaultContainer;
	}

	private initAwilix(): Readonly<AwilixContainer<Cradle>> {
		this.awilix ??= createAwilixContainer();
		return this.awilix;
	}

	get cradle(): Cradle {
		return this.initAwilix().cradle;
	}

	resolve<K extends keyof Cradle>(key: K): Cradle[K] {
		return this.initAwilix().resolve(key);
	}
}

/**
 * Container proxy that delegates to the currently active container.
 * In production, this is the singleton Container instance.
 * In tests, MockContainer.activate() swaps it to a mock container.
 */
export const container: Pick<BaseContainer, 'cradle' | 'resolve'> = {
	get cradle(): Cradle {
		return Container.active.cradle;
	},
	resolve<K extends keyof Cradle>(key: K): Cradle[K] {
		return Container.active.resolve(key);
	},
};
