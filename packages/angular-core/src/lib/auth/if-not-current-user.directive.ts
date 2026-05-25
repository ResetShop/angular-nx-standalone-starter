import { Directive, type EmbeddedViewRef, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core'
import { CURRENT_USER_SOURCE } from './current-user.token'

/**
 * Structural directive that renders the template only when the bound entity
 * is NOT the currently authenticated user.
 *
 * Reactive: re-evaluates when the entity input changes OR when the current
 * user signal updates.
 *
 * Hides when: `entity.id === currentUser.id`.
 * Shows when: entity is null/undefined, currentUser is null, or ids differ.
 *
 * When combining with another structural directive (e.g. `*hasPermission`),
 * wrap in `<ng-container *ifNotCurrentUser="row">…</ng-container>` — Angular
 * permits only one structural directive per element. For two-condition gating,
 * prefer the `@if (!isCurrentUser(entity)) { … }` form using
 * `injectIsCurrentUser()` instead.
 *
 * @example
 *   <button *ifNotCurrentUser="row" (click)="delete(row)">Delete</button>
 */
@Directive({
	// eslint-disable-next-line @angular-eslint/directive-selector -- intentional: structural directive uses *ifNotCurrentUser without app prefix for clean template syntax
	selector: '[ifNotCurrentUser]',
	standalone: true,
})
export class IfNotCurrentUserDirective {
	public readonly entity = input.required<{ id: number } | null | undefined>({ alias: 'ifNotCurrentUser' })

	private readonly templateRef = inject(TemplateRef<unknown>)
	private readonly viewContainer = inject(ViewContainerRef)
	private readonly source = inject(CURRENT_USER_SOURCE)

	private embeddedView?: EmbeddedViewRef<unknown>

	private readonly renderEffect = effect(() => {
		const entity = this.entity()
		const current = this.source.currentUser()
		const isCurrent = entity != null && current != null && current.id === entity.id

		if (!isCurrent && !this.embeddedView) {
			this.embeddedView = this.viewContainer.createEmbeddedView(this.templateRef)
		} else if (isCurrent && this.embeddedView) {
			this.viewContainer.clear()
			this.embeddedView = undefined
		}
	})
}
