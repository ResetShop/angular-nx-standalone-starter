import type { CreateCustomerRequest, CustomerDto, UpdateCustomerRequest } from '@contracts/client/client.types'
import type { CustomerDetails } from './customer.interface'
import { Customer } from './customer.model'

/**
 * Parses the API birth date. The API answers with ISO timestamps, a missing or unparsable value
 * means the customer has no usable birth date.
 */
export function parseBirthDate(value: string | null | undefined): Date | null {
	if (!value) return null
	const parsed = new Date(value)
	return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function mapCustomerDtoToCustomer(dto: CustomerDto): Customer {
	return new Customer({
		id: dto.id,
		// The API may serialise the numeric DNI column as a string.
		dni: Number(dto.dni),
		firstName: dto.firstName ?? '',
		lastName: dto.lastName ?? '',
		email: dto.email ?? '',
		birthDate: parseBirthDate(dto.birthDate),
		address: dto.address ?? '',
		telephone: dto.telephone ?? '',
	})
}

function serialiseBirthDate(birthDate: Date | null): string | null {
	return birthDate ? birthDate.toISOString() : null
}

export function mapCustomerToDto(customer: CustomerDetails & { id?: number }): CustomerDto {
	return {
		id: customer.id,
		dni: customer.dni,
		firstName: customer.firstName,
		lastName: customer.lastName,
		email: customer.email,
		birthDate: serialiseBirthDate(customer.birthDate),
		address: customer.address,
		telephone: customer.telephone,
	}
}

export function mapCustomerToCreateRequest(customer: CustomerDetails): CreateCustomerRequest {
	return {
		dni: customer.dni,
		firstName: customer.firstName,
		lastName: customer.lastName,
		email: customer.email,
		birthDate: serialiseBirthDate(customer.birthDate),
		address: customer.address,
		telephone: customer.telephone,
	}
}

export function mapCustomerToUpdateRequest(customer: CustomerDetails & { id: number }): UpdateCustomerRequest {
	return { ...mapCustomerToDto(customer), id: customer.id }
}
