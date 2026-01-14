import { beforeEach, describe, expect, it } from 'vitest';
import { fn } from '../../container.mock';
import type { RoleData } from '../role/interfaces';
import type { UserData } from '../user/interfaces';
import type { IUserRoleRepository, PaginatedResponse, PermissionData } from './interfaces';
import { USER_ROLE_ERRORS, UserRoleService } from './user-role.service';

describe('UserRoleService', () => {
	// Mock functions
	const mockGetUserRoles = fn<[number, { offset?: number; limit?: number }?], Promise<PaginatedResponse<RoleData>>>();
	const mockGetUserPermissions = fn<[number], Promise<PermissionData[]>>();
	const mockAssignRoleToUser = fn<[number, number], Promise<void>>();
	const mockRemoveRoleFromUser = fn<[number, number], Promise<boolean>>();
	const mockUserHasRole = fn<[number, number], Promise<boolean>>();
	const mockFindUserById = fn<[number], Promise<UserData | null>>();
	const mockFindRoleById = fn<[number], Promise<RoleData | null>>();

	const mockUserRoleRepository: IUserRoleRepository = {
		getUserRoles: mockGetUserRoles,
		getUserPermissions: mockGetUserPermissions,
		assignRoleToUser: mockAssignRoleToUser,
		removeRoleFromUser: mockRemoveRoleFromUser,
		userHasRole: mockUserHasRole,
	};

	const mockUserRepository = {
		findById: mockFindUserById,
		findByEmail: fn(),
	};

	const mockRoleRepository = {
		findById: mockFindRoleById,
		findByCode: fn(),
		findAll: fn(),
		create: fn(),
		update: fn(),
		delete: fn(),
		getPermissionsForRole: fn(),
		assignPermissions: fn(),
		removeAllPermissions: fn(),
	};

	let service: UserRoleService;

	const testUser: UserData = {
		id: 1,
		email: 'test@example.com',
		firstName: 'Test',
		lastName: 'User',
		enabled: true,
		deleted: false,
	};

	const testRole: RoleData = {
		id: 1,
		name: 'Admin',
		code: 'admin',
		description: 'Administrator',
		removable: false,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const testPermissions: PermissionData[] = [
		{ id: 1, name: 'can_create_users', description: 'Create users', resource: 'users', action: 'create' },
		{ id: 2, name: 'can_delete_users', description: 'Delete users', resource: 'users', action: 'delete' },
	];

	beforeEach(() => {
		mockGetUserRoles.mockClear();
		mockGetUserPermissions.mockClear();
		mockAssignRoleToUser.mockClear();
		mockRemoveRoleFromUser.mockClear();
		mockUserHasRole.mockClear();
		mockFindUserById.mockClear();
		mockFindRoleById.mockClear();

		service = new UserRoleService({
			userRoleRepository: mockUserRoleRepository,
			userRepository: mockUserRepository,
			roleRepository: mockRoleRepository,
		});
	});

	describe('getUserRoles', () => {
		it('should return user roles with pagination', async () => {
			const paginatedResponse: PaginatedResponse<RoleData> = {
				data: [testRole],
				total: 1,
				offset: 0,
				limit: 10,
			};
			mockFindUserById.mockResolvedValue(testUser);
			mockGetUserRoles.mockResolvedValue(paginatedResponse);

			const result = await service.getUserRoles(1);

			expect(result).toEqual(paginatedResponse);
			expect(mockFindUserById.calls).toEqual([[1]]);
			expect(mockGetUserRoles.calls).toEqual([[1, undefined]]);
		});

		it('should pass pagination parameters', async () => {
			const paginatedResponse: PaginatedResponse<RoleData> = {
				data: [testRole],
				total: 1,
				offset: 5,
				limit: 5,
			};
			mockFindUserById.mockResolvedValue(testUser);
			mockGetUserRoles.mockResolvedValue(paginatedResponse);

			const result = await service.getUserRoles(1, { offset: 5, limit: 5 });

			expect(result.offset).toBe(5);
			expect(result.limit).toBe(5);
			expect(mockGetUserRoles.calls).toEqual([[1, { offset: 5, limit: 5 }]]);
		});

		it('should throw USER_NOT_FOUND when user does not exist', async () => {
			mockFindUserById.mockResolvedValue(null);

			await expect(service.getUserRoles(999)).rejects.toThrow(USER_ROLE_ERRORS.USER_NOT_FOUND);
		});
	});

	describe('getUserPermissions', () => {
		it('should return user permissions', async () => {
			mockFindUserById.mockResolvedValue(testUser);
			mockGetUserPermissions.mockResolvedValue(testPermissions);

			const result = await service.getUserPermissions(1);

			expect(result).toEqual(testPermissions);
			expect(mockFindUserById.calls).toEqual([[1]]);
			expect(mockGetUserPermissions.calls).toEqual([[1]]);
		});

		it('should throw USER_NOT_FOUND when user does not exist', async () => {
			mockFindUserById.mockResolvedValue(null);

			await expect(service.getUserPermissions(999)).rejects.toThrow(USER_ROLE_ERRORS.USER_NOT_FOUND);
		});
	});

	describe('assignRoleToUser', () => {
		it('should assign role to user', async () => {
			mockFindUserById.mockResolvedValue(testUser);
			mockFindRoleById.mockResolvedValue(testRole);
			mockUserHasRole.mockResolvedValue(false);
			mockAssignRoleToUser.mockResolvedValue(undefined);

			await service.assignRoleToUser(1, 1);

			expect(mockFindUserById.calls).toEqual([[1]]);
			expect(mockFindRoleById.calls).toEqual([[1]]);
			expect(mockUserHasRole.calls).toEqual([[1, 1]]);
			expect(mockAssignRoleToUser.calls).toEqual([[1, 1]]);
		});

		it('should throw USER_NOT_FOUND when user does not exist', async () => {
			mockFindUserById.mockResolvedValue(null);

			await expect(service.assignRoleToUser(999, 1)).rejects.toThrow(USER_ROLE_ERRORS.USER_NOT_FOUND);
		});

		it('should throw ROLE_NOT_FOUND when role does not exist', async () => {
			mockFindUserById.mockResolvedValue(testUser);
			mockFindRoleById.mockResolvedValue(null);

			await expect(service.assignRoleToUser(1, 999)).rejects.toThrow(USER_ROLE_ERRORS.ROLE_NOT_FOUND);
		});

		it('should throw ROLE_ALREADY_ASSIGNED when role is already assigned', async () => {
			mockFindUserById.mockResolvedValue(testUser);
			mockFindRoleById.mockResolvedValue(testRole);
			mockUserHasRole.mockResolvedValue(true);

			await expect(service.assignRoleToUser(1, 1)).rejects.toThrow(USER_ROLE_ERRORS.ROLE_ALREADY_ASSIGNED);
		});
	});

	describe('removeRoleFromUser', () => {
		it('should remove role from user', async () => {
			mockFindUserById.mockResolvedValue(testUser);
			mockRemoveRoleFromUser.mockResolvedValue(true);

			await service.removeRoleFromUser(1, 1);

			expect(mockFindUserById.calls).toEqual([[1]]);
			expect(mockRemoveRoleFromUser.calls).toEqual([[1, 1]]);
		});

		it('should throw USER_NOT_FOUND when user does not exist', async () => {
			mockFindUserById.mockResolvedValue(null);

			await expect(service.removeRoleFromUser(999, 1)).rejects.toThrow(USER_ROLE_ERRORS.USER_NOT_FOUND);
		});

		it('should throw ROLE_NOT_ASSIGNED when role is not assigned', async () => {
			mockFindUserById.mockResolvedValue(testUser);
			mockRemoveRoleFromUser.mockResolvedValue(false);

			await expect(service.removeRoleFromUser(1, 999)).rejects.toThrow(USER_ROLE_ERRORS.ROLE_NOT_ASSIGNED);
		});
	});
});
