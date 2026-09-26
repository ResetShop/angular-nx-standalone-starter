import { Component, computed, input } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { featherMoreVertical } from '@ng-icons/feather-icons'
import { NgpMenu, NgpMenuItem, type NgpMenuPlacement, NgpMenuTrigger } from 'ng-primitives/menu'
import { NgpSeparator } from 'ng-primitives/separator'
import { Avatar } from '../avatar/avatar'
import { type MenuItemsInput, toMenuGroups } from '../menu/menu-groups'

interface UserMenuItemBase {
	readonly label: string
	/** An `@ng-icons` name, provided by the consumer, rendered before the label. */
	readonly icon?: string
	readonly disabled?: boolean
}

/** An item that takes the user somewhere: rendered as a link to `route`. */
export interface UserMenuLink extends UserMenuItemBase {
	readonly route: string
	readonly onSelect?: never
}

/** An item that does something without leaving for a page of its own: rendered as a button. */
export interface UserMenuAction extends UserMenuItemBase {
	readonly onSelect: () => void
	/** `'destructive'` renders the label in the destructive color. */
	readonly variant?: 'default' | 'destructive'
	readonly route?: never
}

export type UserMenuItem = UserMenuLink | UserMenuAction

/**
 * A tile identifying the signed-in user that opens a menu of user-scoped items.
 *
 * Expanded, the trigger shows the avatar, name and email. Collapsed, it shows the avatar only and
 * the menu is unchanged — its header, repeating the avatar, name and email, is then the only place
 * the user's identity is visible, so it is always rendered.
 *
 * Items that lead to a page are links, so they keep what links give users (the URL, opening in a
 * new tab, being announced as links); items that act in place are buttons. Pass them as a flat
 * list, or as groups with a separator between each pair.
 *
 * The trigger's accessible name is the user's name in both states, so screen readers announce who
 * is signed in whether or not the name is visible.
 *
 * @example
 *   <app-user-menu name="Ada Lovelace" email="ada@example.com" initials="AL" [items]="items" />
 */
@Component({
	selector: 'app-user-menu',
	standalone: true,
	imports: [Avatar, NgIcon, NgpMenu, NgpMenuItem, NgpMenuTrigger, NgpSeparator, RouterLink],
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
					@for (item of group; track $index) {
						@if (item.route !== undefined) {
							<!-- A disabled link drops its URL: an anchor cannot be disabled natively. -->
							<a
								[routerLink]="item.disabled ? null : item.route"
								[attr.aria-disabled]="item.disabled || null"
								[ngpMenuItemDisabled]="!!item.disabled"
								[class]="itemClasses"
								class="text-foreground"
								ngpMenuItem
								role="menuitem"
							>
								@if (item.icon; as icon) {
									<ng-icon [name]="icon" class="size-4 shrink-0" />
								}
								{{ item.label }}
							</a>
						} @else {
							<button
								(click)="item.onSelect()"
								[disabled]="!!item.disabled"
								[ngpMenuItemDisabled]="!!item.disabled"
								[class]="itemClasses"
								[class.text-destructive]="item.variant === 'destructive'"
								[class.text-foreground]="item.variant !== 'destructive'"
								ngpMenuItem
								role="menuitem"
								type="button"
							>
								@if (item.icon; as icon) {
									<ng-icon [name]="icon" class="size-4 shrink-0" />
								}
								{{ item.label }}
							</button>
						}
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
	public readonly items = input.required<MenuItemsInput<UserMenuItem>>()

	/** Shows the avatar only, for a sidebar collapsed to icons. */
	public readonly collapsed = input(false)

	/**
	 * Where the menu opens relative to the trigger. The default suits a trigger pinned to the bottom
	 * of a sidebar; the menu still flips when there is no room.
	 */
	public readonly placement = input<NgpMenuPlacement>('right-end')

	protected readonly groups = computed(() => toMenuGroups(this.items()))

	// Shared by link and button items. The text color is applied per item instead of here, because a
	// base color class would compete with `text-destructive` at equal specificity.
	protected readonly itemClasses =
		'flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm no-underline transition-colors hover:bg-accent focus:outline-none data-[focus-visible]:bg-accent disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50'
}
