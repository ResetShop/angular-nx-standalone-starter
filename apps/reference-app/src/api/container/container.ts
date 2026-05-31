import { logger } from '@resetshop/util'
import { asClass, asFunction, asValue, type AwilixContainer, createContainer, InjectionMode } from 'awilix'
import { createDrizzlePgConnector } from '../helpers/drizzle-postgres-connector'
import { DrizzlePermissionRepository } from '../modules/access/permission/permission.repository'
import { PermissionService } from '../modules/access/permission/permission.service'
import { DrizzleRoleRepository } from '../modules/access/role/role.repository'
import { RoleService } from '../modules/access/role/role.service'
import { AuthPasswordService } from '../modules/auth/auth-password.service'
import { createAuthConfig } from '../modules/auth/auth.config'
import { AuthService } from '../modules/auth/auth.service'
import { DrizzleAuthenticationRepository } from '../modules/auth/authentication.repository'
import { DrizzlePasswordResetTokenRepository } from '../modules/auth/password-reset-token.repository'
import { PasswordResetService } from '../modules/auth/password-reset.service'
import { DrizzleRefreshTokenRepository } from '../modules/auth/refresh-token.repository'
import { TokenMaintenanceService } from '../modules/auth/token-maintenance.service'
import { HealthService } from '../modules/health/health.service'
import { DrizzleUserManagementRepository } from '../modules/user/user-management.repository'
import { UserManagementService } from '../modules/user/user-management.service'
import { DrizzleUserRoleRepository } from '../modules/user/user-role.repository'
import { UserRoleService } from '../modules/user/user-role.service'
import { DrizzleUserRepository } from '../modules/user/user.repository'
import { EmailService } from '../services/email/email.service'
import { EtherealEmailRepository } from '../services/email/ethereal-email.repository'
import { EMAIL_PROVIDERS } from '../services/email/interfaces'
import { NodemailerRepository } from '../services/email/nodemailer.repository'
import { NoopEmailRepository } from '../services/email/noop-email.repository'
import { createPasetoConfig } from '../services/paseto/paseto.config'
import { PasetoService } from '../services/paseto/paseto.service'
import { createPasswordHasher, createPasswordVerifier } from '../services/password/password-hasher'
import { generatePassword } from '../utils/password'
import type { Container } from './container.interface'
import type { Cradle } from './container.types'
import { validateEnvironment } from './validate-environment'

function registerValues(c: AwilixContainer<Cradle>): void {
	c.register({
		db: asFunction(createDrizzlePgConnector).singleton(),
		authConfig: asFunction(createAuthConfig).singleton(),
		pasetoConfig: asFunction(createPasetoConfig).singleton(),
		logger: asValue(logger),
		generatePassword: asValue(generatePassword),
		hashPassword: asValue(createPasswordHasher()),
		verifyPassword: asValue(createPasswordVerifier()),
	})
}

function resolveEmailRepository() {
	const provider = process.env['EMAIL_PROVIDER']
	if (provider === EMAIL_PROVIDERS.NOOP) return asClass(NoopEmailRepository).singleton()
	if (provider === EMAIL_PROVIDERS.ETHEREAL) return asClass(EtherealEmailRepository).singleton()
	return asClass(NodemailerRepository).singleton()
}

function registerRepositories(c: AwilixContainer<Cradle>): void {
	c.register({
		emailRepository: resolveEmailRepository(),
		userRepository: asClass(DrizzleUserRepository).singleton(),
		authRepository: asClass(DrizzleAuthenticationRepository).singleton(),
		refreshTokenRepository: asClass(DrizzleRefreshTokenRepository).singleton(),
		passwordResetTokenRepository: asClass(DrizzlePasswordResetTokenRepository).singleton(),
		roleRepository: asClass(DrizzleRoleRepository).singleton(),
		permissionRepository: asClass(DrizzlePermissionRepository).singleton(),
		userRoleRepository: asClass(DrizzleUserRoleRepository).singleton(),
		userManagementRepository: asClass(DrizzleUserManagementRepository).singleton(),
	})
}

function registerServices(c: AwilixContainer<Cradle>): void {
	c.register({
		emailService: asClass(EmailService).singleton(),
		healthService: asClass(HealthService).singleton(),
		pasetoService: asClass(PasetoService).singleton(),
		authPasswordService: asClass(AuthPasswordService).singleton(),
		authService: asClass(AuthService).singleton(),
		tokenMaintenanceService: asClass(TokenMaintenanceService).singleton(),
		passwordResetService: asClass(PasswordResetService).singleton(),
		roleService: asClass(RoleService).singleton(),
		permissionService: asClass(PermissionService).singleton(),
		userRoleService: asClass(UserRoleService).singleton(),
		userManagementService: asClass(UserManagementService).singleton(),
	})
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
	validateEnvironment()

	const c = createContainer<Cradle>({
		injectionMode: InjectionMode.PROXY,
		strict: true,
	})

	registerValues(c)
	registerRepositories(c)
	registerServices(c)

	return c
}

/**
 * Singleton DI container that supports delegate-based test isolation.
 * In production, cradle/resolve access the real Awilix container (lazy-initialized).
 * In tests, call use(mockContainer) to redirect all resolution to a InMemoryContainer,
 * then restore() in afterEach to revert to the real container.
 */
class DependencyContainer implements Container {
	private awilix: Readonly<AwilixContainer<Cradle>> | null = null
	private delegate: Container | null = null

	private initAwilix(): Readonly<AwilixContainer<Cradle>> {
		this.awilix ??= createAwilixContainer()
		return this.awilix
	}

	public get cradle(): Cradle {
		if (this.delegate) return this.delegate.cradle
		return this.initAwilix().cradle
	}

	public resolve<K extends keyof Cradle>(key: K): Cradle[K] {
		if (this.delegate) return this.delegate.resolve(key)
		return this.initAwilix().resolve(key)
	}

	/**
	 * Verifies that all registered dependencies can be resolved.
	 * Always operates on the real Awilix container, not the delegate.
	 * Call at server startup to fail fast if configuration is invalid.
	 * @throws Error if any dependency fails to resolve
	 */
	public verify(): void {
		const awilix = this.initAwilix()
		for (const dep of Object.keys(awilix.registrations)) {
			// Use string overload intentionally — verifying all registered keys at startup
			awilix.resolve(dep)
		}
	}

	/**
	 * Replaces the active container with a delegate (e.g. InMemoryContainer for tests).
	 * While a delegate is active, cradle and resolve() forward to it.
	 */
	public use(delegate: Container): void {
		this.delegate = delegate
	}

	/**
	 * Removes the delegate, restoring the real Awilix container.
	 * Call in afterEach to ensure clean state between tests.
	 */
	public restore(): void {
		this.delegate = null
	}
}

export const container = new DependencyContainer()
