import { CurrencyPipe, DatePipe } from '@angular/common'
import { Component, input } from '@angular/core'
import type { RepairStatusEntry } from '@domain/repair/repair.model'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { RepairStatusBadge } from '../repair-status-badge/repair-status-badge'

/**
 * Timeline of the status changes of a repair, newest first.
 */
@Component({
	selector: 'app-repair-history',
	standalone: true,
	imports: [CurrencyPipe, DatePipe, RepairStatusBadge, TranslatePipe],
	template: `
		<section class="border-border bg-card rounded-xl border p-4 sm:p-5" aria-labelledby="history-section-title">
			<h2 id="history-section-title" class="text-foreground mb-4 text-lg font-semibold">
				{{ 'REPAIRS.HISTORY.TITLE' | translate }}
			</h2>

			@if (entries().length === 0) {
				<p class="text-muted-foreground text-sm">{{ 'REPAIRS.HISTORY.EMPTY' | translate }}</p>
			} @else {
				<ol class="border-border relative ml-2 border-l">
					@for (entry of entries(); track entry.id) {
						<li class="mb-6 ml-4 last:mb-0">
							<span class="bg-primary absolute -left-1.5 mt-1.5 size-3 rounded-full" aria-hidden="true"></span>
							<div class="flex flex-wrap items-center gap-2">
								<app-repair-status-badge [status]="entry.status" />
								<time class="text-muted-foreground text-xs">{{ entry.changedAt | date: 'yyyy/MM/dd HH:mm' }}</time>
								@if (entry.userName) {
									<span class="text-muted-foreground text-xs">{{ entry.userName }}</span>
								}
							</div>
							<p class="text-muted-foreground mt-1 text-sm">
								{{ 'REPAIRS.FIELDS.PRICE' | translate }}: {{ entry.price | currency: 'ARS' : 'symbol-narrow' }} ·
								{{ 'REPAIRS.FIELDS.COST' | translate }}: {{ entry.cost | currency: 'ARS' : 'symbol-narrow' }} ·
								{{ 'REPAIRS.FIELDS.PAYMENT_IN_ADVANCE' | translate }}:
								{{ entry.paymentInAdvance | currency: 'ARS' : 'symbol-narrow' }}
							</p>
							@if (entry.note) {
								<p class="text-foreground mt-1 text-sm break-words whitespace-pre-line">{{ entry.note }}</p>
							}
						</li>
					}
				</ol>
			}
		</section>
	`,
})
export class RepairHistory {
	public readonly entries = input.required<readonly RepairStatusEntry[]>()
}
