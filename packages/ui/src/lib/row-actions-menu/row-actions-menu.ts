import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { featherMoreVertical } from '@ng-icons/feather-icons'
import { NgpMenu, NgpMenuTrigger } from 'ng-primitives/menu'
import { NgpSeparator } from 'ng-primitives/separator'
import { Button } from '../button/button'
import { RowActionItem, type RowAction } from './row-action-item'

/**
 * Input shape for `RowActionsMenu.actions`. Accepts either:
 * - A flat list of actions (no separators rendered).
 * - A list of groups; a separator is rendered between every pair of non-empty groups.
 *
 * Empty groups are skipped so consumers can build groups conditionally without worrying
 * about producing dangling separators.
 */
export type RowActionsInput = readonly RowAction[] | readonly (readonly RowAction[])[]

// A `RowAction` is a plain object; only the matrix variant has an array as its first element.
function isMatrix(value: RowActionsInput): value is readonly (readonly RowAction[])[] {
	return value.length > 0 && Array.isArray(value[0])
}

/**
 * Vertical-ellipsis (⋮) trigger that opens an `NgpMenu` popover listing the row's actions.
 *
 * Renders nothing when no group contains actions — consumers do not need to guard with `@if`.
 *
 * Behavior:
 * - Click trigger opens the menu (`bottom-start` placement, auto-flip near viewport edges).
 * - Arrow keys navigate items; Enter / Space activates the focused item.
 * - Escape closes the menu; focus returns to the trigger when closed via keyboard.
 * - Click outside the menu closes it.
 *
 * `role="menu"` is applied explicitly because the underlying `NgpMenu` primitive manages
 * roving focus but does not set the ARIA role itself; `role="menuitem"` lives on the item
 * button in `RowActionItem`; separators get `role="separator"` via `NgpSeparator`.
 *
 * @example
 *   <!-- Flat list — single group, no separators -->
 *   <app-row-actions-menu [actions]="[edit, resetPassword, delete]" />
 *
 *   <!-- Groups — separator between non-destructive and destructive -->
 *   <app-row-actions-menu [actions]="[[edit, resetPassword], [delete]]" />
 */
@Component({
	selector: 'app-row-actions-menu',
	standalone: true,
	imports: [Button, NgIcon, NgpMenu, NgpMenuTrigger, NgpSeparator, RowActionItem],
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
					@for (group of nonEmptyGroups(); track $index; let last = $last) {
						@for (action of group; track $index) {
							<app-row-action-item [action]="action" />
						}
						@if (!last) {
							<div ngpSeparator role="separator" class="my-1 h-px bg-gray-200 dark:bg-gray-700"></div>
						}
					}
				</div>
			</ng-template>
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RowActionsMenu {
	public readonly actions = input.required<RowActionsInput>()
	public readonly triggerLabel = input<string>('Actions')

	// Normalize flat / matrix input into a single grouped form, then drop empty groups so
	// consumers can build groups conditionally without producing dangling separators.
	protected readonly nonEmptyGroups = computed(() => {
		const value = this.actions()
		const groups = isMatrix(value) ? value : [value]
		return groups.filter((group) => group.length > 0)
	})

	protected readonly hasActions = computed(() => this.nonEmptyGroups().length > 0)
}
