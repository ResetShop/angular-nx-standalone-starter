import type { CreateCustomerRequest, CustomerDto } from '@contracts/client/client.types'
import type { OfficeBranchDto } from '@contracts/office-branch/office-branch.types'
import { DEVICE_TYPES } from '@contracts/repair/device-type.constants'
import type {
	CreateRepairRequest,
	RepairCustomerDto,
	RepairDto,
	RepairMoneyTransactionDto,
	RepairStatusHistoryDto,
	RepairWriteDto,
	UpdateTrackingInfoRequest,
} from '@contracts/repair/repair.types'
import type { UserDto } from '@contracts/user/legacy-user.types'
import type { IUser } from '@domain/user/user.interface'
import { parseISO } from 'date-fns'
import type {
	Repair,
	RepairCustomer,
	RepairCustomerInput,
	RepairDeviceChanges,
	RepairIntake,
	RepairPayment,
	RepairStatusEntry,
	RepairTrackingChanges,
} from './repair.model'

/**
 * The API serialises decimal columns as strings; the domain works with numbers only.
 */
function toNumber(value: number | string | null | undefined): number {
	const parsed = typeof value === 'string' ? Number.parseFloat(value) : (value ?? 0)
	return Number.isFinite(parsed) ? parsed : 0
}

function toDate(value: string | null | undefined): Date | null {
	return value ? parseISO(value) : null
}

export function mapCustomerDto(dto: RepairCustomerDto): RepairCustomer {
	return {
		id: dto.id ?? null,
		dni: dto.dni,
		firstName: dto.firstName,
		lastName: dto.lastName,
		fullName: dto.fullName ?? `${dto.firstName} ${dto.lastName}`.trim(),
		email: dto.email,
		address: dto.address,
		telephone: dto.telephone,
		birthDate: toDate(dto.birthDate),
	}
}

function mapPaymentDto(dto: RepairMoneyTransactionDto): RepairPayment {
	return {
		id: dto.id,
		amount: toNumber(dto.amount),
		date: toDate(dto.date),
		paymentMethodId: dto.paymentMethod.id,
		paymentMethodDescription: dto.paymentMethod.description,
	}
}

export function mapRepairDto(dto: RepairDto): Repair {
	return {
		id: dto.id,
		customer: mapCustomerDto(dto.customer),
		device: {
			turnedOn: !!dto.device.turnedOn,
			manufacturer: dto.device.manufacturer ?? '',
			model: dto.device.model ?? '',
			deviceId: dto.device.deviceId ?? '',
			type: dto.device.type,
		},
		status: dto.status,
		issue: dto.issue ?? '',
		note: dto.note ?? '',
		paymentInAdvance: toNumber(dto.paymentInAdvance),
		price: toNumber(dto.price),
		cost: toNumber(dto.cost),
		warrantyTerm: dto.warrantyTerm ?? 0,
		checkIn: toDate(dto.checkIn),
		lastUpdate: toDate(dto.lastUpdate),
		checkOut: toDate(dto.checkOut),
		createdAt: toDate(dto.audit?.createdAt),
		createdByUserName: dto.user?.userName ?? null,
		payments: (dto.moneyTransactions ?? []).map(mapPaymentDto),
	}
}

export function mapRepairStatusHistoryDto(dto: RepairStatusHistoryDto): RepairStatusEntry {
	return {
		id: dto.id,
		status: dto.status,
		cost: toNumber(dto.cost),
		price: toNumber(dto.price),
		paymentInAdvance: toNumber(dto.paymentInAdvance),
		note: dto.note ?? '',
		userName: dto.user?.userName ?? null,
		changedAt: toDate(dto.createdAt ?? dto.updatedAt),
	}
}

export function applyDeviceChanges(repair: Repair, changes: RepairDeviceChanges): Repair {
	const type = DEVICE_TYPES.find((deviceType) => deviceType.id === changes.typeId) ?? repair.device.type
	return {
		...repair,
		issue: changes.issue,
		device: {
			turnedOn: changes.turnedOn,
			manufacturer: changes.manufacturer,
			model: changes.model,
			deviceId: changes.deviceId,
			type,
		},
	}
}

