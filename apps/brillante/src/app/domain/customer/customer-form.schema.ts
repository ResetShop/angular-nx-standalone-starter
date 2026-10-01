import {
	email as emailValidator,
	maxLength,
	minLength,
	pattern,
	required,
	schema,
	validate,
} from '@angular/forms/signals'
import { type CustomerFormModel, DIGITS_ONLY_PATTERN, isPastOrTodayDateInput } from './customer-form'

export interface CustomerFormSchemaOptions {
	/** The customer must have a birth date (profile completion, new customers). */
	requireBirthDate: boolean
	/** Translated message shown when the birth date is in the future. */
	futureBirthDateMessage: string
}

/**
 * Validation rules shared by every form that edits customer details: the clients drawer and the
 * profile page. The DNI must be 7 to 9 digits, the telephone digits only.
 */
export function customerFormSchema(options: CustomerFormSchemaOptions) {
	return schema<CustomerFormModel>((customer) => {
		required(customer.dni)
		pattern(customer.dni, DIGITS_ONLY_PATTERN)
		minLength(customer.dni, 7)
		maxLength(customer.dni, 9)

		required(customer.firstName)
		minLength(customer.firstName, 2)
		maxLength(customer.firstName, 100)
		required(customer.lastName)
		minLength(customer.lastName, 2)
		maxLength(customer.lastName, 100)

		required(customer.email)
		emailValidator(customer.email)

		required(customer.address)
		required(customer.telephone)
		pattern(customer.telephone, DIGITS_ONLY_PATTERN)

		if (options.requireBirthDate) {
			required(customer.birthDate)
		}
		validate(customer.birthDate, ({ value }) =>
			!value() || isPastOrTodayDateInput(value())
				? null
				: { kind: 'futureBirthDate', message: options.futureBirthDateMessage },
		)
	})
}
