import { apply, schema } from '@angular/forms/signals'
import type { Repair } from '@domain/repair/repair.model'
import {
	deviceFormModelFromRepair,
	emptyDeviceFormModel,
	repairDeviceSchema,
	type RepairDeviceFormModel,
} from '../repair-device-fields/repair-device.form'
import {
	repairTrackingSchema,
	trackingFormModelFromRepair,
	type RepairTrackingFormModel,
} from '../repair-tracking-fields/repair-tracking.form'

/**
 * Form model of the edit drawer: the device block and the tracking block of one stored repair.
 * They are kept apart because the API stores them through two different requests.
 */
export interface RepairEditFormModel {
	device: RepairDeviceFormModel
	tracking: RepairTrackingFormModel
}

export function editFormModelFromRepair(repair: Repair): RepairEditFormModel {
	return { device: deviceFormModelFromRepair(repair), tracking: trackingFormModelFromRepair(repair) }
}

export function emptyEditFormModel(): RepairEditFormModel {
	return {
		device: emptyDeviceFormModel(),
		tracking: {
			statusId: '',
			note: '',
			price: 0,
			cost: 0,
			paymentInAdvance: 0,
			warrantyTerm: 0,
			payments: [],
		},
	}
}

export const repairEditSchema = schema<RepairEditFormModel>((edit) => {
	apply(edit.device, repairDeviceSchema)
	apply(edit.tracking, repairTrackingSchema)
})
