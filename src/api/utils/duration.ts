/**
 * Parse a duration string to milliseconds
 * Supports formats: "7d", "24h", "60m", "30s"
 * @param duration Duration string (e.g., "7d", "24h", "60m", "30s")
 * @returns Duration in milliseconds
 * @throws Error if duration format is invalid
 */
export function parseDurationToMs(duration: string): number {
	const match = duration.match(/^(\d+)([dhms])$/);

	if (!match) {
		throw new Error(
			`Invalid duration format: ${duration}. Expected format: number followed by d/h/m/s (e.g., "7d", "24h")`,
		);
	}

	const value = parseInt(match[1], 10);
	const unit = match[2];

	const multipliers = {
		s: 1000, // seconds to milliseconds
		m: 60 * 1000, // minutes to milliseconds
		h: 60 * 60 * 1000, // hours to milliseconds
		d: 24 * 60 * 60 * 1000, // days to milliseconds
	};

	return value * multipliers[unit];
}
