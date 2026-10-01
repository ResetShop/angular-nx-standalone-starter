import { Component, computed, input } from '@angular/core'
import type { CashTotals } from '@domain/cash/cash-totals'
import { formatMoney } from '@domain/cash/money'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'

@Component({
	selector: 'app-cash-totals-summary',
	standalone: true,
	host: { class: 'block' },
	imports: [TranslatePipe],
	template: `
		<section [attr.aria-label]="'CASH.TOTALS.LABEL' | translate">
			<dl class="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
				<div class="border-border bg-card rounded-lg border p-4">
					<dt class="text-muted-foreground text-sm">{{ 'CASH.TOTALS.INCOMES' | translate }}</dt>
					<dd class="mt-1 text-2xl font-semibold text-green-700 dark:text-green-400">{{ incomes() }}</dd>
				</div>
				<div class="border-border bg-card rounded-lg border p-4">
					<dt class="text-muted-foreground text-sm">{{ 'CASH.TOTALS.EXPENSES' | translate }}</dt>
					<dd class="text-destructive mt-1 text-2xl font-semibold">{{ expenses() }}</dd>
				</div>
				<div class="border-border bg-card rounded-lg border p-4">
					<dt class="text-muted-foreground text-sm">{{ 'CASH.TOTALS.BALANCE' | translate }}</dt>
					<dd class="text-foreground mt-1 text-2xl font-semibold">{{ balance() }}</dd>
				</div>
			</dl>
		</section>
	`,
})
export class CashTotalsSummary {
	public readonly totals = input.required<CashTotals>()

	protected readonly incomes = computed(() => formatMoney(this.totals().incomes))
	protected readonly expenses = computed(() => formatMoney(this.totals().expenses))
	protected readonly balance = computed(() => formatMoney(this.totals().balance))
}
