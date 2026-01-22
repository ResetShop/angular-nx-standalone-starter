import { authStorageDataSchema } from './auth-storage.type';

describe('authStorageDataSchema', () => {
	describe('valid data', () => {
		it('should pass for valid AuthStorageData with empty roles', () => {
			const data = {
				id: 1,
				email: 'john@example.com',
				firstName: 'John',
				lastName: 'Doe',
				token: 'token123',
				roles: [],
			};

			const result = authStorageDataSchema.safeParse(data);

			expect(result.success).toBe(true);
		});
	});

	describe('invalid data', () => {
		it('should fail for missing id', () => {
			const data = {
				email: 'john@example.com',
				firstName: 'John',
				lastName: 'Doe',
				token: 'token123',
				roles: [],
			};

			const result = authStorageDataSchema.safeParse(data);

			expect(result.success).toBe(false);
		});

		it('should fail for missing email', () => {
			const data = {
				id: 1,
				firstName: 'John',
				lastName: 'Doe',
				token: 'token123',
				roles: [],
			};

			const result = authStorageDataSchema.safeParse(data);

			expect(result.success).toBe(false);
		});

		it('should fail for missing token', () => {
			const data = {
				id: 1,
				email: 'john@example.com',
				firstName: 'John',
				lastName: 'Doe',
				roles: [],
			};

			const result = authStorageDataSchema.safeParse(data);

			expect(result.success).toBe(false);
		});

		it('should fail for missing roles', () => {
			const data = {
				id: 1,
				email: 'john@example.com',
				firstName: 'John',
				lastName: 'Doe',
				token: 'token123',
			};

			const result = authStorageDataSchema.safeParse(data);

			expect(result.success).toBe(false);
		});

		it('should fail for invalid id type', () => {
			const data = {
				id: 'not-a-number',
				email: 'john@example.com',
				firstName: 'John',
				lastName: 'Doe',
				token: 'token123',
				roles: [],
			};

			const result = authStorageDataSchema.safeParse(data);

			expect(result.success).toBe(false);
		});

		it('should fail for null input', () => {
			const result = authStorageDataSchema.safeParse(null);

			expect(result.success).toBe(false);
		});

		it('should fail for undefined input', () => {
			const result = authStorageDataSchema.safeParse(undefined);

			expect(result.success).toBe(false);
		});

		it('should fail for roles not being an array', () => {
			const data = {
				id: 1,
				email: 'john@example.com',
				firstName: 'John',
				lastName: 'Doe',
				token: 'token123',
				roles: 'not-an-array',
			};

			const result = authStorageDataSchema.safeParse(data);

			expect(result.success).toBe(false);
		});
	});

	describe('type inference', () => {
		it('should infer correct type on success', () => {
			const data = {
				id: 1,
				email: 'john@example.com',
				firstName: 'John',
				lastName: 'Doe',
				token: 'token123',
				roles: [],
			};

			const result = authStorageDataSchema.safeParse(data);

			if (result.success) {
				expect(result.data.id).toBe(1);
				expect(result.data.email).toBe('john@example.com');
				expect(result.data.roles).toEqual([]);
			}
		});
	});
});
