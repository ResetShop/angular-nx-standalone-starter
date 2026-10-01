export interface CustomerDto {
	id?: number
	dni: number
	firstName: string
	lastName: string
	email: string
	birthDate: string | null
	address: string
	telephone: string
}

export type CreateCustomerRequest = Omit<CustomerDto, 'id'>

export type UpdateCustomerRequest = CustomerDto & { id: number }

/**
 * `POST /client/create` answers with a `[customer, created]` tuple: `created` is false when a
 * customer with the same DNI already existed and was returned instead.
 */
export type CreateCustomerResponse = [CustomerDto, boolean]
