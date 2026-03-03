import { parseDurationToMs, parseDurationToSeconds } from './duration';

describe('parseDurationToMs', () => {
	describe('Valid inputs', () => {
		describe('Seconds', () => {
			it('should parse 1 second correctly', () => {
				expect(parseDurationToMs('1s')).toBe(1000);
			});

			it('should parse 30 seconds correctly', () => {
				expect(parseDurationToMs('30s')).toBe(30000);
			});

			it('should parse 60 seconds correctly', () => {
				expect(parseDurationToMs('60s')).toBe(60000);
			});
		});

		describe('Minutes', () => {
			it('should parse 1 minute correctly', () => {
				expect(parseDurationToMs('1m')).toBe(60 * 1000);
			});

			it('should parse 15 minutes correctly', () => {
				expect(parseDurationToMs('15m')).toBe(15 * 60 * 1000);
			});

			it('should parse 60 minutes correctly', () => {
				expect(parseDurationToMs('60m')).toBe(60 * 60 * 1000);
			});
		});

		describe('Hours', () => {
			it('should parse 1 hour correctly', () => {
				expect(parseDurationToMs('1h')).toBe(60 * 60 * 1000);
			});

			it('should parse 12 hours correctly', () => {
				expect(parseDurationToMs('12h')).toBe(12 * 60 * 60 * 1000);
			});

			it('should parse 24 hours correctly', () => {
				expect(parseDurationToMs('24h')).toBe(24 * 60 * 60 * 1000);
			});
		});

		describe('Days', () => {
			it('should parse 1 day correctly', () => {
				expect(parseDurationToMs('1d')).toBe(24 * 60 * 60 * 1000);
			});

			it('should parse 7 days correctly', () => {
				expect(parseDurationToMs('7d')).toBe(7 * 24 * 60 * 60 * 1000);
			});

			it('should parse 30 days correctly', () => {
				expect(parseDurationToMs('30d')).toBe(30 * 24 * 60 * 60 * 1000);
			});

			it('should parse 365 days correctly', () => {
				expect(parseDurationToMs('365d')).toBe(365 * 24 * 60 * 60 * 1000);
			});
		});
	});

	describe('Edge cases', () => {
		it('should parse zero duration', () => {
			expect(parseDurationToMs('0s')).toBe(0);
			expect(parseDurationToMs('0m')).toBe(0);
			expect(parseDurationToMs('0h')).toBe(0);
			expect(parseDurationToMs('0d')).toBe(0);
		});

		it('should parse large numbers', () => {
			expect(parseDurationToMs('1000d')).toBe(1000 * 24 * 60 * 60 * 1000);
			expect(parseDurationToMs('9999h')).toBe(9999 * 60 * 60 * 1000);
		});

		it('should parse single digit numbers', () => {
			expect(parseDurationToMs('1s')).toBe(1000);
			expect(parseDurationToMs('5m')).toBe(5 * 60 * 1000);
			expect(parseDurationToMs('3h')).toBe(3 * 60 * 60 * 1000);
			expect(parseDurationToMs('2d')).toBe(2 * 24 * 60 * 60 * 1000);
		});

		it('should parse multi-digit numbers', () => {
			expect(parseDurationToMs('99s')).toBe(99000);
			expect(parseDurationToMs('123m')).toBe(123 * 60 * 1000);
			expect(parseDurationToMs('48h')).toBe(48 * 60 * 60 * 1000);
			expect(parseDurationToMs('365d')).toBe(365 * 24 * 60 * 60 * 1000);
		});
	});

	describe('Invalid inputs', () => {
		describe('Format errors', () => {
			it('should throw error for empty string', () => {
				expect(() => parseDurationToMs('')).toThrow('Invalid duration format');
			});

			it('should throw error for missing unit', () => {
				expect(() => parseDurationToMs('7')).toThrow('Invalid duration format');
			});

			it('should throw error for missing number', () => {
				expect(() => parseDurationToMs('d')).toThrow('Invalid duration format');
			});

			it('should throw error for invalid unit', () => {
				expect(() => parseDurationToMs('7w')).toThrow('Invalid duration format');
				expect(() => parseDurationToMs('7y')).toThrow('Invalid duration format');
				expect(() => parseDurationToMs('7x')).toThrow('Invalid duration format');
			});

			it('should throw error for multiple units', () => {
				expect(() => parseDurationToMs('7dd')).toThrow('Invalid duration format');
				expect(() => parseDurationToMs('7hm')).toThrow('Invalid duration format');
			});

			it('should throw error for space in string', () => {
				expect(() => parseDurationToMs('7 d')).toThrow('Invalid duration format');
				expect(() => parseDurationToMs(' 7d')).toThrow('Invalid duration format');
				expect(() => parseDurationToMs('7d ')).toThrow('Invalid duration format');
			});

			it('should throw error for non-numeric values', () => {
				expect(() => parseDurationToMs('abc')).toThrow('Invalid duration format');
				expect(() => parseDurationToMs('xyzd')).toThrow('Invalid duration format');
			});
		});

		describe('Negative numbers', () => {
			it('should throw error for negative seconds', () => {
				expect(() => parseDurationToMs('-1s')).toThrow('Invalid duration format');
			});

			it('should throw error for negative minutes', () => {
				expect(() => parseDurationToMs('-5m')).toThrow('Invalid duration format');
			});

			it('should throw error for negative hours', () => {
				expect(() => parseDurationToMs('-12h')).toThrow('Invalid duration format');
			});

			it('should throw error for negative days', () => {
				expect(() => parseDurationToMs('-7d')).toThrow('Invalid duration format');
			});
		});

		describe('Decimal numbers', () => {
			it('should throw error for decimal seconds', () => {
				expect(() => parseDurationToMs('1.5s')).toThrow('Invalid duration format');
			});

			it('should throw error for decimal minutes', () => {
				expect(() => parseDurationToMs('7.5m')).toThrow('Invalid duration format');
			});

			it('should throw error for decimal hours', () => {
				expect(() => parseDurationToMs('12.5h')).toThrow('Invalid duration format');
			});

			it('should throw error for decimal days', () => {
				expect(() => parseDurationToMs('3.14d')).toThrow('Invalid duration format');
			});
		});

		describe('Special characters', () => {
			it('should throw error for duration with symbols', () => {
				expect(() => parseDurationToMs('7!d')).toThrow('Invalid duration format');
				expect(() => parseDurationToMs('7@d')).toThrow('Invalid duration format');
				expect(() => parseDurationToMs('7#d')).toThrow('Invalid duration format');
			});

			it('should throw error for duration with plus sign', () => {
				expect(() => parseDurationToMs('+7d')).toThrow('Invalid duration format');
			});
		});
	});

	describe('Real-world use cases', () => {
		it('should handle typical access token expiry (15 minutes)', () => {
			const result = parseDurationToMs('15m');
			expect(result).toBe(15 * 60 * 1000);
			expect(result).toBe(900000);
		});

		it('should handle typical refresh token expiry (7 days)', () => {
			const result = parseDurationToMs('7d');
			expect(result).toBe(7 * 24 * 60 * 60 * 1000);
			expect(result).toBe(604800000);
		});

		it('should handle short session expiry (30 minutes)', () => {
			const result = parseDurationToMs('30m');
			expect(result).toBe(30 * 60 * 1000);
			expect(result).toBe(1800000);
		});

		it('should handle long session expiry (30 days)', () => {
			const result = parseDurationToMs('30d');
			expect(result).toBe(30 * 24 * 60 * 60 * 1000);
			expect(result).toBe(2592000000);
		});

		it('should handle very short expiry (1 minute)', () => {
			const result = parseDurationToMs('1m');
			expect(result).toBe(60 * 1000);
			expect(result).toBe(60000);
		});
	});

	describe('Type safety', () => {
		it('should work when result is used to create Date', () => {
			const expiryMs = parseDurationToMs('7d');
			const expiryDate = new Date(Date.now() + expiryMs);

			expect(expiryDate).toBeInstanceOf(Date);
			expect(expiryDate.toString()).not.toBe('Invalid Date');
		});

		it('should work in mathematical operations', () => {
			const milliseconds = parseDurationToMs('1h');

			expect(milliseconds / 1000).toBe(3600); // seconds
			expect(milliseconds / (60 * 1000)).toBe(60); // minutes
		});
	});

	describe('Error messages', () => {
		it('should provide helpful error message for invalid format', () => {
			expect(() => parseDurationToMs('invalid')).toThrow(
				'Invalid duration format: invalid. Expected format: number followed by d/h/m/s (e.g., "7d", "24h")',
			);
		});

		it('should include the invalid input in error message', () => {
			expect(() => parseDurationToMs('7w')).toThrow('Invalid duration format: 7w');
		});

		it('should suggest valid format in error message', () => {
			expect(() => parseDurationToMs('abc')).toThrow('Expected format: number followed by d/h/m/s');
		});
	});
});

