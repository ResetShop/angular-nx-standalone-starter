import { NgClass } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'
import { NgIcon } from '@ng-icons/core'
import { NgpMenuItem } from 'ng-primitives/menu'

/**
 * A single action item exposed in the row-actions menu.
 *
 * `variant: 'destructive'` styles the item with `text-destructive`. Each menu item lives in
 * an independent popover element, so destructive styling here is a simple per-item class —
 * none of the cascade-order problems that affect inline-button compositions apply.
 */
export interface RowAction {
	readonly label: string
	readonly onSelect: () => void
	readonly variant?: 'default' | 'destructive'
	readonly icon?: string
	readonly disabled?: boolean
}

/**
 * Renders a single `RowAction` as a menu item button.
 *
 * Designed to be projected into an `ngpMenu` host — relies on the `ngpMenuItem` directive
 * for keyboard navigation and selection handling provided by the parent menu. Outside of
 * a menu host the button still renders, but the menu-level keyboard semantics are inert.
 *
 * Lives as a separate component (rather than inlined in `RowActionsMenu`) so the per-item
 * template, color-variant logic, and disabled-state wiring can be tested and reused
 * independently of the menu wrapper.
 *
 * @example
 *   <div ngpMenu role="menu">
 *     @for (action of actions; track $index) {
 *       <app-row-action-item [action]="action" />
 *     }
 *   </div>
 */
@Component({
	selector: 'app-row-action-item',
	standalone: true,
	imports: [NgClass, NgIcon, NgpMenuItem],
	template: `
		<!--
			text-gray-900 / dark:text-gray-100 and text-destructive both target the color CSS
			property at equal specificity. Tailwind v4 emits color utilities in its own
			class-index order (NOT in @theme token-declaration order), so a static text-gray-900
			plus a conditional [class.text-destructive] would always cascade to gray. The fix is
			to make the two color sets mutually exclusive via ngClass; [class.dark:text-gray-100]
			is not a valid Angular binding (colons in the class name break the parser), so
			ngClass is the right tool for the dark-variant pair.
		-->
		<button
			(click)="action().onSelect()"
			[ngpMenuItemDisabled]="isDisabled()"
			[disabled]="isDisabled()"
			[ngClass]="colorClasses()"
			ngpMenuItem
			role="menuitem"
			type="button"
			class="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-gray-100 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[focus-visible]:bg-gray-100 dark:hover:bg-gray-800 dark:data-[focus-visible]:bg-gray-800"
		>
			@if (action().icon; as icon) {
				<ng-icon [name]="icon" class="size-4 shrink-0" />
			}
			{{ action().label }}
		</button>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RowActionItem {
	public readonly action = input.required<RowAction>()

	protected readonly isDisabled = computed(() => this.action().disabled ?? false)
	protected readonly colorClasses = computed(() =>
		this.action().variant === 'destructive' ? 'text-destructive' : 'text-gray-900 dark:text-gray-100',
	)
}
