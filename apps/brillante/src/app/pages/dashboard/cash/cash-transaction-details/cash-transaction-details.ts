import { DatePipe } from '@angular/common'
import { Component, computed, inject, input, output } from '@angular/core'
import { RouterLink } from '@angular/router'
import type { CashTransaction } from '@domain/cash/cash-transaction.model'
import { formatMoney } from '@domain/cash/money'
import { AppTranslation } from '@providers/i18n/app-translation'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Badge } from '@resetshop/ui/badge/badge'
import { Button } from '@resetshop/ui/button/button'

/**
 * Read-only panel with every field of the selected transaction. Editing and deleting are offered
 * only when the viewer may manage the cash register and the transaction is user-editable.
 */
@Component({
	selector: 'app-cash-transaction-details',
	standalone: true,
	host: { class: 'block' },
	imports: [Badge, Button, DatePipe, RouterLink, TranslatePipe],
	template: `
		<section
			[attr.aria-label]="'CASH.DETAILS.TITLE' | translate"
			class="border-border bg-card flex flex-col gap-4 rounded-lg border p-4"
		>
			<h2 class="text-foreground text-lg font-semibold">{{ 'CASH.DETAILS.TITLE' | translate }}</h2>

			@if (loading()) {
				<p class="text-muted-foreground text-sm" role="status">{{ 'CASH.DETAILS.LOADING' | translate }}</p>
			} @else if (transaction(); as tx) {
				<dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
					<dt class="text-muted-foreground">{{ 'CASH.DETAILS.ID' | translate }}</dt>
					<dd>{{ tx.id }}</dd>

					<dt class="text-muted-foreground">{{ 'CASH.DETAILS.CONCEPT' | translate }}</dt>
					<dd>{{ conceptName() }}</dd>

					<dt class="text-muted-foreground">{{ 'CASH.DETAILS.SUBCONCEPT' | translate }}</dt>
					<dd>{{ tx.concept.description }}</dd>

					<dt class="text-muted-foreground">{{ 'CASH.DETAILS.TYPE' | translate }}</dt>
					<dd>
						<span [variant]="tx.kind === 'income' ? 'default' : 'destructive'" appBadge>{{ kindLabel() }}</span>
					</dd>

					<dt class="text-muted-foreground">{{ 'CASH.DETAILS.AMOUNT' | translate }}</dt>
					<dd class="font-semibold">{{ amount() }}</dd>

					<dt class="text-muted-foreground">{{ 'CASH.DETAILS.PAYMENT_METHOD' | translate }}</dt>
					<dd>
						<ul>
							@for (payment of payments(); track $index) {
								<li>{{ payment }}</li>
							}
						</ul>
					</dd>

					@if (tx.operation; as operation) {
						<dt class="text-muted-foreground">{{ 'CASH.DETAILS.OPERATION' | translate }}</dt>
						<dd>{{ operation.description }} #{{ operation.id }}</dd>
					}

					<dt class="text-muted-foreground">{{ 'CASH.DETAILS.DATE' | translate }}</dt>
					<dd>{{ tx.date | date: 'dd/MM/yyyy HH:mm' }}</dd>

					@if (tx.createdByUserName) {
						<dt class="text-muted-foreground">{{ 'CASH.DETAILS.USER' | translate }}</dt>
						<dd>{{ tx.createdByUserName }}</dd>
					}

					<dt class="text-muted-foreground">{{ 'CASH.DETAILS.NOTE' | translate }}</dt>
					<dd class="break-words whitespace-pre-line">{{ tx.note || ('CASH.DETAILS.NO_NOTE' | translate) }}</dd>
				</dl>

				@if (canManage()) {
					<div class="flex flex-wrap gap-3">
						@if (tx.editable) {
							<a [routerLink]="['/dashboard/cash', tx.id, 'edit']" appButton variant="outline">
								{{ 'CASH.ACTIONS.EDIT' | translate }}
							</a>
						}
						<button (click)="deleteRequested.emit()" appButton variant="destructive" type="button">
							{{ 'CASH.ACTIONS.DELETE' | translate }}
						</button>
					</div>
				}
			} @else {
				<p class="text-muted-foreground text-sm">{{ 'CASH.DETAILS.EMPTY' | translate }}</p>
			}
		</section>
	`,
})
export class CashTransactionDetails {
	public readonly transaction = input<CashTransaction | null>(null)
	public readonly canManage = input(false)
	public readonly loading = input(false)
	public readonly deleteRequested = output<void>()

	private readonly translation = inject(AppTranslation)

	protected readonly conceptName = computed(() => {
		const concept = this.transaction()?.concept
		return concept?.parent?.description ?? concept?.description ?? ''
	})

	protected readonly kindLabel = computed(() =>
		this.translation.instant(this.transaction()?.kind === 'income' ? 'CASH.TYPE.INCOME' : 'CASH.TYPE.EXPENSE'),
	)

	protected readonly amount = computed(() => formatMoney(this.transaction()?.amount ?? 0))

	protected readonly payments = computed(() =>
		(this.transaction()?.payments ?? []).map(
			(payment) => `${payment.paymentMethod.description} - ${formatMoney(payment.amount)}`,
		),
	)
}
