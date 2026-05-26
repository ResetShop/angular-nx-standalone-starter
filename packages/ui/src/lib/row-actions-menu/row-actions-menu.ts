import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { featherMoreVertical } from '@ng-icons/feather-icons'
import { NgpMenu, NgpMenuItem, NgpMenuTrigger } from 'ng-primitives/menu'
import { Button } from '../button/button'

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
 * Vertical-ellipsis (⋮) trigger that opens an `NgpMenu` popover listing the row's actions.
 *
 * Replaces inline action buttons in data-table rows. When `actions` is empty the component
 * renders nothing — consumers do not need to guard with `@if` themselves.
 *
 * Built on `ng-primitives` `NgpMenuTrigger` / `NgpMenu` / `NgpMenuItem`:
 * - Click trigger opens the menu (`bottom-start` placement, auto-flip near viewport edges).
 * - Arrow keys navigate items; Enter / Space activates the focused item.
 * - Escape closes the menu; focus returns to the trigger when closed via keyboard.
 * - Click outside the menu closes it.
 *
 * `role="menu"` and `role="menuitem"` ARIA roles are applied explicitly because the
 * underlying `NgpMenu` / `NgpMenuItem` primitives manage roving focus but do not set
 * those ARIA roles themselves.
 *
 * @example
 *   <app-row-actions-menu
 *     [actions]="getRowActions(row)"
 *     [triggerLabel]="'ROW_ACTIONS.TRIGGER_LABEL' | translate"
 *   />
 */
@Component({
	selector: 'app-row-actions-menu',
	standalone: true,
	imports: [Button, NgIcon, NgpMenu, NgpMenuItem, NgpMenuTrigger],
	viewProviders: [provideIcons({ featherMoreVertical })],
	template: `
		@if (hasActions()) {
			<button
				[ngpMenuTrigger]="menu"
				[attr.aria-label]="triggerLabel()"
				appButton
				variant="ghost"
				size="icon"
				type="button"
				data-touch-target
			>
				<ng-icon data-icon="start" name="featherMoreVertical" />
			</button>

			<ng-template #menu>
				<div
					ngpMenu
					role="menu"
					class="z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-900"
				>
					@for (action of actions(); track $index) {
						<button
							(click)="action.onSelect()"
							[ngpMenuItemDisabled]="action.disabled ?? false"
							[disabled]="action.disabled ?? false"
							[class.text-destructive]="action.variant === 'destructive'"
							ngpMenuItem
							role="menuitem"
							type="button"
							class="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm text-gray-900 transition-colors hover:bg-gray-100 focus:bg-gray-100 focus:outline-none disabled:pointer-events-none disabled:opacity-50 dark:text-gray-100 dark:hover:bg-gray-800 dark:focus:bg-gray-800"
						>
							@if (action.icon) {
								<ng-icon [name]="action.icon" class="size-4 shrink-0" />
							}
							{{ action.label }}
						</button>
					}
				</div>
			</ng-template>
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RowActionsMenu {
	public readonly actions = input.required<readonly RowAction[]>()
	public readonly triggerLabel = input<string>('Actions')

	protected readonly hasActions = computed(() => this.actions().length > 0)
}
