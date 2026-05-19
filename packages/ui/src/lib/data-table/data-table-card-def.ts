import { Directive, inject, TemplateRef } from '@angular/core'

/**
 * Template context provided to card display-mode definitions.
 *
 * `$implicit` is the full row data object (typed as the generic `T`). Card mode
 * receives the whole row rather than a single cell value because cards
 * compose multiple fields into a single visual unit.
 */
export interface DataTableCardDefContext<T = unknown> {
	$implicit: T
}

@Directive({
	selector: 'ng-template[appDataTableCardDef]',
	standalone: true,
})
export class DataTableCardDef<T = unknown> {
	public readonly template = inject<TemplateRef<DataTableCardDefContext<T>>>(TemplateRef)
}
