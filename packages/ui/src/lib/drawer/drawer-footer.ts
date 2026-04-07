import { Directive, inject, TemplateRef } from '@angular/core'

/**
 * Directive to mark the drawer footer template.
 * Usage: <ng-template appDrawerFooter>...</ng-template>
 */
@Directive({
	selector: '[appDrawerFooter]',
	standalone: true,
})
export class DrawerFooter {
	public readonly templateRef = inject(TemplateRef)
}
