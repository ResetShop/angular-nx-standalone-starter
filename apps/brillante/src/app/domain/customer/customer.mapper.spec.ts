import type { CustomerDto } from '@contracts/client/client.types'
import {
	mapCustomerDtoToCustomer,
	mapCustomerToCreateRequest,
	mapCustomerToDto,
	mapCustomerToUpdateRequest,
	parseBirthDate,
} from './customer.mapper'

describe('customer mapper', () => {
	const dto: CustomerDto = {
		id: 7,
		dni: 30123456,
		firstName: 'Ana',
		lastName: 'Perez',
		email: 'ana@brillante.test',
		birthDate: '1990-05-20T03:00:00.000Z',
		address: 'Calle 123',
		telephone: '3511234567',
	}

	describe('parseBirthDate', () => {
		it('parses an ISO timestamp into a Date', () => {
			expect(parseBirthDate('1990-05-20T03:00:00.000Z')?.toISOString()).toBe('1990-05-20T03:00:00.000Z')
		})

		it.each([null, undefined, '', 'not-a-date'])('returns null for %s', (value) => {
			expect(parseBirthDate(value)).toBeNull()
		})
	})

	describe('mapCustomerDtoToCustomer', () => {
		it('maps every field and converts the birth date to a Date', () => {
			const customer = mapCustomerDtoToCustomer(dto)

			expect(customer.id).toBe(7)
			expect(customer.dni).toBe(30123456)
			expect(customer.fullName).toBe('Ana Perez')
			expect(customer.birthDate).toBeInstanceOf(Date)
			expect(customer.telephone).toBe('3511234567')
		})

		it('coerces a string DNI to a number', () => {
			const customer = mapCustomerDtoToCustomer({ ...dto, dni: '30123456' as unknown as number })

			expect(customer.dni).toBe(30123456)
		})

		it('keeps a null birth date as null and blanks missing text fields', () => {
			const customer = mapCustomerDtoToCustomer({
				...dto,
				birthDate: null,
				address: null as unknown as string,
			})

			expect(customer.birthDate).toBeNull()
			expect(customer.address).toBe('')
		})
	})

	describe('request mappers', () => {
		it('serialises the birth date back to an ISO string', () => {
			const customer = mapCustomerDtoToCustomer(dto)

			expect(mapCustomerToDto(customer)).toEqual(dto)
		})

		it('serialises a missing birth date as null', () => {
			const customer = mapCustomerDtoToCustomer({ ...dto, birthDate: null })

			expect(mapCustomerToDto(customer).birthDate).toBeNull()
		})

		it('builds a create request without an id', () => {
			const request = mapCustomerToCreateRequest(mapCustomerDtoToCustomer(dto))

			expect('id' in request).toBe(false)
			expect(request.dni).toBe(30123456)
			expect(request.birthDate).toBe('1990-05-20T03:00:00.000Z')
		})

		it('builds an update request carrying the id', () => {
			const request = mapCustomerToUpdateRequest({ ...mapCustomerDtoToCustomer(dto), id: 7 })

			expect(request).toEqual(dto)
		})
	})
})
