import type { DrizzlePgConnector } from '../helpers/drizzle-postgres-connector';
import type { IPermissionRepository, IPermissionService } from '../modules/access/permission/interfaces';
import type { IRoleRepository, IRoleService } from '../modules/access/role/interfaces';
import type {
	IAuthService,
	IAuthenticationRepository,
	IRefreshTokenRepository,
	ITokenMaintenanceService,
} from '../modules/auth/interfaces';
import type { IHealthService } from '../modules/health/interfaces';
import type {
	IUserManagementRepository,
	IUserManagementService,
	IUserRepository,
	IUserRoleRepository,
	IUserRoleService,
} from '../modules/user/interfaces';
import type { IEmailRepository, IEmailService } from '../services/email/interfaces';
import type { IPasetoService } from '../services/paseto/interfaces';

/**
 * Cradle interface defines all dependencies available in the container.
 * This provides type safety when resolving dependencies.
 *
 * Dependency Graph:
 *
 * HealthService ──────────────► db
 *
 * AuthService (implements IAuthService + ITokenMaintenanceService)
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
	db: DrizzlePgConnector;
	generatePassword: () => Promise<string>;

	// Repositories (registerRepositories)
	emailRepository: IEmailRepository;
	userRepository: IUserRepository;
	authRepository: IAuthenticationRepository;
	refreshTokenRepository: IRefreshTokenRepository;
	roleRepository: IRoleRepository;
	permissionRepository: IPermissionRepository;
	userRoleRepository: IUserRoleRepository;
	userManagementRepository: IUserManagementRepository;

	// Services (registerServices)
	healthService: IHealthService;
	emailService: IEmailService;
	pasetoService: IPasetoService;
	authService: IAuthService & ITokenMaintenanceService;
	tokenMaintenanceService: ITokenMaintenanceService;
	roleService: IRoleService;
	permissionService: IPermissionService;
	userRoleService: IUserRoleService;
	userManagementService: IUserManagementService;
}
