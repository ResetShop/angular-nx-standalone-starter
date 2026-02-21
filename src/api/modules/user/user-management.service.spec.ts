import { clearAllMocks, fn } from '@test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import type { RoleData } from '../access/role/interfaces';
import type {
	CreateUserWithHashedPasswordParams,
	IUserManagementRepository,
	ManagedUserData,
	UserData,
} from './interfaces';
import { USER_MANAGEMENT_ERRORS, UserManagementService } from './user-management.service';

describe('UserManagementService', () => {
	// Mock functions
	const mockFindAll = fn<
		[{ offset?: number; limit?: number } | undefined, string | undefined],
		Promise<{ data: ManagedUserData[]; total: number; offset: number; limit: number }>
	>();
	const mockFindByIdWithRoles = fn<[number], Promise<ManagedUserData | null>>();
	const mockFindByEmail = fn<[string], Promise<UserData | null>>();
	const mockCreate = fn<[CreateUserWithHashedPasswordParams], Promise<ManagedUserData>>();
	const mockUpdate = fn<
		[number, { email?: string; firstName?: string; lastName?: string; enabled?: boolean }],
		Promise<UserData | null>
	>();
	const mockSoftDelete = fn<[number], Promise<boolean>>();
	const mockReplaceUserRoles = fn<[number, number[]], Promise<void>>();

	const mockRepository: IUserManagementRepository = {
		findAll: mockFindAll,
		findByIdWithRoles: mockFindByIdWithRoles,
		findByEmail: mockFindByEmail,
		create: mockCreate,
		update: mockUpdate,
		softDelete: mockSoftDelete,
		replaceUserRoles: mockReplaceUserRoles,
	};

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

		service = new UserManagementService({
			userManagementRepository: mockRepository,
		});
	});

	describe('list', () => {
		it('should return paginated users', async () => {
			const paginatedResponse = {
				data: [testManagedUser],
				total: 1,
				offset: 0,
				limit: 10,
			};
			mockFindAll.mockResolvedValue(paginatedResponse);

			const result = await service.list();

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

			const result = await service.list({ offset: 5, limit: 5 }, 'test');

			expect(result.offset).toBe(5);
			expect(result.limit).toBe(5);
			expect(mockFindAll.calls).toEqual([[{ offset: 5, limit: 5 }, 'test']]);
		});
	});

	describe('getById', () => {
		it('should return user with roles', async () => {
			mockFindByIdWithRoles.mockResolvedValue(testManagedUser);

			// eslint-disable-next-line testing-library/no-await-sync-queries -- service method, not DOM query
			const result = await service.getById(1);

			expect(result).toEqual(testManagedUser);
			expect(mockFindByIdWithRoles.calls).toEqual([[1]]);
		});

		it('should throw NOT_FOUND when user does not exist', async () => {
			mockFindByIdWithRoles.mockResolvedValue(null);

			await expect(service.getById(999)).rejects.toThrow(USER_MANAGEMENT_ERRORS.NOT_FOUND);
		});
	});

	describe('create', () => {
		it('should create a new user with roles', async () => {
			mockFindByEmail.mockResolvedValue(null);
			mockCreate.mockResolvedValue(testManagedUser);

			const result = await service.create({
				email: 'test@example.com',
				password: 'password123',
				firstName: 'Test',
				lastName: 'User',
				roleIds: [1],
			});

			expect(result).toEqual(testManagedUser);
			expect(mockFindByEmail.calls).toEqual([['test@example.com']]);
			expect(mockCreate.calls).toHaveLength(1);
			expect(mockCreate.calls[0][0]).toMatchObject({ roleIds: [1] });
		});

		it('should create user without roles when roleIds is omitted', async () => {
			const userWithNoRoles = { ...testManagedUser, roles: [] };
			mockFindByEmail.mockResolvedValue(null);
			mockCreate.mockResolvedValue(userWithNoRoles);

			const result = await service.create({
				email: 'test@example.com',
				password: 'password123',
				firstName: 'Test',
				lastName: 'User',
			});

			expect(result.roles).toEqual([]);
			expect(mockCreate.calls[0][0]).toMatchObject({ roleIds: [] });
		});

		it('should throw EMAIL_EXISTS when email is taken', async () => {
			mockFindByEmail.mockResolvedValue(testUser);

			await expect(
				service.create({
					email: 'test@example.com',
					password: 'password123',
					firstName: 'Test',
					lastName: 'User',
				}),
			).rejects.toThrow(USER_MANAGEMENT_ERRORS.EMAIL_EXISTS);
		});
	});

	describe('update', () => {
		it('should update user details', async () => {
			const updatedUser = { ...testManagedUser, firstName: 'Updated' };
			mockFindByIdWithRoles.mockImplementation(() => {
				if (mockFindByIdWithRoles.calls.length <= 1) {
					return Promise.resolve(testManagedUser);
				}
				return Promise.resolve(updatedUser);
			});
			mockUpdate.mockResolvedValue({ ...testUser, firstName: 'Updated' });

			const result = await service.update(1, { firstName: 'Updated' }, 999);

			expect(result.firstName).toBe('Updated');
		});

		it('should throw NOT_FOUND when user does not exist', async () => {
			mockFindByIdWithRoles.mockResolvedValue(null);

			await expect(service.update(999, { firstName: 'Updated' }, 1)).rejects.toThrow(USER_MANAGEMENT_ERRORS.NOT_FOUND);
		});

		it('should throw SELF_DISABLE when disabling own account', async () => {
			mockFindByIdWithRoles.mockResolvedValue(testManagedUser);

			await expect(service.update(1, { enabled: false }, 1)).rejects.toThrow(USER_MANAGEMENT_ERRORS.SELF_DISABLE);
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

			const result = await service.update(1, { enabled: false }, 999);

			expect(result.enabled).toBe(false);
		});

		it('should throw EMAIL_EXISTS when changing to taken email', async () => {
			mockFindByIdWithRoles.mockResolvedValue(testManagedUser);
			mockFindByEmail.mockResolvedValue({ ...testUser, id: 2, email: 'taken@example.com' });

			await expect(service.update(1, { email: 'taken@example.com' }, 999)).rejects.toThrow(
				USER_MANAGEMENT_ERRORS.EMAIL_EXISTS,
			);
		});

		it('should update roles when roleIds provided', async () => {
			mockFindByIdWithRoles.mockResolvedValue(testManagedUser);
			mockReplaceUserRoles.mockResolvedValue(undefined);

			await service.update(1, { roleIds: [1, 2] }, 999);

			expect(mockReplaceUserRoles.calls).toEqual([[1, [1, 2]]]);
		});

		it('should deduplicate roleIds before replacing roles', async () => {
			mockFindByIdWithRoles.mockResolvedValue(testManagedUser);
			mockReplaceUserRoles.mockResolvedValue(undefined);

			await service.update(1, { roleIds: [1, 2, 1, 2] }, 999);

			expect(mockReplaceUserRoles.calls).toEqual([[1, [1, 2]]]);
		});
	});

	describe('delete', () => {
		it('should soft delete a user', async () => {
			mockSoftDelete.mockResolvedValue(true);

			await service.delete(1);

			expect(mockSoftDelete.calls).toEqual([[1]]);
		});

		it('should throw NOT_FOUND when user does not exist', async () => {
			mockSoftDelete.mockResolvedValue(false);

			await expect(service.delete(999)).rejects.toThrow(USER_MANAGEMENT_ERRORS.NOT_FOUND);
		});
	});
});
