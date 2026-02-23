import { hash } from 'bcryptjs';
import { BCRYPT_SALT_ROUNDS } from '../../constants/auth.constants';
import type { PaginatedResponse, PaginationParams } from '../../interfaces';
import type { IEmailService } from '../../services/email/interfaces';
import { buildWelcomeEmail } from '../../services/email/welcome-email.builder';
import type {
	CreateUserParams,
	IUserManagementRepository,
	IUserManagementService,
	ManagedUserData,
	UpdateUserParams,
} from './interfaces';

export const USER_MANAGEMENT_ERRORS = {
	NOT_FOUND: 'User not found',
	EMAIL_EXISTS: 'A user with this email already exists',
	SELF_DISABLE: 'Cannot disable your own account',
} as const;

/**
 * Error factory functions that include entity IDs for better debugging.
 * The error messages start with the base error constant for easy matching in tests.
 */
export const userManagementErrors = {
	notFound: (id: number) => new Error(`${USER_MANAGEMENT_ERRORS.NOT_FOUND} (id: ${id})`),
	emailExists: (email: string) => new Error(`${USER_MANAGEMENT_ERRORS.EMAIL_EXISTS} (email: ${email})`),
	selfDisable: () => new Error(USER_MANAGEMENT_ERRORS.SELF_DISABLE),
};

interface UserManagementServiceDeps {
	userManagementRepository: IUserManagementRepository;
	emailService: IEmailService;
	generatePassword: () => Promise<string>;
}

/**
 * Service for user management CRUD operations.
 * Handles user listing, creation, updates, soft deletion, and role assignment.
 * Enforces business rules like unique emails and self-lockout prevention.
 */
export class UserManagementService implements IUserManagementService {
	private userManagementRepository: IUserManagementRepository;
	private emailService: IEmailService;
	private generatePassword: () => Promise<string>;

	constructor({ userManagementRepository, emailService, generatePassword }: UserManagementServiceDeps) {
		this.userManagementRepository = userManagementRepository;
		this.emailService = emailService;
		this.generatePassword = generatePassword;
	}

	/**
	 * Lists all non-deleted users with pagination and optional search.
	 *
	 * @param pagination - Optional pagination parameters (offset, limit)
	 * @param search - Optional search term for email, first name, or last name
	 * @returns Paginated response containing users with roles
	 */
	async list(pagination?: PaginationParams, search?: string): Promise<PaginatedResponse<ManagedUserData>> {
		return this.userManagementRepository.findAll(pagination, search);
	}

	/**
	 * Retrieves a user by ID with their assigned roles.
	 *
	 * @param id - The user's primary key
	 * @returns User data with roles
	 * @throws Error if user not found
	 */
	async getById(id: number): Promise<ManagedUserData> {
		const userData = await this.userManagementRepository.findByIdWithRoles(id);
		if (!userData) {
			throw userManagementErrors.notFound(id);
		}
		return userData;
	}

	/**
	 * Creates a new user with optional role assignments.
	 * Auto-generates a passphrase, hashes it, stores with mustChangePassword flag,
	 * and sends a welcome email with the temporary password (non-blocking).
	 *
	 * @param params - User creation parameters (email, firstName, lastName, roleIds, mustChangePassword)
	 * @returns The newly created user with roles and passwordEmailSent flag
	 * @throws Error if email already exists
	 */
	async create(params: CreateUserParams): Promise<ManagedUserData & { passwordEmailSent: boolean }> {
		const existingUser = await this.userManagementRepository.findByEmail(params.email);
		if (existingUser) {
			throw userManagementErrors.emailExists(params.email);
		}

		const plainPassword = await this.generatePassword();
		const passwordHash = await hash(plainPassword, BCRYPT_SALT_ROUNDS);

		const mustChangePassword = params.mustChangePassword ?? true;

		const user = await this.userManagementRepository.create({
			email: params.email,
			firstName: params.firstName,
			lastName: params.lastName,
			passwordHash,
			mustChangePassword,
			roleIds: [...new Set(params.roleIds ?? [])],
		});

		let passwordEmailSent = false;
		try {
			const emailContent = buildWelcomeEmail({
				firstName: params.firstName,
				email: params.email,
				password: plainPassword,
				mustChangePassword,
			});
			await this.emailService.send({ to: params.email, ...emailContent });
			passwordEmailSent = true;
		} catch (error: unknown) {
			// TODO(#66): Replace with structured logging service
			console.error('[UserManagementService] Welcome email failed:', error);
		}

		return { ...user, passwordEmailSent };
	}

	/**
	 * Updates an existing user's details and/or role assignments.
	 * Prevents users from disabling their own account (self-lockout prevention).
	 *
	 * @param id - The user's primary key
	 * @param params - Fields to update
	 * @param currentUserId - The ID of the user performing the update
	 * @returns Updated user with roles
	 * @throws Error if user not found
	 * @throws Error if email conflicts with existing user
	 * @throws Error if attempting self-disable
	 */
	async update(id: number, params: UpdateUserParams, currentUserId: number): Promise<ManagedUserData> {
		const existingUser = await this.userManagementRepository.findByIdWithRoles(id);
		if (!existingUser) {
			throw userManagementErrors.notFound(id);
		}

		// Self-lockout prevention: cannot disable own account
		if (params.enabled === false && id === currentUserId) {
			throw userManagementErrors.selfDisable();
		}

		// Check email uniqueness if changing email
		if (params.email !== undefined && params.email !== existingUser.email) {
			const emailUser = await this.userManagementRepository.findByEmail(params.email);
			if (emailUser) {
				throw userManagementErrors.emailExists(params.email);
			}
		}

		// Update user fields
		await this.userManagementRepository.update(id, params);

		const updatedUser = await this.userManagementRepository.findByIdWithRoles(id);
		if (!updatedUser) {
			throw userManagementErrors.notFound(id);
		}
		return updatedUser;
	}

	/**
	 * Soft deletes a user by setting deleted=true.
	 *
	 * @param id - The user's primary key
	 * @throws Error if user not found
	 */
	async delete(id: number): Promise<void> {
		const deleted = await this.userManagementRepository.softDelete(id);
		if (!deleted) {
			throw userManagementErrors.notFound(id);
		}
	}
}
