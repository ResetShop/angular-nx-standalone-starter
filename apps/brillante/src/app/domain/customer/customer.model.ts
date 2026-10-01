import type { ICustomer } from './customer.interface'

export interface CustomerProps {
	id?: number
	dni: number
	firstName: string
	lastName: string
	email: string
	birthDate: Date | null
	address: string
	telephone: string
}

export class Customer implements ICustomer {
	public readonly id: number | undefined
	public readonly dni: number
	public readonly firstName: string
	public readonly lastName: string
	public readonly email: string
	public readonly birthDate: Date | null
	public readonly address: string
	public readonly telephone: string

	constructor(props: CustomerProps) {
		this.id = props.id
		this.dni = props.dni
		this.firstName = props.firstName
		this.lastName = props.lastName
		this.email = props.email
		this.birthDate = props.birthDate
		this.address = props.address
		this.telephone = props.telephone
	}

	public get fullName(): string {
		return `${this.firstName} ${this.lastName}`.trim()
	}
}
