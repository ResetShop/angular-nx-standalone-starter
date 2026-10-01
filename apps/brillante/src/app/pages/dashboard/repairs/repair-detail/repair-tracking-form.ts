import { CurrencyPipe } from '@angular/common'
import { Component, computed, input, linkedSignal, output } from '@angular/core'
import { form, FormField as SignalFormField } from '@angular/forms/signals'
import { PaymentMethodId, type PaymentMethodDto } from '@contracts/cash/payment-method.types'
import { shouldGenerateTransaction } from '@domain/repair/repair.functions'
import type { Repair, RepairStatus, RepairTrackingChanges } from '@domain/repair/repair.model'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Button } from '@resetshop/ui/button/button'
import { FormField } from '@resetshop/ui/form-field/form-field'
import { Spinner } from '@resetshop/ui/spinner/spinner'
import {
	repairTrackingSchema,
	toTrackingChanges,
	trackingFormModelFromRepair,
	type RepairTrackingFormModel,
} from './repair-tracking.form'

export interface RepairTrackingSubmission {
	changes: RepairTrackingChanges
	generateTransaction: boolean
}

/**
 * Edits the tracking data of a stored repair: status, price, cost, advance payment, warranty and
 * note. A repair closed with a price generates its cash transaction, so the payments that settle
 * the price are captured here and must add up to it.
 */
@Component({
	selector: 'app-repair-tracking-form',
	standalone: true,
	imports: [Button, CurrencyPipe, FormField, SignalFormField, Spinner, TranslatePipe],
	template: `
		<section class="border-border bg-card rounded-xl border p-4 sm:p-5" aria-labelledby="tracking-form-title">
			<h2 id="tracking-form-title" class="text-foreground mb-4 text-lg font-semibold">
				{{ 'REPAIRS.TRACKING.TITLE' | translate }}
			</h2>

			<form (submit)="onSubmit($event)" class="flex flex-col gap-4" novalidate>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<app-form-field [label]="'REPAIRS.FIELDS.STATUS' | translate">
						<select [formField]="trackingForm.statusId">
							@for (status of statuses(); track status.id) {
								<option [value]="status.id">{{ status.description }}</option>
							}
						</select>
					</app-form-field>
					<app-form-field [label]="'REPAIRS.FIELDS.WARRANTY_TERM' | translate">
						<input [formField]="trackingForm.warrantyTerm" type="number" />
					</app-form-field>
					<app-form-field [label]="'REPAIRS.FIELDS.PRICE' | translate">
						<input [formField]="trackingForm.price" type="number" step="0.01" />
					</app-form-field>
					<app-form-field [label]="'REPAIRS.FIELDS.COST' | translate">
						<input [formField]="trackingForm.cost" type="number" step="0.01" />
					</app-form-field>
					<app-form-field [label]="'REPAIRS.FIELDS.PAYMENT_IN_ADVANCE' | translate">
						<input [formField]="trackingForm.paymentInAdvance" type="number" step="0.01" />
					</app-form-field>
					<app-form-field [label]="'REPAIRS.FIELDS.NOTE' | translate" class="sm:col-span-2">
						<textarea [formField]="trackingForm.note" rows="3"></textarea>
					</app-form-field>
				</div>

				@if (generateTransaction()) {
					<fieldset class="border-border flex flex-col gap-3 rounded-lg border p-3">
						<legend class="text-foreground px-1 text-sm font-semibold">
							{{ 'REPAIRS.TRACKING.PAYMENTS' | translate }}
						</legend>
						<p class="text-muted-foreground text-sm">{{ 'REPAIRS.TRACKING.PAYMENTS_HINT' | translate }}</p>

						@for (payment of trackingForm.payments; track $index) {
							<div class="grid grid-cols-[1fr_1fr_auto] items-end gap-3">
								<app-form-field [label]="('REPAIRS.TRACKING.PAYMENT_METHOD' | translate) + ' ' + ($index + 1)">
									<select [formField]="payment.paymentMethodId">
										@for (method of paymentMethods(); track method.id) {
											<option [value]="method.id">{{ method.description }}</option>
										}
									</select>
								</app-form-field>
								<app-form-field [label]="('REPAIRS.TRACKING.PAYMENT_AMOUNT' | translate) + ' ' + ($index + 1)">
									<input [formField]="payment.amount" type="number" step="0.01" />
								</app-form-field>
								<button
									(click)="removePayment($index)"
									[attr.aria-label]="('REPAIRS.TRACKING.REMOVE_PAYMENT' | translate) + ' ' + ($index + 1)"
									appButton
									type="button"
									variant="outline"
								>
									{{ 'REPAIRS.TRACKING.REMOVE_PAYMENT' | translate }}
								</button>
							</div>
						}

						<div class="flex items-center justify-between gap-3">
							<button (click)="addPayment()" appButton type="button" variant="outline">
								{{ 'REPAIRS.TRACKING.ADD_PAYMENT' | translate }}
							</button>
							<p class="text-foreground text-sm font-medium">
								{{ 'REPAIRS.TRACKING.PAYMENTS_TOTAL' | translate }}
								{{ paymentsTotal() | currency: 'ARS' : 'symbol-narrow' }}
							</p>
						</div>

						@if (paymentsMismatch()) {
							<p role="alert" class="text-destructive text-sm">
								{{ 'REPAIRS.TRACKING.PAYMENTS_MISMATCH' | translate }}
							</p>
						}
					</fieldset>
				}

				<div class="flex justify-end">
					<button [disabled]="!canSave()" appButton type="submit">
						@if (saving()) {
							<app-spinner data-icon="start" />
						}
						{{ saving() ? ('COMMON.SAVING' | translate) : ('REPAIRS.TRACKING.SAVE' | translate) }}
					</button>
				</div>
			</form>
		</section>
	`,
})
export class RepairTrackingForm {
	public readonly repair = input.required<Repair>()
	public readonly statuses = input<readonly RepairStatus[]>([])
	public readonly paymentMethods = input<readonly PaymentMethodDto[]>([])
	public readonly saving = input(false)
	public readonly save = output<RepairTrackingSubmission>()

