import { container } from './container';

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
});
