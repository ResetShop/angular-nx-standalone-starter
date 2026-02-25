import { clearAllMocks, fn } from '@test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { IEmailService, SendEmailParams } from '../../services/email/interfaces';
import type { RoleData } from '../access/role/interfaces';
import type {
	CreateUserWithHashedPasswordParams,
	IUserManagementRepository,
	ManagedUserData,
	UpdateUserParams,
	UserData,
} from './interfaces';
import { USER_MANAGEMENT_ERRORS, UserManagementService } from './user-management.service';

describe('UserManagementService', () => {
	// Repository mock functions
	const mockFindAll = fn<
		[{ offset?: number; limit?: number } | undefined, string | undefined],
		Promise<{ data: ManagedUserData[]; total: number; offset: number; limit: number }>
	>();
	const mockFindByIdWithRoles = fn<[number], Promise<ManagedUserData | null>>();
	const mockFindByEmail = fn<[string], Promise<UserData | null>>();
	const mockCreate = fn<[CreateUserWithHashedPasswordParams], Promise<ManagedUserData>>();
	const mockUpdate = fn<[number, UpdateUserParams], Promise<UserData | null>>();
	const mockSoftDelete = fn<[number], Promise<boolean>>();

	const mockRepository: IUserManagementRepository = {
		findAll: mockFindAll,
		findByIdWithRoles: mockFindByIdWithRoles,
		findByEmail: mockFindByEmail,
		create: mockCreate,
		update: mockUpdate,
		softDelete: mockSoftDelete,
	};

	// Email mock
	const mockSend = fn<[SendEmailParams], Promise<void>>();
	const mockEmailService: IEmailService = { send: mockSend };

	// Password generator mock
	const mockGeneratePassword = fn<[], Promise<string>>();

	// Suppress console.error in tests that trigger non-blocking email failures
	const consoleErrorSpy = fn<Parameters<typeof console.error>, void>();
	const originalConsoleError = console.error;

	let service: UserManagementService;

	const testRole: RoleData = {
		id: 1,
		name: 'Admin',
		code: 'admin',
		description: 'Administrator',
		removable: false,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const testUser: UserData = {
		id: 1,
		email: 'test@example.com',
		firstName: 'Test',
		lastName: 'User',
		enabled: true,
		deleted: false,
	};

	const testManagedUser: ManagedUserData = {
		...testUser,
		createdAt: new Date(),
		updatedAt: new Date(),
		roles: [testRole],
	};

	beforeEach(() => {
		clearAllMocks();
		console.error = consoleErrorSpy as typeof console.error;

		mockGeneratePassword.mockResolvedValue('indigo.rabbit.troop');
		mockSend.mockResolvedValue(undefined);

		service = new UserManagementService({
			userManagementRepository: mockRepository,
			emailService: mockEmailService,
			generatePassword: mockGeneratePassword,
		});
	});

	afterEach(() => {
		console.error = originalConsoleError;
	});

	describe('getAllUsers', () => {
		it('should return paginated users', async () => {
			const paginatedResponse = {
				data: [testManagedUser],
				total: 1,
				offset: 0,
				limit: 10,
			};
			mockFindAll.mockResolvedValue(paginatedResponse);

			const result = await service.getAllUsers();

			expect(result).toEqual(paginatedResponse);
			expect(mockFindAll.calls).toEqual([[undefined, undefined]]);
		});

		it('should pass pagination and search parameters', async () => {
			const paginatedResponse = {
				data: [testManagedUser],
				total: 1,
				offset: 5,
				limit: 5,
			};
			mockFindAll.mockResolvedValue(paginatedResponse);

			const result = await service.getAllUsers({ offset: 5, limit: 5 }, 'test');

			expect(result.offset).toBe(5);
			expect(result.limit).toBe(5);
			expect(mockFindAll.calls).toEqual([[{ offset: 5, limit: 5 }, 'test']]);
		});
	});

	describe('getUser', () => {
		it('should return user with roles', async () => {
			mockFindByIdWithRoles.mockResolvedValue(testManagedUser);

			const result = await service.getUser(1);

			expect(result).toEqual(testManagedUser);
			expect(mockFindByIdWithRoles.calls).toEqual([[1]]);
		});

		it('should throw NOT_FOUND when user does not exist', async () => {
			mockFindByIdWithRoles.mockResolvedValue(null);

			await expect(service.getUser(999)).rejects.toThrow(USER_MANAGEMENT_ERRORS.NOT_FOUND);
		});
	});

	describe('createUser', () => {
		it('should create a new user with roles and send welcome email', async () => {
			mockFindByEmail.mockResolvedValue(null);
			mockCreate.mockResolvedValue(testManagedUser);

			const { passwordEmailSent, ...user } = await service.createUser({
				email: 'test@example.com',
				firstName: 'Test',
				lastName: 'User',
				roleIds: [1],
			});

			expect(user).toEqual(testManagedUser);
			expect(passwordEmailSent).toBe(true);
			expect(mockFindByEmail.calls).toEqual([['test@example.com']]);
			expect(mockCreate.calls).toHaveLength(1);
			expect(mockCreate.calls[0][0]).toMatchObject({ roleIds: [1] });
		});

		it('should create user without roles when roleIds is omitted', async () => {
			const userWithNoRoles = { ...testManagedUser, roles: [] };
			mockFindByEmail.mockResolvedValue(null);
			mockCreate.mockResolvedValue(userWithNoRoles);

			const result = await service.createUser({
				email: 'test@example.com',
				firstName: 'Test',
				lastName: 'User',
			});

			expect(result.roles).toEqual([]);
			expect(mockCreate.calls[0][0]).toMatchObject({ roleIds: [] });
		});

		it('should throw EMAIL_EXISTS when email is taken', async () => {
			mockFindByEmail.mockResolvedValue(testUser);

			await expect(
				service.createUser({
					email: 'test@example.com',
					firstName: 'Test',
					lastName: 'User',
				}),
			).rejects.toThrow(USER_MANAGEMENT_ERRORS.EMAIL_EXISTS);
		});

		it('should auto-generate a password and hash it', async () => {
			mockFindByEmail.mockResolvedValue(null);
			mockCreate.mockResolvedValue(testManagedUser);

			await service.createUser({
				email: 'test@example.com',
				firstName: 'Test',
				lastName: 'User',
			});

			expect(mockGeneratePassword.calls).toHaveLength(1);
			const { passwordHash } = mockCreate.calls[0][0];
			expect(passwordHash).toEqual(expect.any(String));
			expect(passwordHash).not.toBe('indigo.rabbit.troop');
		});

		it('should default mustChangePassword to true when not provided', async () => {
			mockFindByEmail.mockResolvedValue(null);
			mockCreate.mockResolvedValue(testManagedUser);

			await service.createUser({
				email: 'test@example.com',
				firstName: 'Test',
				lastName: 'User',
			});

			expect(mockCreate.calls[0][0]).toMatchObject({ mustChangePassword: true });
		});

		it('should pass mustChangePassword false when explicitly set', async () => {
			mockFindByEmail.mockResolvedValue(null);
			mockCreate.mockResolvedValue(testManagedUser);

			await service.createUser({
				email: 'test@example.com',
				firstName: 'Test',
				lastName: 'User',
				mustChangePassword: false,
			});

			expect(mockCreate.calls[0][0]).toMatchObject({ mustChangePassword: false });
		});

		it('should pass mustChangePassword to welcome email builder', async () => {
			mockFindByEmail.mockResolvedValue(null);
			mockCreate.mockResolvedValue(testManagedUser);

			await service.createUser({
				email: 'test@example.com',
				firstName: 'Test',
				lastName: 'User',
				mustChangePassword: false,
			});

			const sentEmail = mockSend.calls[0][0];
			expect(sentEmail.text).not.toContain('change your password');
			expect(sentEmail.html).not.toContain('change your password');
			expect(sentEmail.html).not.toContain('#fff3cd');
		});

		it('should send welcome email with generated password', async () => {
			mockFindByEmail.mockResolvedValue(null);
			mockCreate.mockResolvedValue(testManagedUser);

			await service.createUser({
				email: 'test@example.com',
				firstName: 'Test',
				lastName: 'User',
			});

			expect(mockSend.calls).toHaveLength(1);
			const sentEmail = mockSend.calls[0][0];
			expect(sentEmail.to).toBe('test@example.com');
			expect(sentEmail.subject).toEqual(expect.any(String));
			expect(sentEmail.text).toContain('indigo.rabbit.troop');
			expect(sentEmail.html).toContain('indigo.rabbit.troop');
		});

		it('should return passwordEmailSent true when email succeeds', async () => {
			mockFindByEmail.mockResolvedValue(null);
			mockCreate.mockResolvedValue(testManagedUser);

			const result = await service.createUser({
				email: 'test@example.com',
				firstName: 'Test',
				lastName: 'User',
			});

			expect(result.passwordEmailSent).toBe(true);
		});

		it('should return passwordEmailSent false when email fails', async () => {
			mockFindByEmail.mockResolvedValue(null);
			mockCreate.mockResolvedValue(testManagedUser);
			mockSend.mockRejectedValue(new Error('SMTP connection refused'));

			const result = await service.createUser({
				email: 'test@example.com',
				firstName: 'Test',
				lastName: 'User',
			});

			expect(result.passwordEmailSent).toBe(false);
			expect(consoleErrorSpy.calls).toHaveLength(1);
			expect(consoleErrorSpy.calls[0][0]).toContain('[UserManagementService]');
		});

		it('should still create user when email sending fails', async () => {
			mockFindByEmail.mockResolvedValue(null);
			mockCreate.mockResolvedValue(testManagedUser);
			mockSend.mockRejectedValue(new Error('SMTP connection refused'));

			const { passwordEmailSent, ...user } = await service.createUser({
				email: 'test@example.com',
				firstName: 'Test',
				lastName: 'User',
			});

			expect(mockCreate.calls).toHaveLength(1);
			expect(user).toEqual(testManagedUser);
			expect(passwordEmailSent).toBe(false);
		});
	});

	describe('updateUser', () => {
		it('should update user details', async () => {
			const updatedUser = { ...testManagedUser, firstName: 'Updated' };
			mockFindByIdWithRoles.mockImplementation(() => {
				if (mockFindByIdWithRoles.calls.length <= 1) {
					return Promise.resolve(testManagedUser);
				}
				return Promise.resolve(updatedUser);
			});
			mockUpdate.mockResolvedValue({ ...testUser, firstName: 'Updated' });

			const result = await service.updateUser(1, { firstName: 'Updated' }, 999);

			expect(result.firstName).toBe('Updated');
		});

		it('should throw NOT_FOUND when user does not exist', async () => {
			mockFindByIdWithRoles.mockResolvedValue(null);

			await expect(service.updateUser(999, { firstName: 'Updated' }, 1)).rejects.toThrow(
				USER_MANAGEMENT_ERRORS.NOT_FOUND,
			);
		});

		it('should throw SELF_DISABLE when disabling own account', async () => {
			mockFindByIdWithRoles.mockResolvedValue(testManagedUser);

			await expect(service.updateUser(1, { enabled: false }, 1)).rejects.toThrow(USER_MANAGEMENT_ERRORS.SELF_DISABLE);
		});

		it('should allow disabling another user', async () => {
			const disabledUser = { ...testManagedUser, enabled: false };
			mockFindByIdWithRoles.mockImplementation(() => {
				if (mockFindByIdWithRoles.calls.length <= 1) {
					return Promise.resolve(testManagedUser);
				}
				return Promise.resolve(disabledUser);
			});
			mockUpdate.mockResolvedValue({ ...testUser, enabled: false });

			const result = await service.updateUser(1, { enabled: false }, 999);

			expect(result.enabled).toBe(false);
		});

		it('should throw EMAIL_EXISTS when changing to taken email', async () => {
			mockFindByIdWithRoles.mockResolvedValue(testManagedUser);
			mockFindByEmail.mockResolvedValue({ ...testUser, id: 2, email: 'taken@example.com' });

			await expect(service.updateUser(1, { email: 'taken@example.com' }, 999)).rejects.toThrow(
				USER_MANAGEMENT_ERRORS.EMAIL_EXISTS,
			);
		});
	});

	describe('deleteUser', () => {
		it('should soft delete a user', async () => {
			mockSoftDelete.mockResolvedValue(true);

			await service.deleteUser(1);

			expect(mockSoftDelete.calls).toEqual([[1]]);
		});

		it('should throw NOT_FOUND when user does not exist', async () => {
			mockSoftDelete.mockResolvedValue(false);

			await expect(service.deleteUser(999)).rejects.toThrow(USER_MANAGEMENT_ERRORS.NOT_FOUND);
		});
	});
});
