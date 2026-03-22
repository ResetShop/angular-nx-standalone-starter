import type { Logger } from '@utils/logger'
import type { DrizzlePgConnector } from '../helpers/drizzle-postgres-connector'
import type { PermissionRepository, PermissionService } from '../modules/access/permission/interfaces'
import type { RoleRepository, RoleService } from '../modules/access/role/interfaces'
import type {
	AuthService,
	AuthenticationRepository,
	RefreshTokenRepository,
	TokenMaintenanceService,
} from '../modules/auth/interfaces'
import type { HealthService } from '../modules/health/interfaces'
import type {
	UserManagementRepository,
	UserManagementService,
	UserRepository,
	UserRoleRepository,
	UserRoleService,
} from '../modules/user/interfaces'
import type { EmailRepository, EmailService } from '../services/email/interfaces'
import type { PasetoService } from '../services/paseto/interfaces'

/**
 * Cradle interface defines all dependencies available in the container.
 * This provides type safety when resolving dependencies.
 *
 * Dependency Graph:
 *
 * HealthService ──────────────► db
 *
 * AuthService (satisfies AuthService & TokenMaintenanceService interfaces)
 *   ├── UserRepository ──────► db
 *   ├── AuthRepository ──────► db
 *   ├── RefreshTokenRepository ► db
 *   └── PasetoService (no deps)
 *
 * TokenMaintenanceService ──► AuthService (same instance, narrower interface)
 *
 * RoleService
 *   ├── RoleRepository ──────► db
 *   └── UserRoleRepository ──► db
 *
 * PermissionService
 *   └── PermissionRepository ► db
 *
 * UserRoleService
 *   ├── UserRoleRepository ──► db
 *   ├── UserRepository ──────► db
 *   └── RoleRepository ──────► db
 *
 * UserManagementService
 *   ├── UserManagementRepository ► db
 *   ├── EmailService
 *   └── generatePassword (value)
 *
 * EmailService
 *   └── EmailRepository (selected via EMAIL_PROVIDER env var: 'nodemailer' | 'ethereal')
 * PasetoService (no deps)
 *
 * Middleware/Controllers resolve services lazily at runtime.
 * All services are registered as singletons.
 */
export interface Cradle {
	// Values (registerValues)
	db: DrizzlePgConnector
	logger: Logger
	generatePassword: () => Promise<string>

	// Repositories (registerRepositories)
	emailRepository: EmailRepository
	userRepository: UserRepository
	authRepository: AuthenticationRepository
	refreshTokenRepository: RefreshTokenRepository
	roleRepository: RoleRepository
	permissionRepository: PermissionRepository
	userRoleRepository: UserRoleRepository
	userManagementRepository: UserManagementRepository

	// Services (registerServices)
	healthService: HealthService
	emailService: EmailService
	pasetoService: PasetoService
	authService: AuthService & TokenMaintenanceService
	tokenMaintenanceService: TokenMaintenanceService
	roleService: RoleService
	permissionService: PermissionService
	userRoleService: UserRoleService
	userManagementService: UserManagementService
}