describe('parseDurationToSeconds', () => {
	describe('Valid inputs', () => {
		it('should parse seconds correctly', () => {
			expect(parseDurationToSeconds('1s')).toBe(1);
			expect(parseDurationToSeconds('30s')).toBe(30);
			expect(parseDurationToSeconds('60s')).toBe(60);
		});

		it('should parse minutes correctly', () => {
			expect(parseDurationToSeconds('1m')).toBe(60);
			expect(parseDurationToSeconds('15m')).toBe(15 * 60);
			expect(parseDurationToSeconds('60m')).toBe(60 * 60);
		});

		it('should parse hours correctly', () => {
			expect(parseDurationToSeconds('1h')).toBe(60 * 60);
			expect(parseDurationToSeconds('12h')).toBe(12 * 60 * 60);
			expect(parseDurationToSeconds('24h')).toBe(24 * 60 * 60);
		});

		it('should parse days correctly', () => {
			expect(parseDurationToSeconds('1d')).toBe(24 * 60 * 60);
			expect(parseDurationToSeconds('7d')).toBe(7 * 24 * 60 * 60);
			expect(parseDurationToSeconds('365d')).toBe(365 * 24 * 60 * 60);
		});
	});

	describe('Edge cases', () => {
		it('should parse zero duration', () => {
			expect(parseDurationToSeconds('0s')).toBe(0);
			expect(parseDurationToSeconds('0m')).toBe(0);
			expect(parseDurationToSeconds('0h')).toBe(0);
			expect(parseDurationToSeconds('0d')).toBe(0);
		});
	});

	describe('Invalid inputs', () => {
		it('should throw error for empty string', () => {
			expect(() => parseDurationToSeconds('')).toThrow('Invalid duration format');
		});

		it('should throw error for missing unit', () => {
			expect(() => parseDurationToSeconds('7')).toThrow('Invalid duration format');
		});

		it('should throw error for invalid unit', () => {
			expect(() => parseDurationToSeconds('7w')).toThrow('Invalid duration format');
		});

		it('should throw error for negative numbers', () => {
			expect(() => parseDurationToSeconds('-1s')).toThrow('Invalid duration format');
		});

		it('should throw error for decimal numbers', () => {
			expect(() => parseDurationToSeconds('1.5s')).toThrow('Invalid duration format');
		});
	});

	describe('Consistency with parseDurationToMs', () => {
		it.each(['1s', '15m', '1h', '7d'])('should return exactly 1/1000th of parseDurationToMs for %s', (duration) => {
			expect(parseDurationToSeconds(duration)).toBe(parseDurationToMs(duration) / 1000);
		});
	});

	describe('Real-world use cases', () => {
		it('should handle typical CORS max-age (24 hours)', () => {
			expect(parseDurationToSeconds('24h')).toBe(86400);
		});

		it('should handle typical static cache max-age (365 days)', () => {
			expect(parseDurationToSeconds('365d')).toBe(31536000);
		});

		it('should handle typical cookie max-age (15 minutes)', () => {
			expect(parseDurationToSeconds('15m')).toBe(900);
		});
	});
});
