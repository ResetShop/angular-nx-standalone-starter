import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core'
import { AuthStore } from '@store/auth/auth.store'

/**
 * Structural directive that conditionally renders its host element
 * based on the current user's permissions.
 *
 * @example
 * ```html
 * <button *appHasPermission="'admin:users:create'" appButton>Create User</button>
 * ```
 */
@Directive({
	selector: '[appHasPermission]',
	standalone: true,
})
export class HasPermissionDirective {
	public readonly appHasPermission = input.required<string>()

	private readonly authStore = inject(AuthStore)
	private readonly templateRef = inject(TemplateRef<unknown>)
	private readonly viewContainer = inject(ViewContainerRef)

	private hasView = false

	private readonly permissionEffect = effect(() => {
		const user = this.authStore.currentUser()
		const permitted = user?.hasPermission(this.appHasPermission()) ?? false

		if (permitted && !this.hasView) {
			this.viewContainer.createEmbeddedView(this.templateRef)
			this.hasView = true
		} else if (!permitted && this.hasView) {
			this.viewContainer.clear()
			this.hasView = false
		}
	})
}
