function pad(value: number): string {
	return String(value).padStart(2, '0')
}

/**
 * Formats a date as the `yyyy-MM-dd` calendar day in the local time zone.
 */
export function formatReportDay(date: Date): string {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * Formats a date as `yyyy-MM-dd HH:mm` in the local time zone.
 */
export function formatReportDateTime(date: Date): string {
	return `${formatReportDay(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
