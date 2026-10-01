import { CurrencyPipe, DatePipe } from '@angular/common'
import { Component, input } from '@angular/core'
import type { Repair } from '@domain/repair/repair.model'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { RepairStatusBadge } from '../repair-status-badge/repair-status-badge'

/**
 * Read-only summary of a repair: customer, device, dates and the money figures.
 */
@Component({
	selector: 'app-repair-summary',
	standalone: true,
	imports: [CurrencyPipe, DatePipe, RepairStatusBadge, TranslatePipe],
	template: `
		<section class="border-border bg-card rounded-xl border p-4 sm:p-5" aria-labelledby="summary-section-title">
			<div class="flex items-center justify-between gap-3">
				<h2 id="summary-section-title" class="text-foreground text-lg font-semibold">
					{{ 'REPAIRS.DETAIL.SUMMARY' | translate }}
				</h2>
				<app-repair-status-badge [status]="repair().status" />
			</div>

			<dl class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<div>
					<dt class="text-muted-foreground text-sm">{{ 'REPAIRS.FIELDS.CUSTOMER' | translate }}</dt>
					<dd class="text-foreground mt-1 font-medium break-words">{{ repair().customer.fullName }}</dd>
				</div>
				<div>
					<dt class="text-muted-foreground text-sm">{{ 'REPAIRS.FIELDS.EMAIL' | translate }}</dt>
					<dd class="text-foreground mt-1 font-medium break-all">{{ repair().customer.email }}</dd>
				</div>
				<div>
					<dt class="text-muted-foreground text-sm">{{ 'REPAIRS.FIELDS.TELEPHONE' | translate }}</dt>
					<dd class="text-foreground mt-1 font-medium break-words">{{ repair().customer.telephone }}</dd>
				</div>
				<div>
					<dt class="text-muted-foreground text-sm">{{ 'REPAIRS.DETAIL.DEVICE' | translate }}</dt>
					<dd class="text-foreground mt-1 font-medium break-words">
						{{ repair().device.type.description }} - {{ repair().device.manufacturer }} {{ repair().device.model }}
					</dd>
				</div>
				<div>
					<dt class="text-muted-foreground text-sm">{{ 'REPAIRS.FIELDS.DEVICE_ID' | translate }}</dt>
					<dd class="text-foreground mt-1 font-medium break-all">{{ repair().device.deviceId || '-' }}</dd>
				</div>
				<div>
					<dt class="text-muted-foreground text-sm">{{ 'REPAIRS.DETAIL.POWER_STATE' | translate }}</dt>
					<dd class="text-foreground mt-1 font-medium">
						{{ (repair().device.turnedOn ? 'REPAIRS.DETAIL.ARRIVED_ON' : 'REPAIRS.DETAIL.ARRIVED_OFF') | translate }}
					</dd>
				</div>
				<div>
					<dt class="text-muted-foreground text-sm">{{ 'REPAIRS.DETAIL.CHECK_IN' | translate }}</dt>
					<dd class="text-foreground mt-1 font-medium">{{ repair().checkIn | date: 'yyyy-MM-dd HH:mm' }}</dd>
				</div>
				<div>
					<dt class="text-muted-foreground text-sm">{{ 'REPAIRS.DETAIL.LAST_UPDATE' | translate }}</dt>
					<dd class="text-foreground mt-1 font-medium">{{ repair().lastUpdate | date: 'yyyy-MM-dd HH:mm' }}</dd>
				</div>
				@if (repair().checkOut) {
					<div>
						<dt class="text-muted-foreground text-sm">{{ 'REPAIRS.DETAIL.CHECK_OUT' | translate }}</dt>
						<dd class="text-foreground mt-1 font-medium">{{ repair().checkOut | date: 'yyyy-MM-dd HH:mm' }}</dd>
					</div>
				}
				@if (repair().createdByUserName) {
					<div>
						<dt class="text-muted-foreground text-sm">{{ 'REPAIRS.DETAIL.CREATED_BY' | translate }}</dt>
						<dd class="text-foreground mt-1 font-medium break-words">{{ repair().createdByUserName }}</dd>
					</div>
				}
				<div>
					<dt class="text-muted-foreground text-sm">{{ 'REPAIRS.FIELDS.PRICE' | translate }}</dt>
					<dd class="text-foreground mt-1 font-medium">{{ repair().price | currency: 'ARS' : 'symbol-narrow' }}</dd>
				</div>
				<div>
					<dt class="text-muted-foreground text-sm">{{ 'REPAIRS.FIELDS.COST' | translate }}</dt>
					<dd class="text-foreground mt-1 font-medium">{{ repair().cost | currency: 'ARS' : 'symbol-narrow' }}</dd>
				</div>
				<div>
					<dt class="text-muted-foreground text-sm">{{ 'REPAIRS.FIELDS.PAYMENT_IN_ADVANCE' | translate }}</dt>
					<dd class="text-foreground mt-1 font-medium">
						{{ repair().paymentInAdvance | currency: 'ARS' : 'symbol-narrow' }}
					</dd>
				</div>
				<div>
					<dt class="text-muted-foreground text-sm">{{ 'REPAIRS.FIELDS.WARRANTY_TERM' | translate }}</dt>
					<dd class="text-foreground mt-1 font-medium">{{ repair().warrantyTerm }}</dd>
				</div>
				<div class="sm:col-span-2 lg:col-span-3">
					<dt class="text-muted-foreground text-sm">{{ 'REPAIRS.FIELDS.ISSUE' | translate }}</dt>
					<dd class="text-foreground mt-1 font-medium break-words whitespace-pre-line">{{ repair().issue }}</dd>
				</div>
			</dl>
		</section>
	`,
})
export class RepairSummary {
	public readonly repair = input.required<Repair>()
}
