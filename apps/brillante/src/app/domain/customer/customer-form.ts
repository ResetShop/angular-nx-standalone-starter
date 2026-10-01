import type { CustomerDetails, ICustomer } from './customer.interface'

/**
 * Editable customer details as the signal forms hold them: every control is text, including the
 * DNI and the `yyyy-MM-dd` value of `<input type="date">`.
 */
export interface CustomerFormModel {
	dni: string
	firstName: string
	lastName: string
	email: string
	birthDate: string
	address: string
	telephone: string
}

export const DIGITS_ONLY_PATTERN = /^\d+$/

export function createEmptyCustomerForm(): CustomerFormModel {
	return { dni: '', firstName: '', lastName: '', email: '', birthDate: '', address: '', telephone: '' }
}

function pad(value: number): string {
	return String(value).padStart(2, '0')
}

/**
 * Formats a date as the `yyyy-MM-dd` text of a date input, in the user's local calendar.
 */
export function formatDateInputValue(date: Date | null): string {
	if (!date) return ''
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * Parses the `yyyy-MM-dd` text of a date input into a local-midnight date; empty or malformed
 * text yields null.
 */
export function parseDateInputValue(value: string): Date | null {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
	if (!match) return null
	const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])]
	const date = new Date(year, month - 1, day)
	const isRealDate = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
	return isRealDate ? date : null
}

/** True when the date input value is a real calendar date that is not in the future. */
export function isPastOrTodayDateInput(value: string, now: Date = new Date()): boolean {
	const date = parseDateInputValue(value)
	return date !== null && date.getTime() <= now.getTime()
}

export function toCustomerFormModel(customer: ICustomer): CustomerFormModel {
	return {
		dni: String(customer.dni),
		firstName: customer.firstName,
		lastName: customer.lastName,
		email: customer.email,
		birthDate: formatDateInputValue(customer.birthDate),
		address: customer.address,
		telephone: customer.telephone,
	}
}

export function fromCustomerFormModel(model: CustomerFormModel): CustomerDetails {
	return {
		dni: Number(model.dni),
		firstName: model.firstName.trim(),
		lastName: model.lastName.trim(),
		email: model.email.trim(),
		birthDate: parseDateInputValue(model.birthDate),
		address: model.address.trim(),
		telephone: model.telephone.trim(),
	}
}

/**
 * Formats a date for display as `dd/MM/yyyy`, the day-first convention of the Argentine locale.
 */
export function formatDisplayDate(date: Date): string {
	return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}
