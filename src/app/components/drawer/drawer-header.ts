import { Directive, inject, TemplateRef } from '@angular/core'

/**
 * Directive to mark the drawer header template.
 * Usage: <ng-template appDrawerHeader>...</ng-template>
 */
@Directive({
	selector: '[appDrawerHeader]',
	standalone: true,
})
export class DrawerHeader {
	readonly templateRef = inject(TemplateRef)
}
