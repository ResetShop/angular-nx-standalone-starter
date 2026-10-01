import { format, isSameDay, isValid, parse, startOfDay, subDays } from 'date-fns'

/** Value for an `<input type="date">`. */
export function toDateInputValue(date: Date): string {
	return format(date, 'yyyy-MM-dd')
}

/** Parses the value of an `<input type="date">` to the start of that local day; `null` when empty or invalid. */
export function parseDateInputValue(value: string): Date | null {
	const parsed = parse(value, 'yyyy-MM-dd', new Date())
	return isValid(parsed) ? parsed : null
}

/** Value for an `<input type="datetime-local">`. */
export function toDateTimeInputValue(date: Date): string {
	return format(date, "yyyy-MM-dd'T'HH:mm")
}

export function parseDateTimeInputValue(value: string): Date | null {
	const parsed = parse(value, "yyyy-MM-dd'T'HH:mm", new Date())
	return isValid(parsed) ? parsed : null
}

export function isToday(date: Date, now: Date = new Date()): boolean {
	return isSameDay(date, now)
}

/** Whether `day` lies inside the inclusive day range. */
export function rangeIncludesDay(from: Date, to: Date, day: Date = new Date()): boolean {
	const dayStart = startOfDay(day).getTime()
	return startOfDay(from).getTime() <= dayStart && dayStart <= startOfDay(to).getTime()
}

/** Oldest day a user without the history privilege may browse. */
export function oldestBrowsableDay(now: Date = new Date()): Date {
	const browsableDays = 14
	return startOfDay(subDays(now, browsableDays))
}
