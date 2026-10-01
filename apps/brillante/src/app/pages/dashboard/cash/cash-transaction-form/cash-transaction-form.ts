import { Component, computed, effect, inject, input, linkedSignal, output, untracked } from '@angular/core'
import { applyEach, form, min, minLength, required, schema, FormField as SignalFormField } from '@angular/forms/signals'
import type { TransactionConceptDto } from '@contracts/cash/cash-concept.types'
import type { CashTransactionDraft } from '@domain/cash/cash-request.mapper'
import {
	createCashTransactionFormModel,
	toCashTransactionDraft,
	type CashTransactionFormModel,
} from '@domain/cash/cash-transaction-form'
import { TransactionTypeId, type CashTransaction } from '@domain/cash/cash-transaction.model'
import type { PaymentMethod } from '@domain/cash/payment-method.model'
import { AppTranslation } from '@providers/i18n/app-translation'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Alert, AlertDescription } from '@resetshop/ui/alert/alert'
import { Badge } from '@resetshop/ui/badge/badge'
import { Button } from '@resetshop/ui/button/button'
import { FormField } from '@resetshop/ui/form-field/form-field'
import { Select } from '@resetshop/ui/select/select'
import type { SelectOption } from '@resetshop/ui/select/select-option'
import { Spinner } from '@resetshop/ui/spinner/spinner'
import { PaymentInput } from '../payment-input/payment-input'

/**
 * Create / edit form of a cash transaction. Presentational: the page supplies the catalogues and
 * the transaction being edited (none when creating) and reacts to the emitted draft.
 */
@Component({
	selector: 'app-cash-transaction-form',
	standalone: true,
	imports: [
		Alert,
		AlertDescription,
		Badge,
		Button,
		FormField,
		PaymentInput,
		Select,
		SignalFormField,
		Spinner,
		TranslatePipe,
	],
	template: `
		<form (submit)="onSubmit($event)" novalidate class="flex max-w-2xl flex-col gap-4">
			@if (error()) {
				<div appAlert variant="destructive">
					<p appAlertDescription>{{ error() }}</p>
				</div>
			}

			<app-form-field [label]="'CASH.FORM.CONCEPT' | translate">
				<app-select
					[formField]="cashForm.parentConceptId"
					[options]="parentOptions()"
					[placeholder]="'CASH.FORM.SELECT_CONCEPT' | translate"
				/>
			</app-form-field>

			<app-form-field [label]="'CASH.FORM.SUBCONCEPT' | translate">
				<app-select
					[formField]="cashForm.conceptId"
					[options]="conceptOptions()"
					[placeholder]="'CASH.FORM.SELECT_SUBCONCEPT' | translate"
				/>
			</app-form-field>

			<div class="flex flex-col items-start gap-1.5">
				<span class="text-foreground text-sm font-medium">{{ 'CASH.FORM.TYPE' | translate }}</span>
				@if (selectedParent()) {
					<span [variant]="isIncome() ? 'default' : 'destructive'" appBadge>{{ kindLabel() }}</span>
				}
			</div>

			@for (payment of cashForm.payments; track $index) {
				<app-payment-input [payment]="payment" [paymentMethods]="paymentMethods()" />
			}

			<app-form-field [label]="'CASH.FORM.NOTE' | translate" [hint]="'CASH.FORM.NOTE_HINT' | translate">
				<textarea [formField]="cashForm.note" rows="4"></textarea>
			</app-form-field>

			@if (isEdit()) {
				<app-form-field [label]="'CASH.FORM.DATE' | translate">
					<input [formField]="cashForm.date" type="datetime-local" />
				</app-form-field>
			}

			@if (userName()) {
				<p class="text-sm">
					<span class="text-foreground font-medium">{{ 'CASH.FORM.USER' | translate }}:</span>
					{{ userName() }}
				</p>
			}

			<div class="flex gap-3">
				<button [disabled]="submitting() || !isFormValid()" appButton type="submit">
					@if (submitting()) {
						<app-spinner data-icon="start" />
					}
					{{ submitLabel() }}
				</button>
				<button (click)="cancelled.emit()" appButton type="button" variant="outline">
					{{ 'COMMON.CANCEL' | translate }}
				</button>
			</div>
		</form>
	`,
})
export class CashTransactionForm {
	/** Assignable concepts: roots carrying their assignable children. */
	public readonly concepts = input.required<readonly TransactionConceptDto[]>()
	public readonly paymentMethods = input.required<readonly PaymentMethod[]>()
	/** The transaction being edited; `null` when creating a new one. */
	public readonly transaction = input<CashTransaction | null>(null)
	public readonly userName = input('')
	public readonly submitting = input(false)
	public readonly error = input<string | null>(null)

