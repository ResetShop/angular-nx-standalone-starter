import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { featherMoreVertical } from '@ng-icons/feather-icons'
import { NgpMenu, NgpMenuTrigger } from 'ng-primitives/menu'
import { Button } from '../button/button'
import { RowActionItem, type RowAction } from './row-action-item'

/**
 * Vertical-ellipsis (⋮) trigger that opens an `NgpMenu` popover listing the row's actions.
 *
 * Renders nothing when `actions` is empty — consumers do not need to guard with `@if`.
 *
 * Behavior:
 * - Click trigger opens the menu (`bottom-start` placement, auto-flip near viewport edges).
 * - Arrow keys navigate items; Enter / Space activates the focused item.
 * - Escape closes the menu; focus returns to the trigger when closed via keyboard.
 * - Click outside the menu closes it.
 *
 * `role="menu"` is applied explicitly because the underlying `NgpMenu` primitive manages
 * roving focus but does not set the ARIA role itself; `role="menuitem"` lives on the item
 * button in `RowActionItem`.
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
	imports: [Button, NgIcon, NgpMenu, NgpMenuTrigger, RowActionItem],
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

			<!--
				The "fixed" class is required: NgpMenu binds style.left and style.top to the
				computed overlay position via Floating UI, and those values are no-ops on a default
				position:static element. Without it the menu still renders into the DOM (tests
				pass), but lands at the document's static flow location instead of next to the
				trigger. The ng-primitives schematic template uses position:fixed for the same
				reason. "w-max" sizes to content; "min-w-[8rem]" enforces a floor for short labels.
			-->
			<ng-template #menu>
				<div
					ngpMenu
					role="menu"
					data-testid="row-actions-menu"
					class="fixed z-50 flex w-max min-w-[8rem] flex-col overflow-hidden rounded-md border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-900"
				>
					@for (action of actions(); track $index) {
						<app-row-action-item [action]="action" />
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
