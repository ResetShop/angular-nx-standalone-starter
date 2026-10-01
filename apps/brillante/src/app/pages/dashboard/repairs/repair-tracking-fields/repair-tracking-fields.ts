import { CurrencyPipe } from '@angular/common'
import { Component, computed, input } from '@angular/core'
import { FormField as SignalFormField, type FieldTree } from '@angular/forms/signals'
import { PaymentMethodId, type PaymentMethodDto } from '@contracts/cash/payment-method.types'
import type { RepairStatus } from '@domain/repair/repair.model'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Button } from '@resetshop/ui/button/button'
import { FormField } from '@resetshop/ui/form-field/form-field'
import {
	generatesTransaction,
	paymentsMismatch,
	paymentsTotal,
	type RepairTrackingFormModel,
} from './repair-tracking.form'

/**
 * Inputs for the tracking data of a repair: status, price, cost, advance payment, warranty and
 * note. A repair closed with a price generates its cash transaction, so the payments that settle
 * the price are captured here and must add up to it. The parent owns the form; this component only
 * renders its fields and edits its payment rows.
 */
@Component({
	selector: 'app-repair-tracking-fields',
	standalone: true,
	imports: [Button, CurrencyPipe, FormField, SignalFormField, TranslatePipe],
	template: `
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<app-form-field [label]="'REPAIRS.FIELDS.STATUS' | translate">
				<select [formField]="tracking().statusId">
					@for (status of statuses(); track status.id) {
						<option [value]="status.id">{{ status.description }}</option>
					}
				</select>
			</app-form-field>
			<app-form-field [label]="'REPAIRS.FIELDS.WARRANTY_TERM' | translate">
				<input [formField]="tracking().warrantyTerm" type="number" />
			</app-form-field>
			<app-form-field [label]="'REPAIRS.FIELDS.PRICE' | translate">
				<input [formField]="tracking().price" type="number" step="0.01" />
			</app-form-field>
			<app-form-field [label]="'REPAIRS.FIELDS.COST' | translate">
				<input [formField]="tracking().cost" type="number" step="0.01" />
			</app-form-field>
			<app-form-field [label]="'REPAIRS.FIELDS.PAYMENT_IN_ADVANCE' | translate">
				<input [formField]="tracking().paymentInAdvance" type="number" step="0.01" />
			</app-form-field>
			<app-form-field [label]="'REPAIRS.FIELDS.NOTE' | translate" class="sm:col-span-2">
				<textarea [formField]="tracking().note" rows="3"></textarea>
			</app-form-field>
		</div>

		@if (generateTransaction()) {
			<fieldset class="border-border mt-4 flex flex-col gap-3 rounded-lg border p-3">
				<legend class="text-foreground px-1 text-sm font-semibold">
					{{ 'REPAIRS.TRACKING.PAYMENTS' | translate }}
				</legend>
				<p class="text-muted-foreground text-sm">{{ 'REPAIRS.TRACKING.PAYMENTS_HINT' | translate }}</p>

				@for (payment of tracking().payments; track $index) {
					<div class="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
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
						{{ total() | currency: 'ARS' : 'symbol-narrow' }}
					</p>
				</div>

				@if (mismatch()) {
					<p role="alert" class="text-destructive text-sm">
						{{ 'REPAIRS.TRACKING.PAYMENTS_MISMATCH' | translate }}
					</p>
				}
			</fieldset>
		}
	`,
})
export class RepairTrackingFields {
	public readonly tracking = input.required<FieldTree<RepairTrackingFormModel>>()
	public readonly statuses = input<readonly RepairStatus[]>([])
	public readonly paymentMethods = input<readonly PaymentMethodDto[]>([])

	protected readonly generateTransaction = computed(() => generatesTransaction(this.tracking()().value()))
	protected readonly total = computed(() => paymentsTotal(this.tracking()().value()))
	protected readonly mismatch = computed(() => paymentsMismatch(this.tracking()().value()))

	protected addPayment(): void {
		const model = this.tracking()().value()
		const remaining = Math.max(0, model.price - paymentsTotal(model))
		const row = { id: null, paymentMethodId: String(PaymentMethodId.CASH), amount: remaining }
		this.tracking()
			.payments()
			.value.update((rows) => [...rows, row])
	}

	protected removePayment(index: number): void {
		this.tracking()
			.payments()
			.value.update((rows) => rows.filter((_, i) => i !== index))
	}
}