	public readonly submitted = output<CashTransactionDraft>()
	public readonly cancelled = output<void>()

	private readonly translation = inject(AppTranslation)

	/**
	 * Re-seeded only when the catalogues become available or another transaction is opened, never
	 * because an unrelated input changed while the user is typing.
	 */
	private readonly model = linkedSignal<string, CashTransactionFormModel>({
		source: () =>
			`${this.transaction()?.id ?? 'new'}:${this.concepts().length > 0 && this.paymentMethods().length > 0}`,
		computation: () =>
			createCashTransactionFormModel({
				transaction: untracked(this.transaction),
				concepts: untracked(this.concepts),
				paymentMethods: untracked(this.paymentMethods),
			}),
	})

	protected readonly cashForm = form(
		this.model,
		schema<CashTransactionFormModel>((cash) => {
			const noteMinLength = 10
			required(cash.parentConceptId)
			required(cash.conceptId)
			required(cash.note)
			minLength(cash.note, noteMinLength)
			applyEach(cash.payments, (payment) => {
				min(payment.amount, 1)
				required(payment.paymentMethodId)
			})
		}),
	)

	protected readonly isEdit = computed(() => this.transaction() !== null)
	protected readonly isFormValid = computed(() => this.cashForm().valid())

	protected readonly selectedParent = computed(() =>
		this.concepts().find((concept) => String(concept.id) === this.cashForm.parentConceptId().value()),
	)
	private readonly children = computed(() => this.selectedParent()?.children ?? [])
	protected readonly isIncome = computed(() => this.selectedParent()?.transactionType.id === TransactionTypeId.INCOME)

	protected readonly parentOptions = computed<SelectOption[]>(() =>
		this.concepts().map((concept) => ({ value: String(concept.id), label: concept.description })),
	)
	protected readonly conceptOptions = computed<SelectOption[]>(() =>
		this.children().map((concept) => ({ value: String(concept.id), label: concept.description })),
	)

	protected readonly kindLabel = computed(() =>
		this.translation.instant(this.isIncome() ? 'CASH.TYPE.INCOME' : 'CASH.TYPE.EXPENSE'),
	)
	protected readonly submitLabel = computed(() => {
		if (this.submitting()) return this.translation.instant('COMMON.SAVING')
		return this.translation.instant(this.isEdit() ? 'CASH.FORM.SUBMIT_EDIT' : 'CASH.FORM.SUBMIT_CREATE')
	})

	/** Keeps the subconcept inside the chosen concept: picks its first one when the parent changes. */
	private readonly syncConceptEffect = effect(() => {
		const children = this.children()
		const current = this.cashForm.conceptId().value()
		if (children.length === 0 || children.some((child) => String(child.id) === current)) return
		untracked(() => this.cashForm.conceptId().value.set(String(children[0].id)))
	})

	protected onSubmit(event: Event): void {
		event.preventDefault()
		if (this.submitting() || !this.isFormValid()) return

		const draft = toCashTransactionDraft(this.model(), {
			transaction: this.transaction(),
			concepts: this.concepts(),
			paymentMethods: this.paymentMethods(),
		})
		if (draft) this.submitted.emit(draft)
	}
}
