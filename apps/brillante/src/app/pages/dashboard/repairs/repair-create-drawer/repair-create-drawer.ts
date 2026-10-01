import { Component, computed, effect, inject, signal, untracked, viewChild } from '@angular/core'
import { form, FormField as SignalFormField } from '@angular/forms/signals'
import { AppTranslation } from '@providers/i18n/app-translation'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Alert, AlertDescription } from '@resetshop/ui/alert/alert'
import { Button } from '@resetshop/ui/button/button'
import { ConfirmDialog } from '@resetshop/ui/confirm-dialog/confirm-dialog'
import { Drawer } from '@resetshop/ui/drawer/drawer'
import { DrawerFooter } from '@resetshop/ui/drawer/drawer-footer'
import { FormField } from '@resetshop/ui/form-field/form-field'
import { Spinner } from '@resetshop/ui/spinner/spinner'
import { parseDurationToMs } from '@resetshop/util'
import { createMutationToast } from '@store/ui/mutation-toast'
import { RepairDeviceFields } from '../repair-device-fields/repair-device-fields'
import { RepairIntakeStore } from '../repair-intake.store'
import { RepairStore } from '../repair.store'
import { DRAWER_CLOSE_AFTER_SUCCESS_DELAY } from '../repairs.constants'
import {
	DNI_PATTERN,
	emptyCreateFormModel,
	repairCreateSchema,
	toRepairIntake,
	type RepairCreateFormModel,
} from './repair-create.form'

/**
 * Opens a repair: looks the customer up by DNI (registering a new one with the repair when the DNI
 * is unknown), captures the device and the first tracking data, and creates the repair. The
 * success confirmation is shown once the drawer has finished closing; the intake store reloads the
 * repair list.
 */
