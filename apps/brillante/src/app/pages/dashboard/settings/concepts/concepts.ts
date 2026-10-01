import { Component, computed, effect, inject, signal, untracked, viewChild } from '@angular/core'
import { form, FormField as SignalFormField } from '@angular/forms/signals'
import { PageShell } from '@components/page-shell/page-shell'
import { TransactionTypeId } from '@domain/cash-concept/cash-concept.constants'
import type { CashConceptRow } from '@domain/cash-concept/cash-concept.interface'
import { AppTranslation } from '@providers/i18n/app-translation'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Badge } from '@resetshop/ui/badge/badge'
import { Button } from '@resetshop/ui/button/button'
import { DataTable } from '@resetshop/ui/data-table/data-table'
import { DataTableCellDef } from '@resetshop/ui/data-table/data-table-cell-def'
import { FormField } from '@resetshop/ui/form-field/form-field'
import { type RowAction, RowActionsMenu } from '@resetshop/ui/row-actions-menu/row-actions-menu'
import { Select } from '@resetshop/ui/select/select'
import type { SelectOption } from '@resetshop/ui/select/select-option'
import { CashConceptsStore } from '@store/cash-concepts/cash-concepts.store'
import { createMutationToast } from '@store/ui/mutation-toast'
import type { ColumnDef } from '@tanstack/angular-table'
import { ConceptDrawer } from './concept-drawer/concept-drawer'

interface ConceptFilterForm {
	/** Transaction type the table is narrowed to, as text; `'all'` lists every type. */
	type: string
}

/**
 * Manages the cash concept tree: lists concepts and subconcepts by transaction type, opens the
 * drawer that creates or edits them and enables or disables a concept in place. The route is
 * guarded by the permission to manage cash concepts, so the page does not re-check it.
 */
@Component({
	selector: 'app-concepts',
	imports: [
		Badge,
		Button,
		ConceptDrawer,
		DataTable,
		DataTableCellDef,
		FormField,
		PageShell,
		RowActionsMenu,
		Select,
		SignalFormField,
		TranslatePipe,
	],
	template: `
		<app-page-shell
			[loading]="store.isLoadingList()"
			[error]="store.readError().list"
			[title]="'CASH_CONCEPTS.TITLE' | translate"
		>
			<p pageDescription>{{ 'CASH_CONCEPTS.DESCRIPTION' | translate }}</p>

			<div pageActions class="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
				<app-form-field [label]="'CASH_CONCEPTS.FILTER.LABEL' | translate" class="w-full sm:max-w-xs">
					<app-select [formField]="filterForm.type" [options]="typeOptions()" />
				</app-form-field>
				<div class="flex flex-col gap-3 sm:flex-row">
					<button (click)="conceptDrawer().openCreateSubconcept()" appButton variant="outline">
						{{ 'CASH_CONCEPTS.NEW_SUBCONCEPT' | translate }}
					</button>
					<button (click)="conceptDrawer().openCreateConcept()" appButton>
						{{ 'CASH_CONCEPTS.NEW_CONCEPT' | translate }}
					</button>
				</div>
			</div>

			<app-data-table
				[columns]="columns()"
				[data]="store.rows()"
				[loading]="store.isMutating()"
				[caption]="'CASH_CONCEPTS.TABLE.CAPTION' | translate"
			>
				<ng-template appDataTableCellDef="description" let-value let-row="row">
					<span [class.pl-6]="row.level === 1" [class.font-medium]="row.level === 0">{{ value }}</span>
				</ng-template>

				<ng-template appDataTableCellDef="status" let-row="row">
					<span [variant]="row.enabled ? 'secondary' : 'outline'" appBadge>
						{{ (row.enabled ? 'CASH_CONCEPTS.STATUS.ENABLED' : 'CASH_CONCEPTS.STATUS.DISABLED') | translate }}
					</span>
				</ng-template>

				<ng-template appDataTableCellDef="actions" let-row="row">
					<app-row-actions-menu
						[actions]="getRowActions(row)"
						[triggerLabel]="'ROW_ACTIONS.TRIGGER_LABEL' | translate"
					/>
				</ng-template>
			</app-data-table>
		</app-page-shell>

		<app-concept-drawer #conceptDrawerRef />
	`,
})
export default class Concepts {
	protected readonly store = inject(CashConceptsStore)
	private readonly translation = inject(AppTranslation)

