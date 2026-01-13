import { container, verifyContainer } from './container';
import { resetTestCradle, setTestCradle } from './container.mock';

/**
 * DI Container Integration Tests
 *
 * These tests verify that all dependencies are properly registered and resolvable.
 * Environment validation (PASETO_SECRET_KEY) is tested implicitly - if the env var
 * is missing or invalid, the container module will throw at import time, causing
 * these tests to fail before they even run.
 */
describe('DI Container', () => {
	describe('dependency resolution', () => {
		it('should resolve db infrastructure', () => {
			expect(container.cradle.db).toBeDefined();
		});

		it('should resolve pasetoService', () => {
			expect(container.cradle.pasetoService).toBeDefined();
		});

		it('should resolve userRepository', () => {
			expect(container.cradle.userRepository).toBeDefined();
		});

		it('should resolve authRepository', () => {
			expect(container.cradle.authRepository).toBeDefined();
		});

		it('should resolve refreshTokenRepository', () => {
			expect(container.cradle.refreshTokenRepository).toBeDefined();
		});

		it('should resolve authService', () => {
			expect(container.cradle.authService).toBeDefined();
		});
	});

	describe('singleton behavior', () => {
		it('should return the same authService instance', () => {
			const service1 = container.cradle.authService;
			const service2 = container.cradle.authService;
			expect(service1).toBe(service2);
		});

		it('should return the same pasetoService instance', () => {
			const service1 = container.cradle.pasetoService;
			const service2 = container.cradle.pasetoService;
			expect(service1).toBe(service2);
		});

		it('should return the same userRepository instance', () => {
			const repo1 = container.cradle.userRepository;
			const repo2 = container.cradle.userRepository;
			expect(repo1).toBe(repo2);
		});
	});

	describe('verifyContainer', () => {
		it('should not throw when all critical dependencies are resolvable', () => {
			expect(() => verifyContainer()).not.toThrow();
		});
	});

	describe('test cradle proxy', () => {
		afterEach(() => {
			resetTestCradle();
		});

		it('should return mocked service when test cradle is set', () => {
			const mockRoleService = { getAllRoles: () => Promise.resolve([]) };
			setTestCradle({
				roleService: mockRoleService as any,
			});

			expect(container.cradle.roleService).toBe(mockRoleService);
		});

		it('should throw when accessing unmocked service in test mode', () => {
			setTestCradle({
				roleService: { getAllRoles: () => Promise.resolve([]) } as any,
			});

			// authService wasn't mocked, so accessing it should throw
			expect(() => container.cradle.authService).toThrow('Test mock missing for service: authService');
		});

		it('should return real service after test cradle is reset', () => {
			setTestCradle({
				roleService: { getAllRoles: () => Promise.resolve([]) } as any,
			});

			resetTestCradle();

			// After reset, real authService should be accessible
			expect(container.cradle.authService).toBeDefined();
			expect(container.cradle.authService.constructor.name).toBe('AuthService');
		});
	});
});