@Component({
	selector: 'app-repair-create-drawer',
	standalone: true,
	imports: [
		Alert,
		AlertDescription,
		Button,
		ConfirmDialog,
		Drawer,
		DrawerFooter,
		FormField,
		RepairDeviceFields,
		SignalFormField,
		Spinner,
		TranslatePipe,
	],
	template: `
		<app-drawer
			(closed)="onDrawerClosed()"
			(afterClosed)="toast.flushPending()"
			[closeOnBackdrop]="false"
			[title]="'REPAIRS.CREATE.TITLE' | translate"
			class="w-full sm:w-lg"
			#drawerRef
		>
			<form (submit)="onSubmit($event)" id="create-repair-form" class="flex flex-col gap-6" novalidate>
				@if (mutationError()) {
					<div appAlert variant="destructive">
						<p appAlertDescription>{{ mutationError() }}</p>
					</div>
				}

				<section class="border-border bg-card rounded-xl border p-4" aria-labelledby="create-customer-title">
					<h2 id="create-customer-title" class="text-foreground text-lg font-semibold">
						{{ 'REPAIRS.CREATE.CUSTOMER_SECTION' | translate }}
					</h2>

					<div class="mt-4 flex items-end gap-3">
						<app-form-field [label]="'REPAIRS.FIELDS.DNI' | translate" class="flex-1">
							<input (keydown.enter)="onLookup($event)" [formField]="repairForm.dni" type="text" inputmode="numeric" />
						</app-form-field>
						<button
							(click)="onLookup($event)"
							[disabled]="intakeStore.isLookingUp()"
							appButton
							type="button"
							variant="outline"
						>
							{{ 'REPAIRS.CREATE.LOOKUP_BUTTON' | translate }}
						</button>
					</div>

					@if (intakeStore.readError().lookup) {
						<div appAlert variant="destructive" class="mt-3">
							<p appAlertDescription>{{ intakeStore.readError().lookup }}</p>
						</div>
					} @else if (intakeStore.lookupStatus() === 'found') {
						<div appAlert class="mt-3">
							<p appAlertDescription>{{ 'REPAIRS.CREATE.CUSTOMER_FOUND' | translate }}</p>
						</div>
					} @else if (intakeStore.lookupStatus() === 'not-found') {
						<div appAlert class="mt-3">
							<p appAlertDescription>{{ 'REPAIRS.CREATE.CUSTOMER_NEW' | translate }}</p>
						</div>
					}

					<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
						<app-form-field [label]="'REPAIRS.FIELDS.FIRST_NAME' | translate">
							<input [formField]="repairForm.firstName" type="text" autocomplete="off" />
						</app-form-field>
						<app-form-field [label]="'REPAIRS.FIELDS.LAST_NAME' | translate">
							<input [formField]="repairForm.lastName" type="text" autocomplete="off" />
						</app-form-field>
						<app-form-field [label]="'REPAIRS.FIELDS.EMAIL' | translate">
							<input [formField]="repairForm.email" type="email" autocomplete="off" />
						</app-form-field>
						<app-form-field [label]="'REPAIRS.FIELDS.TELEPHONE' | translate">
							<input [formField]="repairForm.telephone" type="tel" autocomplete="off" />
						</app-form-field>
						<app-form-field [label]="'REPAIRS.FIELDS.ADDRESS' | translate">
							<input [formField]="repairForm.address" type="text" autocomplete="off" />
						</app-form-field>
						<app-form-field [label]="'REPAIRS.FIELDS.BIRTH_DATE' | translate">
							<input [formField]="repairForm.birthDate" type="date" />
						</app-form-field>
					</div>
				</section>

				<section class="border-border bg-card rounded-xl border p-4" aria-labelledby="create-device-title">
					<h2 id="create-device-title" class="text-foreground mb-4 text-lg font-semibold">
						{{ 'REPAIRS.CREATE.DEVICE_SECTION' | translate }}
					</h2>
					<app-repair-device-fields [device]="repairForm.device" />
				</section>

				<section class="border-border bg-card rounded-xl border p-4" aria-labelledby="create-tracking-title">
					<h2 id="create-tracking-title" class="text-foreground mb-4 text-lg font-semibold">
						{{ 'REPAIRS.CREATE.TRACKING_SECTION' | translate }}
					</h2>
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<app-form-field [label]="'REPAIRS.FIELDS.STATUS' | translate">
							<select [formField]="repairForm.statusId">
								@for (status of repairStore.statuses(); track status.id) {
									<option [value]="status.id">{{ status.description }}</option>
								}
							</select>
						</app-form-field>
						<app-form-field [label]="'REPAIRS.FIELDS.WARRANTY_TERM' | translate">
							<input [formField]="repairForm.warrantyTerm" type="number" />
						</app-form-field>
						<app-form-field [label]="'REPAIRS.FIELDS.PAYMENT_IN_ADVANCE' | translate">
							<input [formField]="repairForm.paymentInAdvance" type="number" step="0.01" />
						</app-form-field>
						<app-form-field [label]="'REPAIRS.FIELDS.PRICE' | translate">
							<input [formField]="repairForm.price" type="number" step="0.01" />
						</app-form-field>
						<app-form-field [label]="'REPAIRS.FIELDS.COST' | translate">
							<input [formField]="repairForm.cost" type="number" step="0.01" />
						</app-form-field>
						<app-form-field [label]="'REPAIRS.FIELDS.NOTE' | translate" class="sm:col-span-2">
							<textarea [formField]="repairForm.note" rows="3"></textarea>
						</app-form-field>
					</div>
				</section>
			</form>

			<ng-template appDrawerFooter>
				<div class="flex justify-end gap-3">
					<button (click)="onCancel()" appButton variant="outline" type="button">
						{{ 'COMMON.CANCEL' | translate }}
					</button>
					<button [disabled]="showSubmitSpinner() || !isFormValid()" appButton type="submit" form="create-repair-form">
						@if (showSubmitSpinner()) {
							<app-spinner data-icon="start" />
						}
						{{
							showSubmitSpinner() ? ('REPAIRS.CREATE.SUBMITTING' | translate) : ('REPAIRS.CREATE.SUBMIT' | translate)
						}}
					</button>
				</div>
			</ng-template>
		</app-drawer>

		<app-confirm-dialog
			(confirmed)="drawer().close()"
			[title]="'COMMON.DISCARD_DIALOG.TITLE' | translate"
			[message]="'COMMON.DISCARD_DIALOG.MESSAGE' | translate"
			[confirmText]="'COMMON.DISCARD_DIALOG.CONFIRM' | translate"
			confirmVariant="destructive"
			#discardDialogRef
		/>
	`,
})
export class RepairCreateDrawer {
	protected readonly repairStore = inject(RepairStore)
	protected readonly intakeStore = inject(RepairIntakeStore)

