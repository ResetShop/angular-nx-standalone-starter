import { maxLength, required, schema } from '@angular/forms/signals'
import type { Repair, RepairDeviceChanges } from '@domain/repair/repair.model'

/**
 * Form model shared by every form that captures the device of a repair. The device type is held
 * as a string because a native `<select>` binds strings.
 */
export interface RepairDeviceFormModel {
	turnedOn: boolean
	typeId: string
	manufacturer: string
	model: string
	deviceId: string
	issue: string
}

export function emptyDeviceFormModel(): RepairDeviceFormModel {
	return { turnedOn: false, typeId: '0', manufacturer: '', model: '', deviceId: '', issue: '' }
}

export function deviceFormModelFromRepair(repair: Repair): RepairDeviceFormModel {
	return {
		turnedOn: repair.device.turnedOn,
		typeId: String(repair.device.type.id),
		manufacturer: repair.device.manufacturer,
		model: repair.device.model,
		deviceId: repair.device.deviceId,
		issue: repair.issue,
	}
}

export function toDeviceChanges(model: RepairDeviceFormModel): RepairDeviceChanges {
	return {
		turnedOn: model.turnedOn,
		typeId: Number(model.typeId),
		manufacturer: model.manufacturer.trim(),
		model: model.model.trim(),
		deviceId: model.deviceId.trim(),
		issue: model.issue.trim(),
	}
}

export const repairDeviceSchema = schema<RepairDeviceFormModel>((device) => {
	required(device.manufacturer)
	maxLength(device.manufacturer, 100)
	required(device.model)
	maxLength(device.model, 100)
	maxLength(device.deviceId, 100)
	required(device.issue)
})
