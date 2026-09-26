import { Component, computed, input } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { featherMoreVertical } from '@ng-icons/feather-icons'
import { NgpMenu, type NgpMenuPlacement, NgpMenuTrigger } from 'ng-primitives/menu'
import { NgpSeparator } from 'ng-primitives/separator'
import { Avatar } from '../avatar/avatar'
import { RowActionItem } from '../row-actions-menu/row-action-item'
import { toMenuGroups } from '../menu/menu-groups'
import { type RowActionsInput } from '../row-actions-menu/row-actions-menu'

/**
 * A tile identifying the signed-in user that opens a menu of user-scoped actions.
 *
 * Expanded, the trigger shows the avatar, name and email. Collapsed, it shows the avatar only and
 * the menu is unchanged — its header, repeating the avatar, name and email, is then the only place
 * the user's identity is visible, so it is always rendered. Actions take the same shape as
 * `RowActionsMenu`: a flat list, or groups with a separator between each pair.
 *
 * The trigger's accessible name is the user's name in both states, so screen readers announce who
 * is signed in whether or not the name is visible.
 *
 * @example
 *   <app-user-menu name="Ada Lovelace" email="ada@example.com" initials="AL" [actions]="actions" />
 */
@Component({
	selector: 'app-user-menu',
	standalone: true,
	imports: [Avatar, NgIcon, NgpMenu, NgpMenuTrigger, NgpSeparator, RowActionItem],
	viewProviders: [provideIcons({ featherMoreVertical })],
	template: `
		<button
			[ngpMenuTrigger]="menu"
			[ngpMenuTriggerPlacement]="placement()"
			[attr.aria-label]="name()"
			[class.justify-center]="collapsed()"
			type="button"
			class="hover:bg-accent data-[open]:bg-accent focus-visible:ring-ring flex w-full items-center gap-2 rounded-md p-2 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
		>
			<app-avatar [initials]="initials()" />
			@if (!collapsed()) {
				<span class="grid min-w-0 flex-1 leading-tight">
					<span class="text-foreground truncate font-medium">{{ name() }}</span>
					<span class="text-muted-foreground truncate text-xs">{{ email() }}</span>
				</span>
				<ng-icon name="featherMoreVertical" class="text-muted-foreground size-4 shrink-0" />
			}
		</button>

		<!--
			"fixed" is required for the same reason as in RowActionsMenu: NgpMenu positions the panel
			through style.left / style.top, which have no effect on a statically positioned element.
		-->
		<ng-template #menu>
			<div
				ngpMenu
				role="menu"
				class="bg-card text-card-foreground border-border fixed z-50 flex w-max max-w-72 min-w-56 flex-col overflow-hidden rounded-md border shadow-md"
			>
				<div class="flex items-center gap-2 px-3 py-2 text-sm">
					<app-avatar [initials]="initials()" />
					<span class="grid min-w-0 flex-1 leading-tight">
						<span class="truncate font-medium">{{ name() }}</span>
						<span class="text-muted-foreground truncate text-xs">{{ email() }}</span>
					</span>
				</div>
				@for (group of groups(); track $index) {
					<div ngpSeparator role="separator" class="bg-border my-1 h-px"></div>
					@for (action of group; track $index) {
						<app-row-action-item [action]="action" />
					}
				}
			</div>
		</ng-template>
	`,
})
export class UserMenu {
	public readonly name = input.required<string>()
	public readonly email = input.required<string>()
	public readonly initials = input.required<string>()
	public readonly actions = input.required<RowActionsInput>()

	/** Shows the avatar only, for a sidebar collapsed to icons. */
	public readonly collapsed = input(false)

	/**
	 * Where the menu opens relative to the trigger. The default suits a trigger pinned to the bottom
	 * of a sidebar; the menu still flips when there is no room.
	 */
	public readonly placement = input<NgpMenuPlacement>('right-end')

	protected readonly groups = computed(() => toMenuGroups(this.actions()))
}
