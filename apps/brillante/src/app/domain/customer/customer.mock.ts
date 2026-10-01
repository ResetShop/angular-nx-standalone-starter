import type { CustomerDto } from '@contracts/client/client.types'
import type { ICustomer } from './customer.interface'
import { mapCustomerDtoToCustomer } from './customer.mapper'

/**
 * Builds a customer wire DTO for tests. Override specific fields as needed.
 */
export function createMockCustomerDto(overrides: Partial<CustomerDto> = {}): CustomerDto {
	return {
		id: 1,
		dni: 30123456,
		firstName: 'Ana',
		lastName: 'Perez',
		email: 'ana@brillante.test',
		birthDate: '1990-05-20T03:00:00.000Z',
		address: 'Calle 123',
		telephone: '3511234567',
		...overrides,
	}
}

export function createMockCustomer(overrides: Partial<CustomerDto> = {}): ICustomer {
	return mapCustomerDtoToCustomer(createMockCustomerDto(overrides))
}
