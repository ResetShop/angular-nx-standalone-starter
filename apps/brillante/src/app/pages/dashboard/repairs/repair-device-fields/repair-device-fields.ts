import { Component, input } from '@angular/core'
import { type FieldTree, FormField as SignalFormField } from '@angular/forms/signals'
import { DEVICE_TYPES } from '@contracts/repair/device-type.constants'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { FormField } from '@resetshop/ui/form-field/form-field'
import type { RepairDeviceFormModel } from './repair-device.form'

/**
 * Inputs for the device of a repair (type, brand, model, identifier, power state and the issue
 * reported by the customer). The parent owns the form; this component only renders its fields.
 */
@Component({
	selector: 'app-repair-device-fields',
	standalone: true,
	imports: [FormField, SignalFormField, TranslatePipe],
	template: `
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<app-form-field [label]="'REPAIRS.FIELDS.DEVICE_TYPE' | translate">
				<select [formField]="device().typeId">
					@for (type of deviceTypes; track type.id) {
						<option [value]="type.id">{{ type.description }}</option>
					}
				</select>
			</app-form-field>

			<app-form-field [label]="'REPAIRS.FIELDS.MANUFACTURER' | translate">
				<input [formField]="device().manufacturer" type="text" />
			</app-form-field>

			<app-form-field [label]="'REPAIRS.FIELDS.MODEL' | translate">
				<input [formField]="device().model" type="text" />
			</app-form-field>

			<app-form-field [label]="'REPAIRS.FIELDS.DEVICE_ID' | translate">
				<input [formField]="device().deviceId" type="text" />
			</app-form-field>

			<app-form-field [label]="'REPAIRS.FIELDS.TURNED_ON' | translate" class="sm:col-span-2">
				<input [formField]="device().turnedOn" type="checkbox" />
			</app-form-field>

			<app-form-field [label]="'REPAIRS.FIELDS.ISSUE' | translate" class="sm:col-span-2">
				<textarea [formField]="device().issue" rows="3"></textarea>
			</app-form-field>
		</div>
	`,
})
export class RepairDeviceFields {
	public readonly device = input.required<FieldTree<RepairDeviceFormModel>>()

	protected readonly deviceTypes = DEVICE_TYPES
}