	protected readonly conceptDrawer = viewChild.required<ConceptDrawer>('conceptDrawerRef')

	private readonly enabledToast = createMutationToast(this.translation.instant('CASH_CONCEPTS.SUCCESS.ENABLED'))
	private readonly disabledToast = createMutationToast(this.translation.instant('CASH_CONCEPTS.SUCCESS.DISABLED'))

	private readonly filterModel = signal<ConceptFilterForm>({ type: 'all' })
	protected readonly filterForm = form(this.filterModel)

	protected readonly typeOptions = computed<SelectOption[]>(() => [
		{ value: 'all', label: this.translation.instant('CASH_CONCEPTS.FILTER.ALL') },
		{ value: String(TransactionTypeId.INCOME), label: this.translation.instant('CASH_CONCEPTS.TYPE.INCOME') },
		{ value: String(TransactionTypeId.EXPENSE), label: this.translation.instant('CASH_CONCEPTS.TYPE.EXPENSE') },
	])

	private readonly syncTypeFilterEffect = effect(() => {
		const { type } = this.filterModel()
		untracked(() => this.store.setTypeFilter(type === 'all' ? null : Number(type)))
	})

	private readonly statusToastEffect = effect(() => {
		const changing = this.store.isChangingStatus()
		const error = this.store.mutationError().setEnabled
		untracked(() => {
			this.enabledToast.handleResult(changing, error)
			this.disabledToast.handleResult(changing, error)
		})
	})

	protected readonly columns = computed((): ColumnDef<CashConceptRow, unknown>[] => [
		{ accessorKey: 'description', header: this.translation.instant('CASH_CONCEPTS.TABLE.HEADER.DESCRIPTION') },
		{
			id: 'type',
			header: this.translation.instant('CASH_CONCEPTS.TABLE.HEADER.TYPE'),
			accessorFn: (row) =>
				this.translation.instant(
					row.transactionTypeId === TransactionTypeId.INCOME
						? 'CASH_CONCEPTS.TYPE.INCOME'
						: 'CASH_CONCEPTS.TYPE.EXPENSE',
				),
		},
		{
			id: 'parent',
			header: this.translation.instant('CASH_CONCEPTS.TABLE.HEADER.PARENT'),
			accessorFn: (row) => row.parentDescription ?? '—',
		},
		{
			id: 'modifiable',
			header: this.translation.instant('CASH_CONCEPTS.TABLE.HEADER.MODIFIABLE'),
			accessorFn: (row) => this.translation.instant(row.modifiable ? 'CASH_CONCEPTS.YES' : 'CASH_CONCEPTS.NO'),
		},
		{ id: 'status', header: this.translation.instant('CASH_CONCEPTS.TABLE.HEADER.STATUS') },
		{ id: 'actions', header: '', enableSorting: false },
	])

	protected getRowActions(row: CashConceptRow): readonly (readonly RowAction[])[] {
		const actions: RowAction[] = []

		if (row.level === 0) {
			actions.push({
				label: this.translation.instant('CASH_CONCEPTS.ACTIONS.ADD_SUBCONCEPT'),
				onSelect: () => this.conceptDrawer().openCreateSubconcept(row.id),
			})
		}

		if (row.modifiable) {
			actions.push(
				{ label: this.translation.instant('COMMON.EDIT'), onSelect: () => this.conceptDrawer().openEdit(row) },
				{
					label: this.translation.instant(
						row.enabled ? 'CASH_CONCEPTS.ACTIONS.DISABLE' : 'CASH_CONCEPTS.ACTIONS.ENABLE',
					),
					onSelect: () => this.setEnabled(row, !row.enabled),
				},
			)
		}

		return [actions]
	}

	private setEnabled(row: CashConceptRow, enabled: boolean): void {
		const toast = enabled ? this.enabledToast : this.disabledToast
		toast.markSubmitted()
		this.store.setConceptEnabled({ id: row.id, enabled })
	}
}
