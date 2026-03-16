/**
 * Parse a duration string to milliseconds
 * Supports formats: "500ms", "7d", "24h", "60m", "30s"
 * @param duration Duration string (e.g., "500ms", "7d", "24h", "60m", "30s")
 * @returns Duration in milliseconds
 * @throws Error if a duration format is invalid
 */
export function parseDurationToMs(duration: string): number {
	const { value, unit } = parse(duration);

	const multipliers = {
		ms: 1, // milliseconds
		s: 1000, // seconds to milliseconds
		m: 60 * 1000, // minutes to milliseconds
		h: 60 * 60 * 1000, // hours to milliseconds
		d: 24 * 60 * 60 * 1000, // days to milliseconds
	};

	return value * multipliers[unit];
}

/**
 * Parse a duration string to seconds
 * Supports formats: "500ms", "7d", "24h", "60m", "30s"
 * @param duration Duration string (e.g., "500ms", "7d", "24h", "60m", "30s")
 * @returns Duration in seconds
 * @throws Error if a duration format is invalid
 */
export function parseDurationToSeconds(duration: string): number {
	const { value, unit } = parse(duration);

	const multipliers = {
		ms: 0.001, // milliseconds to seconds
		s: 1, // seconds to seconds
		m: 60, // minutes to seconds
		h: 60 * 60, // hours to seconds
		d: 24 * 60 * 60, // days to seconds
	};

	return value * multipliers[unit];
}

/**
 * Internal helper to parse and validate a duration string into a value and unit
 * @param duration
 */
function parse(duration: string): { value: number; unit: 'ms' | 's' | 'm' | 'h' | 'd' } {
	const match = duration.match(/^(\d+)(ms|[dhms])$/);

	if (!match) {
		throw new Error(
			`Invalid duration format: ${duration}. Expected format: number followed by ms/d/h/m/s (e.g., "500ms", "7d", "24h")`,
		);
	}

	const value = parseInt(match[1], 10);
	const unit = match[2] as 'ms' | 's' | 'm' | 'h' | 'd';
	return { value, unit };
}
