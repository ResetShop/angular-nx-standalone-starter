import { NgTemplateOutlet } from '@angular/common'
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	contentChildren,
	effect,
	inject,
	input,
	isDevMode,
	linkedSignal,
	output,
	signal,
} from '@angular/core'
import {
	type ColumnDef,
	type ExpandedState,
	type Row,
	type SortingState,
	type Updater,
	createAngularTable,
	getCoreRowModel,
	getExpandedRowModel,
	getGroupedRowModel,
	getSortedRowModel,
} from '@tanstack/angular-table'

import { Translation } from '@resetshop/angular-core/i18n/translation'
import { Spinner } from '../spinner/spinner'
import { DataTableCellDef } from './data-table-cell-def'

export interface DataTableSortEvent {
	id: string
	direction: 'asc' | 'desc'
}

@Component({
	selector: 'app-data-table',
	standalone: true,
	imports: [NgTemplateOutlet, Spinner],
	templateUrl: './data-table.html',
	styles: `
		:host {
			display: block;
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTable<T> {
	private readonly translation = inject(Translation)

	/** TanStack column definitions */
	public readonly columns = input<ColumnDef<T, unknown>[]>([])

	/** Data rows */
	public readonly data = input<T[]>([])

	/** Whether data is loading */
	public readonly loading = input<boolean>(false)

	/**
	 * Message shown when data is empty.
	 *
	 * Defaults to the translated `DATA_TABLE.EMPTY` key, resolved once at construction.
	 * The translation is not reactive — if the application language changes at runtime,
	 * the component must be re-created to pick up the new locale.
	 */
	public readonly emptyMessage = input<string>(this.translation.instant('DATA_TABLE.EMPTY'))

	/** Accessible table caption */
	public readonly caption = input<string>('')

	/** Column IDs to group by (empty = no grouping) */
	public readonly grouping = input<string[]>([])

	/** Whether grouped rows start expanded (default: true) */
	public readonly expandedByDefault = input<boolean>(true)

	/**
	 * Translated loading message, resolved once at construction.
	 *
	 * Uses the `DATA_TABLE.LOADING` translation key. Not reactive to language changes —
	 * the component must be re-created to pick up a new locale.
	 */
	protected readonly loadingMessage = this.translation.instant('DATA_TABLE.LOADING')

	/** Emits when sort changes */
	public readonly sortChange = output<DataTableSortEvent>()

	/** Internal sorting state */
	private readonly sorting = signal<SortingState>([])

	/** Internal expanded state — resets to `expandedByDefault` when the input changes */
	private readonly expanded = linkedSignal<boolean, ExpandedState>({
		source: this.expandedByDefault,
		computation: (expandedByDefault) => (expandedByDefault ? true : {}),
	})

	/** TanStack table instance */
	protected readonly table = createAngularTable(() => {
		const groupingState = this.grouping()
		const isGrouped = groupingState.length > 0

		const baseOptions = {
			data: this.data(),
			columns: this.columns(),
			state: { sorting: this.sorting() },
			onSortingChange: (updater: Updater<SortingState>) => this.handleSortingUpdate(updater),
			getCoreRowModel: getCoreRowModel(),
			getSortedRowModel: getSortedRowModel(),
		}

		if (!isGrouped) return baseOptions

		return {
			...baseOptions,
			state: {
				...baseOptions.state,
				grouping: groupingState,
				expanded: this.expanded(),
			},
			onExpandedChange: (updater: Updater<ExpandedState>) => this.handleExpandedUpdate(updater),
			getGroupedRowModel: getGroupedRowModel(),
			getExpandedRowModel: getExpandedRowModel(),
			groupedColumnMode: false as const,
		}
	})

	/** Column count for colspan in empty/loading states */
	protected readonly columnCount = computed(() => this.columns().length)

	/** Custom cell template definitions projected as content */
	private readonly cellDefs = contentChildren(DataTableCellDef)

	/** Map of column ID → cell template definition */
	protected readonly cellDefMap = computed(() => {
		const map = new Map<string, DataTableCellDef>()
		for (const def of this.cellDefs()) {
			map.set(def.appDataTableCellDef(), def)
		}
		return map
	})

	/** Map TanStack sort direction to WAI-ARIA `aria-sort` values */
	protected resolveAriaSort(direction: false | 'asc' | 'desc'): 'ascending' | 'descending' | null {
		if (direction === 'asc') return 'ascending'
		if (direction === 'desc') return 'descending'
		return null
	}

	/** Resolve sort direction to a visual indicator character (↑, ↓, or ↕) */
	protected resolveSortIndicator(direction: false | 'asc' | 'desc'): string {
		if (direction === 'asc') return '↑'
		if (direction === 'desc') return '↓'
		return '↕'
	}

	/**
	 * Resolve header definition to a display string.
	 *
	 * TanStack Table header definitions are polymorphic (string | function | component).
	 * Parameters are typed as `unknown` because the generic boundary erases the concrete
	 * type — runtime type checking via `typeof` is the intended resolution strategy.
	 *
	 * - `string` → returned as-is
	 * - `function` → called with `context`, result coerced to string
	 * - other → returns empty string (component headers not supported)
	 */
	protected renderHeader(headerDef: unknown, context: unknown): string {
		if (typeof headerDef === 'string') return headerDef
		if (typeof headerDef === 'function') return String(headerDef(context))
		return ''
	}

	protected readonly groupIndentPx = 16

	/** Resolve the group label for a grouped row, coercing the unknown cell value to string */
	protected resolveGroupLabel(row: Row<T>): string {
		if (!row.getIsGrouped()) return ''
		const columnId = row.groupingColumnId ?? this.grouping()[0]
		return String(row.getValue(columnId))
	}

	private readonly validateGroupingEffect = isDevMode()
		? effect(() => {
				const groupingIds = this.grouping()
				if (groupingIds.length === 0) return

				const columnIds = new Set<string>()
				for (const col of this.columns()) {
					const id = col.id ?? ('accessorKey' in col ? (col.accessorKey as string) : undefined)
					if (id) columnIds.add(id)
				}

				for (const id of groupingIds) {
					if (!columnIds.has(id)) {
						console.warn(`DataTable: grouping column "${id}" does not match any column definition.`)
					}
				}
			})
		: undefined

	private handleExpandedUpdate(updater: Updater<ExpandedState>): void {
		const newExpanded = typeof updater === 'function' ? updater(this.expanded()) : updater
		this.expanded.set(newExpanded)
	}

	private handleSortingUpdate(updater: Updater<SortingState>): void {
		const newSorting = typeof updater === 'function' ? updater(this.sorting()) : updater
		this.sorting.set(newSorting)
		if (newSorting.length > 0) {
			this.sortChange.emit({
				id: newSorting[0].id,
				direction: newSorting[0].desc ? 'desc' : 'asc',
			})
		}
	}
}
