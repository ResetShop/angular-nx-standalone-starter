import {
	apply,
	disabled,
	email as emailValidator,
	max,
	maxLength,
	min,
	minLength,
	pattern,
	required,
	schema,
} from '@angular/forms/signals'
import { RepairStatusId } from '@contracts/repair/repair-status.constants'
import type { RepairIntake, RepairStatus } from '@domain/repair/repair.model'
import { parseISO } from 'date-fns'
import {
	emptyDeviceFormModel,
	repairDeviceSchema,
	toDeviceChanges,
	type RepairDeviceFormModel,
} from '../repair-device-fields/repair-device.form'

export const DNI_PATTERN = /^\d{7,9}$/

export interface RepairCreateFormModel {
	dni: string
	firstName: string
	lastName: string
	email: string
	telephone: string
	address: string
	birthDate: string
	device: RepairDeviceFormModel
	statusId: string
	note: string
	paymentInAdvance: number
	price: number
	cost: number
	warrantyTerm: number
}

export function emptyCreateFormModel(): RepairCreateFormModel {
	return {
		dni: '',
		firstName: '',
		lastName: '',
		email: '',
		telephone: '',
		address: '',
		birthDate: '',
		device: emptyDeviceFormModel(),
		statusId: String(RepairStatusId.ENTERED),
		note: '',
		paymentInAdvance: 0,
		price: 0,
		cost: 0,
		warrantyTerm: 3,
	}
}

/**
 * The customer fields of a known customer come from its stored record, so they are disabled
 * (and left out of validation) while `customerExists` holds.
 */
export function repairCreateSchema(customerExists: () => boolean) {
	return schema<RepairCreateFormModel>((path) => {
		required(path.dni)
		pattern(path.dni, DNI_PATTERN)
		for (const field of [path.firstName, path.lastName]) {
			required(field)
			minLength(field, 2)
			maxLength(field, 100)
			disabled(field, { when: customerExists })
		}
		required(path.email)
		emailValidator(path.email)
		disabled(path.email, { when: customerExists })
		required(path.telephone)
		pattern(path.telephone, /^[0-9]+$/)
		disabled(path.telephone, { when: customerExists })
		required(path.address)
		disabled(path.address, { when: customerExists })
		disabled(path.birthDate, { when: customerExists })
		apply(path.device, repairDeviceSchema)
		required(path.statusId)
		for (const amount of [path.paymentInAdvance, path.price, path.cost]) {
			min(amount, 0)
		}
		min(path.warrantyTerm, 0)
		max(path.warrantyTerm, 24)
	})
}

export function toRepairIntake(
	value: RepairCreateFormModel,
	customerId: number | null,
	statuses: readonly RepairStatus[],
): RepairIntake {
	const { issue, ...device } = toDeviceChanges(value.device)
	const status = statuses.find((s) => String(s.id) === value.statusId)
	return {
		customer: {
			id: customerId,
			dni: Number(value.dni),
			firstName: value.firstName.trim(),
			lastName: value.lastName.trim(),
			email: value.email.trim(),
			address: value.address.trim(),
			telephone: value.telephone.trim(),
			birthDate: value.birthDate ? parseISO(value.birthDate) : null,
		},
		device,
		issue,
		note: value.note.trim(),
		status: status ?? { id: Number(value.statusId), description: '' },
		paymentInAdvance: value.paymentInAdvance,
		price: value.price,
		cost: value.cost,
		warrantyTerm: value.warrantyTerm,
	}
}