export function applyTrackingChanges(repair: Repair, changes: RepairTrackingChanges): Repair {
	return { ...repair, ...changes }
}

function toCustomerDto(customer: RepairCustomer | RepairCustomerInput): CustomerDto {
	return {
		...(customer.id === null ? {} : { id: customer.id }),
		dni: customer.dni,
		firstName: customer.firstName,
		lastName: customer.lastName,
		email: customer.email,
		address: customer.address,
		telephone: customer.telephone,
		birthDate: customer.birthDate ? customer.birthDate.toISOString() : null,
	}
}

export function toCreateCustomerRequest(customer: RepairCustomerInput): CreateCustomerRequest {
	return {
		dni: customer.dni,
		firstName: customer.firstName,
		lastName: customer.lastName,
		email: customer.email,
		address: customer.address,
		telephone: customer.telephone,
		birthDate: customer.birthDate ? customer.birthDate.toISOString() : null,
	}
}

function toPaymentDto(payment: RepairPayment): RepairMoneyTransactionDto {
	return {
		id: payment.id,
		amount: payment.amount,
		date: payment.date ? payment.date.toISOString() : null,
		paymentMethod: { id: payment.paymentMethodId, description: payment.paymentMethodDescription },
	}
}

export function toRepairWriteDto(repair: Repair, now: Date = new Date()): RepairWriteDto {
	const createdAt = (repair.createdAt ?? now).toISOString()
	return {
		...(repair.id === null ? {} : { id: repair.id }),
		customer: toCustomerDto(repair.customer),
		device: { ...repair.device, deviceId: repair.device.deviceId || null },
		status: repair.status,
		note: repair.note,
		issue: repair.issue,
		paymentInAdvance: repair.paymentInAdvance,
		price: repair.price,
		cost: repair.cost,
		warrantyTerm: repair.warrantyTerm,
		audit: { deleted: false, enabled: true, createdAt, updatedAt: now.toISOString() },
		checkIn: (repair.checkIn ?? now).toISOString(),
		lastUpdate: (repair.lastUpdate ?? now).toISOString(),
		checkOut: repair.checkOut ? repair.checkOut.toISOString() : null,
		moneyTransactions: repair.payments.map(toPaymentDto),
	}
}

/**
 * Builds the repair a new intake opens: it is not stored yet, so it has no id nor timestamps.
 */
export function createRepairFromIntake(intake: RepairIntake, customerId: number): Repair {
	const type = DEVICE_TYPES.find((deviceType) => deviceType.id === intake.device.typeId) ?? DEVICE_TYPES[0]
	return {
		id: null,
		customer: {
			...intake.customer,
			id: customerId,
			fullName: `${intake.customer.firstName} ${intake.customer.lastName}`.trim(),
		},
		device: {
			turnedOn: intake.device.turnedOn,
			manufacturer: intake.device.manufacturer,
			model: intake.device.model,
			deviceId: intake.device.deviceId,
			type,
		},
		status: intake.status,
		issue: intake.issue,
		note: intake.note,
		paymentInAdvance: intake.paymentInAdvance,
		price: intake.price,
		cost: intake.cost,
		warrantyTerm: intake.warrantyTerm,
		checkIn: null,
		lastUpdate: null,
		checkOut: null,
		createdAt: null,
		createdByUserName: null,
		payments: [],
	}
}

export function toUserDto(user: IUser): UserDto {
	return {
		id: user.id,
		userName: user.userName,
		firstName: user.firstName,
		lastName: user.lastName,
		avatar: user.avatar,
		email: user.email,
		roles: [...user.roles],
		hasFinishedRegistration: user.hasFinishedRegistration,
	}
}

export function toCreateRepairRequest(repair: Repair, user: IUser, now: Date = new Date()): CreateRepairRequest {
	return { repairToCreate: toRepairWriteDto(repair, now), user: toUserDto(user) }
}

export function toUpdateTrackingInfoRequest(
	repair: Repair,
	user: IUser,
	generateTransaction: boolean,
	officeBranch: OfficeBranchDto | null,
	now: Date = new Date(),
): UpdateTrackingInfoRequest {
	return {
		repairToUpdate: toRepairWriteDto(repair, now),
		user: toUserDto(user),
		generateTransaction,
		officeBranch,
	}
}
