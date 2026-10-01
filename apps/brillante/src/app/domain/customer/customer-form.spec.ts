import {
	createEmptyCustomerForm,
	formatDateInputValue,
	formatDisplayDate,
	fromCustomerFormModel,
	isPastOrTodayDateInput,
	parseDateInputValue,
	toCustomerFormModel,
} from './customer-form'
import { Customer } from './customer.model'

describe('customer form helpers', () => {
	it('creates an empty model with every field blank', () => {
		expect(Object.values(createEmptyCustomerForm()).every((value) => value === '')).toBe(true)
	})

	describe('date input values', () => {
		it('round-trips a local calendar date', () => {
			const date = parseDateInputValue('1990-05-20')

			expect(date?.getFullYear()).toBe(1990)
			expect(date?.getMonth()).toBe(4)
			expect(date?.getDate()).toBe(20)
			expect(formatDateInputValue(date)).toBe('1990-05-20')
		})

		it.each(['', '20/05/1990', '1990-13-01', '1990-02-31'])('rejects %j', (value) => {
			expect(parseDateInputValue(value)).toBeNull()
		})

		it('formats a missing date as empty text', () => {
			expect(formatDateInputValue(null)).toBe('')
		})

		it('accepts today and past dates but rejects future ones', () => {
			const now = new Date(2025, 5, 15, 12)

			expect(isPastOrTodayDateInput('2025-06-15', now)).toBe(true)
			expect(isPastOrTodayDateInput('2000-01-01', now)).toBe(true)
			expect(isPastOrTodayDateInput('2025-06-16', now)).toBe(false)
			expect(isPastOrTodayDateInput('', now)).toBe(false)
		})
	})

	describe('model conversion', () => {
		const customer = new Customer({
			id: 3,
			dni: 30123456,
			firstName: 'Ana',
			lastName: 'Perez',
			email: 'ana@brillante.test',
			birthDate: new Date(1990, 4, 20),
			address: 'Calle 123',
			telephone: '3511234567',
		})

		it('converts a customer into text controls', () => {
			expect(toCustomerFormModel(customer)).toEqual({
				dni: '30123456',
				firstName: 'Ana',
				lastName: 'Perez',
				email: 'ana@brillante.test',
				birthDate: '1990-05-20',
				address: 'Calle 123',
				telephone: '3511234567',
			})
		})

		it('converts text controls into typed customer details, trimming whitespace', () => {
			const details = fromCustomerFormModel({
				...toCustomerFormModel(customer),
				firstName: '  Ana ',
			})

			expect(details.dni).toBe(30123456)
			expect(details.firstName).toBe('Ana')
			expect(details.birthDate?.getDate()).toBe(20)
		})

		it('yields a null birth date for empty text', () => {
			expect(fromCustomerFormModel({ ...toCustomerFormModel(customer), birthDate: '' }).birthDate).toBeNull()
		})
	})
})

describe('formatDisplayDate', () => {
	it('formats a date day-first with zero padding', () => {
		expect(formatDisplayDate(new Date(1990, 4, 2))).toBe('02/05/1990')
	})
})
