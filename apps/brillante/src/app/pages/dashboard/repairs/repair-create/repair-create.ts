import { Component, computed, effect, inject, signal, untracked } from '@angular/core'
import {
	apply,
	disabled,
	email as emailValidator,
	form,
	max,
	maxLength,
	min,
	minLength,
	pattern,
	required,
	schema,
	FormField as SignalFormField,
} from '@angular/forms/signals'
import { Router, RouterLink } from '@angular/router'
import { RepairStatusId } from '@contracts/repair/repair-status.constants'
import type { RepairIntake } from '@domain/repair/repair.model'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { featherArrowLeft } from '@ng-icons/feather-icons'
import { AppTranslation } from '@providers/i18n/app-translation'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Alert, AlertDescription } from '@resetshop/ui/alert/alert'
import { Button } from '@resetshop/ui/button/button'
import { FormField } from '@resetshop/ui/form-field/form-field'
import { Spinner } from '@resetshop/ui/spinner/spinner'
import { RepairIntakeStore } from '@store/repair/repair-intake.store'
import { RepairStore } from '@store/repair/repair.store'
import { createMutationToast } from '@store/ui/mutation-toast'
import { parseISO } from 'date-fns'
import { RepairDeviceFields } from '../repair-device-fields/repair-device-fields'
import {
	emptyDeviceFormModel,
	repairDeviceSchema,
	toDeviceChanges,
	type RepairDeviceFormModel,
} from '../repair-device-fields/repair-device.form'

interface RepairCreateFormModel {
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

@Component({
	selector: 'app-repair-create',
	standalone: true,
	imports: [
		Alert,
		AlertDescription,
		Button,
		FormField,
		NgIcon,
		RepairDeviceFields,
		RouterLink,
		SignalFormField,
		Spinner,
		TranslatePipe,
	],
	viewProviders: [provideIcons({ featherArrowLeft })],
	template: `
		<a
			routerLink="/dashboard/repairs"
			class="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-2 text-sm font-medium"
		>
			<ng-icon name="featherArrowLeft" size="16" />
			{{ 'REPAIRS.CREATE.BACK' | translate }}
		</a>

		<h1 class="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
			{{ 'REPAIRS.CREATE.TITLE' | translate }}
		</h1>

		<form (submit)="onSubmit($event)" class="mt-6 flex flex-col gap-6" novalidate>
			@if (mutationError()) {
				<div appAlert variant="destructive">
					<p appAlertDescription>{{ mutationError() }}</p>
				</div>
			}

			<section class="border-border bg-card rounded-xl border p-4 sm:p-5" aria-labelledby="customer-section-title">
				<h2 id="customer-section-title" class="text-foreground text-lg font-semibold">
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

			<section class="border-border bg-card rounded-xl border p-4 sm:p-5" aria-labelledby="device-section-title">
				<h2 id="device-section-title" class="text-foreground mb-4 text-lg font-semibold">
					{{ 'REPAIRS.CREATE.DEVICE_SECTION' | translate }}
				</h2>
				<app-repair-device-fields [device]="repairForm.device" />
			</section>

			<section class="border-border bg-card rounded-xl border p-4 sm:p-5" aria-labelledby="tracking-section-title">
				<h2 id="tracking-section-title" class="text-foreground mb-4 text-lg font-semibold">
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

			<div class="flex justify-end">
				<button [disabled]="intakeStore.isCreating() || !repairForm().valid()" appButton type="submit">
					@if (intakeStore.isCreating()) {
						<app-spinner data-icon="start" />
					}
					{{
						intakeStore.isCreating() ? ('REPAIRS.CREATE.SUBMITTING' | translate) : ('REPAIRS.CREATE.SUBMIT' | translate)
					}}
				</button>
			</div>
		</form>
	`,
})
export default class RepairCreate {
	protected readonly repairStore = inject(RepairStore)
	protected readonly intakeStore = inject(RepairIntakeStore)

	private readonly router = inject(Router)
	private readonly translation = inject(AppTranslation)
	private readonly toast = createMutationToast(this.translation.instant('REPAIRS.CREATE.SUCCESS_TOAST'))

	private readonly model = signal<RepairCreateFormModel>(this.emptyModel())

	protected readonly repairForm = form(
		this.model,
		schema<RepairCreateFormModel>((path) => {
			const customerExists = () => this.intakeStore.customerExists()
			required(path.dni)
			pattern(path.dni, /^\d{7,9}$/)
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
		}),
	)

	private lookedUpDni = ''

	protected readonly mutationError = computed(() => this.intakeStore.mutationError().create)

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

	private readonly createResultEffect = effect(() => {
		const creating = this.intakeStore.isCreating()
		const error = this.mutationError()
		untracked(() => {
			if (this.toast.handleResult(creating, error) !== 'success') return
			const id = this.intakeStore.createdRepairId()
			if (id !== null) void this.router.navigate(['/dashboard/repairs', id])
		})
	})

	constructor() {
		this.intakeStore.reset()
	}

	protected onLookup(event: Event): void {
		event.preventDefault()
		const dni = this.model().dni.trim()
		if (!/^\d{7,9}$/.test(dni)) return
		this.lookedUpDni = dni
		this.intakeStore.lookupCustomer(Number(dni))
	}

	protected onSubmit(event: Event): void {
		event.preventDefault()
		if (!this.repairForm().valid()) return
		this.toast.markSubmitted()
		this.intakeStore.createRepair(this.toIntake())
	}

	private toIntake(): RepairIntake {
		const value = this.model()
		const { issue, ...device } = toDeviceChanges(value.device)
		const status = this.repairStore.statuses().find((s) => String(s.id) === value.statusId)
		return {
			customer: {
				id: this.intakeStore.customer()?.id ?? null,
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

	private emptyModel(): RepairCreateFormModel {
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
}
