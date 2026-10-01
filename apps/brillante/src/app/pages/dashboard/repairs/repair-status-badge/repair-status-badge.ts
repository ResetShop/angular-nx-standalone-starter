import { Component, computed, input } from '@angular/core'
import { RepairStatusId } from '@contracts/repair/repair-status.constants'
import { isFinishedStatus } from '@domain/repair/repair.functions'
import type { RepairStatus } from '@domain/repair/repair.model'
import { Badge, type BadgeVariant } from '@resetshop/ui/badge/badge'

/**
 * Status pill of a repair. Finished repairs render with the default variant, repairs that came
 * back or are blocked on the customer with the destructive one and everything else as secondary,
 * so the list and the detail page read the same way.
 */
@Component({
	selector: 'app-repair-status-badge',
	standalone: true,
	imports: [Badge],
	template: `
		<span [variant]="variant()" appBadge>{{ status().description }}</span>
	`,
})
export class RepairStatusBadge {
	public readonly status = input.required<RepairStatus>()

	protected readonly variant = computed<BadgeVariant>(() => {
		const id = this.status().id
		if (isFinishedStatus(id)) return 'default'
		const attentionIds: readonly number[] = [
			RepairStatusId.REENTERED,
			RepairStatusId.REENTERED_WITH_WARRANTY,
			RepairStatusId.REQUIRES_CUSTOMER_INTERVENTION,
		]
		return attentionIds.includes(id) ? 'destructive' : 'secondary'
	})
}
