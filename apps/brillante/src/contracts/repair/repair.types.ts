import type { CustomerDto } from '../client/client.types'
import type { UserDto } from '../user/user.types'

export interface RepairStatusDto {
	id: number
	description: string
}

export interface DeviceTypeDto {
	id: number
	description: string
}

export interface RepairDeviceDto {
	turnedOn: boolean
	manufacturer: string
	model: string
	/** IMEI, UUID, serial number... */
	deviceId: string | null
	type: DeviceTypeDto
}

/**
 * The API decorates the customer of a repair with a computed `fullName`.
 */
export type RepairCustomerDto = CustomerDto & { fullName?: string }

export interface RepairPaymentMethodRefDto {
	id: number
	description: string
}

/**
 * Cash transaction attached to a repair. Decimal columns arrive as numeric strings.
 */
export interface RepairMoneyTransactionDto {
	id: number | null
	amount: number | string
	date: string | null
	paymentMethod: RepairPaymentMethodRefDto
}

export interface RepairAuditDto {
	deleted: boolean
	enabled: boolean
	createdAt: string | null
	updatedAt: string | null
}

/**
 * Wire shape of a repair read from the API. Dates are ISO strings and the decimal columns
 * (`paymentInAdvance`, `price`, `cost`) may arrive as numeric strings.
 */
export interface RepairDto {
	id: number
	customer: RepairCustomerDto
	device: RepairDeviceDto
	note: string | null
	issue: string | null
	status: RepairStatusDto
	audit: RepairAuditDto | null
	user?: UserDto | null
	checkIn: string | null
	lastUpdate: string | null
	checkOut: string | null
	paymentInAdvance: number | string | null
	price: number | string | null
	cost: number | string | null
	warrantyTerm: number | null
	moneyTransactions?: RepairMoneyTransactionDto[] | null
}

/**
 * One entry of `GET /repair/history/:id`, recorded every time the tracking of a repair changes.
 */
export interface RepairStatusHistoryDto {
	id: number
	cost: number | string | null
	price: number | string | null
	paymentInAdvance: number | string | null
	note: string | null
	status: RepairStatusDto
	user: UserDto | null
	createdAt: string | null
	updatedAt: string | null
}

/**
 * Repair body sent to create and update endpoints. Timestamps are ISO strings.
 */
export interface RepairWriteDto {
	id?: number
	customer: CustomerDto
	device: RepairDeviceDto
	status: RepairStatusDto
	note: string
	issue: string
	paymentInAdvance: number
	price: number
	cost: number
	warrantyTerm: number
	audit: RepairAuditDto
	checkIn: string
	lastUpdate: string
	checkOut: string | null
	moneyTransactions: RepairMoneyTransactionDto[]
}

export interface CreateRepairRequest {
	repairToCreate: RepairWriteDto
	user: UserDto
}

/**
 * `POST /repair/create` answers with the stored repair; only its id is relied upon.
 */
export interface CreateRepairResponse {
	id?: number
}

export interface UpdateTrackingInfoRequest {
	repairToUpdate: RepairWriteDto
	user: UserDto
	generateTransaction: boolean
	officeBranch: { id: number; name: string; address: string } | null
}

export interface DeleteRepairResponse {
	response: string
}

export interface RepairsByDateParams {
	dateFrom: Date
	dateTo: Date
	showFinished: boolean
}
