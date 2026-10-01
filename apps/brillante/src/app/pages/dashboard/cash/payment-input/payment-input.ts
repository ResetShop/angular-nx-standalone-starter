import { Component, computed, effect, inject, input, untracked } from '@angular/core'
import { type FieldTree, FormField as SignalFormField } from '@angular/forms/signals'
import type { PaymentFormModel } from '@domain/cash/cash-transaction-form'
import { quoteInstallments } from '@domain/cash/installments'
import { formatMoney } from '@domain/cash/money'
import type { PaymentMethod } from '@domain/cash/payment-method.model'
import { AppTranslation } from '@providers/i18n/app-translation'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { FormField } from '@resetshop/ui/form-field/form-field'
import { Select } from '@resetshop/ui/select/select'
import type { SelectOption } from '@resetshop/ui/select/select-option'

/**
 * One payment of a transaction: amount, payment method and, for methods that finance the purchase,
 * the instalment plan with the resulting quote. The owning form is created by the host.
 */
@Component({
	selector: 'app-payment-input',
	standalone: true,
	imports: [FormField, Select, SignalFormField, TranslatePipe],
	template: `
		<div class="flex flex-col gap-4">
			<app-form-field [label]="'CASH.FORM.AMOUNT' | translate">
				<input [formField]="payment().amount" type="number" step="0.01" inputmode="decimal" />
			</app-form-field>

			<app-form-field [label]="'CASH.FORM.PAYMENT_METHOD' | translate">
				<app-select
					[formField]="payment().paymentMethodId"
					[options]="methodOptions()"
					[placeholder]="'CASH.FORM.SELECT_PAYMENT_METHOD' | translate"
				/>
			</app-form-field>

			@if (installmentOptions().length > 0) {
				<app-form-field [label]="'CASH.FORM.INSTALLMENTS' | translate">
					<app-select [formField]="payment().installments" [options]="installmentOptions()" />
				</app-form-field>
				@if (quoteText()) {
					<p class="text-muted-foreground text-sm" role="status">{{ quoteText() }}</p>
				}
			}
		</div>
	`,
})
export class PaymentInput {
	public readonly payment = input.required<FieldTree<PaymentFormModel>>()
	public readonly paymentMethods = input.required<readonly PaymentMethod[]>()

	private readonly translation = inject(AppTranslation)

	protected readonly methodOptions = computed<SelectOption[]>(() =>
		this.paymentMethods().map((method) => ({ value: String(method.id), label: method.description })),
	)

	private readonly selectedMethod = computed(() =>
		this.paymentMethods().find((method) => String(method.id) === this.payment().paymentMethodId().value()),
	)

	protected readonly installmentOptions = computed<SelectOption[]>(() => {
		const method = this.selectedMethod()
		if (!method?.allowsInstallments) return []
		const template = this.translation.instant('CASH.FORM.INSTALLMENT_OPTION')
		return method.installments.map((plan) => ({
			value: String(plan.installments),
			label: template.replace('{count}', String(plan.installments)),
		}))
	})

	protected readonly quoteText = computed(() => {
		const method = this.selectedMethod()
		const installments = Number(this.payment().installments().value())
		if (!method || !installments) return ''
		const quote = quoteInstallments(this.payment().amount().value(), installments, method.installments)
		if (!quote) return ''
		return this.translation
			.instant('CASH.FORM.INSTALLMENT_QUOTE')
			.replace('{count}', String(quote.installments))
			.replace('{amount}', formatMoney(quote.installmentAmount))
			.replace('{total}', formatMoney(quote.total))
	})

	/** Drops an instalment plan the newly picked payment method does not offer. */
	private readonly resetInstallmentsEffect = effect(() => {
		const options = this.installmentOptions()
		const installments = this.payment().installments().value()
		if (installments && !options.some((option) => option.value === installments)) {
			untracked(() => this.payment().installments().value.set(''))
		}
	})
}