	private readonly translation = inject(AppTranslation)
	protected readonly drawer = viewChild.required<Drawer>('drawerRef')
	private readonly discardDialog = viewChild.required<ConfirmDialog>('discardDialogRef')

	protected readonly toast = createMutationToast(this.translation.instant('REPAIRS.CREATE.SUCCESS_TOAST'), {
		deferred: true,
	})

	private readonly model = signal<RepairCreateFormModel>(emptyCreateFormModel())
	protected readonly repairForm = form(
		this.model,
		repairCreateSchema(() => this.intakeStore.customerExists()),
	)

	private lookedUpDni = ''

	protected readonly isFormValid = computed(() => this.repairForm().valid())
	protected readonly mutationError = computed(() => this.intakeStore.mutationError().create)
	private readonly closingAfterSuccess = signal(false)
	protected readonly showSubmitSpinner = computed(() => this.intakeStore.isCreating() || this.closingAfterSuccess())

	private readonly fillCustomerEffect = effect(() => {
		const customer = this.intakeStore.customer()
		if (!customer) return
		untracked(() =>
			this.model.update((current) => ({
				...current,
				dni: String(customer.dni),
				firstName: customer.firstName,
				lastName: customer.lastName,
				email: customer.email,
				telephone: customer.telephone,
				address: customer.address,
				birthDate: customer.birthDate ? customer.birthDate.toISOString().slice(0, 10) : '',
			})),
		)
	})

	// A DNI edited after a lookup no longer identifies the customer that lookup resolved.
	private readonly forgetLookupEffect = effect(() => {
		const dni = this.model().dni.trim()
		untracked(() => {
			if (this.intakeStore.lookupStatus() !== 'idle' && dni !== this.lookedUpDni) this.intakeStore.clearCustomer()
		})
	})

	private readonly closeOnSuccessEffect = effect(() => {
		const creating = this.intakeStore.isCreating()
		const error = this.mutationError()
		untracked(() => {
			if (this.toast.handleResult(creating, error) !== 'success') return
			this.closingAfterSuccess.set(true)
			setTimeout(() => {
				this.closingAfterSuccess.set(false)
				this.drawer().close()
			}, parseDurationToMs(DRAWER_CLOSE_AFTER_SUCCESS_DELAY))
		})
	})

	public open(): void {
		this.intakeStore.reset()
		this.drawer().show()
		this.drawer().setContentReady()
	}

	protected onCancel(): void {
		if (this.repairForm().dirty()) {
			this.discardDialog().show()
		} else {
			this.drawer().close()
		}
	}

	protected onDrawerClosed(): void {
		this.lookedUpDni = ''
		this.model.set(emptyCreateFormModel())
		this.repairForm().reset()
		this.intakeStore.reset()
	}

	protected onLookup(event: Event): void {
		event.preventDefault()
		// People type national ids with dots or spaces ("30.111.222"); the API only knows the digits.
		const dni = this.model().dni.replace(/\D/g, '')
		if (dni !== this.model().dni) this.model.update((current) => ({ ...current, dni }))
		if (!DNI_PATTERN.test(dni)) {
			this.repairForm.dni().markAsTouched()
			return
		}
		this.lookedUpDni = dni
		this.intakeStore.lookupCustomer(Number(dni))
	}

	protected onSubmit(event: Event): void {
		event.preventDefault()
		if (!this.isFormValid()) return
		this.toast.markSubmitted()
		this.intakeStore.createRepair(
			toRepairIntake(this.model(), this.intakeStore.customer()?.id ?? null, this.repairStore.statuses()),
		)
	}
}
