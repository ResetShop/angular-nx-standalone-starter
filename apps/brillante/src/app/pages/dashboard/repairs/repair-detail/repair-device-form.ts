import { Component, computed, input, linkedSignal, output } from '@angular/core'
import { form } from '@angular/forms/signals'
import type { Repair, RepairDeviceChanges } from '@domain/repair/repair.model'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Button } from '@resetshop/ui/button/button'
import { Spinner } from '@resetshop/ui/spinner/spinner'
import { RepairDeviceFields } from '../repair-device-fields/repair-device-fields'
import {
	deviceFormModelFromRepair,
	repairDeviceSchema,
	toDeviceChanges,
	type RepairDeviceFormModel,
} from '../repair-device-fields/repair-device.form'

/**
 * Edits the device data and the reported issue of a stored repair. The form follows the repair
 * it is given, so it shows the stored values again once a save has been reloaded.
 */
@Component({
	selector: 'app-repair-device-form',
	standalone: true,
	imports: [Button, RepairDeviceFields, Spinner, TranslatePipe],
	template: `
		<section class="border-border bg-card rounded-xl border p-4 sm:p-5" aria-labelledby="device-form-title">
			<h2 id="device-form-title" class="text-foreground mb-4 text-lg font-semibold">
				{{ 'REPAIRS.DEVICE.TITLE' | translate }}
			</h2>

			<form (submit)="onSubmit($event)" class="flex flex-col gap-4" novalidate>
				<app-repair-device-fields [device]="deviceForm" />

				<div class="flex justify-end">
					<button [disabled]="!canSave()" appButton type="submit">
						@if (saving()) {
							<app-spinner data-icon="start" />
						}
						{{ saving() ? ('COMMON.SAVING' | translate) : ('REPAIRS.DEVICE.SAVE' | translate) }}
					</button>
				</div>
			</form>
		</section>
	`,
})
export class RepairDeviceForm {
	public readonly repair = input.required<Repair>()
	public readonly saving = input(false)
	public readonly save = output<RepairDeviceChanges>()

	private readonly model = linkedSignal<RepairDeviceFormModel>(() => deviceFormModelFromRepair(this.repair()))

	protected readonly deviceForm = form(this.model, repairDeviceSchema)

	private readonly hasChanges = computed(
		() => JSON.stringify(this.model()) !== JSON.stringify(deviceFormModelFromRepair(this.repair())),
	)

	protected readonly canSave = computed(() => this.hasChanges() && this.deviceForm().valid() && !this.saving())

	protected onSubmit(event: Event): void {
		event.preventDefault()
		if (this.canSave()) this.save.emit(toDeviceChanges(this.model()))
	}
}
