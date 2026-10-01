import { Customer } from './customer.model'

describe('Customer', () => {
	const build = (overrides: Partial<ConstructorParameters<typeof Customer>[0]> = {}) =>
		new Customer({
			dni: 1234567,
			firstName: 'Ana',
			lastName: 'Perez',
			email: 'ana@brillante.test',
			birthDate: null,
			address: 'Calle 1',
			telephone: '351',
			...overrides,
		})

	it('builds the full name from first and last name', () => {
		expect(build().fullName).toBe('Ana Perez')
	})

	it('trims the full name when a part is missing', () => {
		expect(build({ lastName: '' }).fullName).toBe('Ana')
	})

	it('leaves the id undefined for a customer that was not persisted', () => {
		expect(build().id).toBeUndefined()
	})
})
