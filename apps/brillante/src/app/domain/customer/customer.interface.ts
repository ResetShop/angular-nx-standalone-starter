export interface ICustomer {
	/** Absent only for a customer that has not been persisted yet. */
	readonly id: number | undefined
	readonly dni: number
	readonly firstName: string
	readonly lastName: string
	readonly fullName: string
	readonly email: string
	/** Null when the customer never registered a birth date. */
	readonly birthDate: Date | null
	readonly address: string
	readonly telephone: string
}

/** The editable part of a customer: everything except the identity and derived values. */
export type CustomerDetails = Omit<ICustomer, 'id' | 'fullName'>
