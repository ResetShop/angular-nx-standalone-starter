import { toSnakeCode } from './slug';

describe('toSnakeCode', () => {
	it('should return empty string for empty input', () => {
		expect(toSnakeCode('')).toBe('');
	});

	it('should convert a basic name to snake_case', () => {
		expect(toSnakeCode('User Manager')).toBe('user_manager');
	});

	it('should strip special characters', () => {
		expect(toSnakeCode('Admin (Super!)')).toBe('admin_super');
	});

	it('should strip leading digits', () => {
		expect(toSnakeCode('123admin')).toBe('admin');
	});

	it('should collapse multiple spaces into a single underscore', () => {
		expect(toSnakeCode('role   name')).toBe('role_name');
	});

	it('should pass through an already valid code', () => {
		expect(toSnakeCode('valid_code')).toBe('valid_code');
	});

	it('should return empty string when all characters are invalid', () => {
		expect(toSnakeCode('!!!###')).toBe('');
	});

	it('should trim leading and trailing whitespace', () => {
		expect(toSnakeCode('  hello  ')).toBe('hello');
	});

	it('should handle digits after the first alpha character', () => {
		expect(toSnakeCode('role2 admin')).toBe('role2_admin');
	});
});
