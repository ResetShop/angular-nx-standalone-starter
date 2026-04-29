import { Directive, inject, input, TemplateRef } from '@angular/core'

/**
 * Template context provided to custom cell definitions.
 *
 * `$implicit` is the cell value from `cell.getValue()` — typed as `unknown` because
 * TanStack Table erases the value type at the generic table boundary.
 * `row` is the full row data object.
 */
export interface DataTableCellDefContext<T = unknown> {
	$implicit: unknown
	row: T
}

@Directive({
	selector: 'ng-template[appDataTableCellDef]',
	standalone: true,
})
export class DataTableCellDef<T = unknown> {
	public readonly appDataTableCellDef = input.required<string>()
	public readonly template = inject<TemplateRef<DataTableCellDefContext<T>>>(TemplateRef)
}