	private readonly model = linkedSignal<RepairTrackingFormModel>(() => trackingFormModelFromRepair(this.repair()))

	protected readonly trackingForm = form(this.model, repairTrackingSchema)

	protected readonly generateTransaction = computed(() =>
		shouldGenerateTransaction(Number(this.model().statusId), this.model().price),
	)

	protected readonly paymentsTotal = computed(() => this.model().payments.reduce((sum, row) => sum + row.amount, 0))

	protected readonly paymentsMismatch = computed(
		() => this.generateTransaction() && Math.abs(this.paymentsTotal() - this.model().price) > 0.005,
	)

	private readonly hasChanges = computed(
		() => JSON.stringify(this.model()) !== JSON.stringify(trackingFormModelFromRepair(this.repair())),
	)

	protected readonly canSave = computed(
		() => this.hasChanges() && this.trackingForm().valid() && !this.paymentsMismatch() && !this.saving(),
	)

	protected addPayment(): void {
		const remaining = Math.max(0, this.model().price - this.paymentsTotal())
		const row = { id: null, paymentMethodId: String(PaymentMethodId.CASH), amount: remaining }
		this.model.update((current) => ({ ...current, payments: [...current.payments, row] }))
	}

	protected removePayment(index: number): void {
		this.model.update((current) => ({ ...current, payments: current.payments.filter((_, i) => i !== index) }))
	}

	protected onSubmit(event: Event): void {
		event.preventDefault()
		if (!this.canSave()) return
		this.save.emit({
			changes: toTrackingChanges(this.model(), this.statuses(), this.paymentMethods(), this.repair().payments),
			generateTransaction: this.generateTransaction(),
		})
	}
}
