import { Component, computed, inject, viewChild } from '@angular/core'
import { PageShell } from '@components/page-shell/page-shell'
import { Permission } from '@contracts/permission/permission.constants'
import { formatDisplayDate } from '@domain/customer/customer-form'
import type { ICustomer } from '@domain/customer/customer.interface'
import { AppTranslation } from '@providers/i18n/app-translation'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Button } from '@resetshop/ui/button/button'
import { DataTable } from '@resetshop/ui/data-table/data-table'
import { DataTableCellDef } from '@resetshop/ui/data-table/data-table-cell-def'
import { Pagination } from '@resetshop/ui/pagination/pagination'
import { type RowAction, RowActionsMenu } from '@resetshop/ui/row-actions-menu/row-actions-menu'
import { AuthStore } from '@store/auth/auth.store'
import type { ColumnDef } from '@tanstack/angular-table'
import { CreateCustomerDrawer } from '../create-customer-drawer/create-customer-drawer'
import { CustomersStore } from '../customers.store'
import { EditCustomerDrawer } from '../edit-customer-drawer/edit-customer-drawer'

@Component({
	selector: 'app-clients-list',
	standalone: true,
	imports: [
		Button,
		CreateCustomerDrawer,
		DataTable,
		DataTableCellDef,
		EditCustomerDrawer,
		PageShell,
		Pagination,
		RowActionsMenu,
		TranslatePipe,
	],
	template: `
		<app-page-shell
			[loading]="isInitialLoading()"
			[error]="store.readError().list"
			[title]="'CLIENTS.PAGE.TITLE' | translate"
		>
			<p pageDescription>{{ 'CLIENTS.PAGE.DESCRIPTION' | translate }}</p>

			<div
				pageActionsSkeleton
				class="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
				data-testid="clients-actions-skeleton"
			>
				<div class="bg-muted h-9 w-full max-w-sm animate-pulse rounded-md"></div>
				<div class="bg-muted h-9 w-full animate-pulse rounded-md sm:w-32"></div>
			</div>

			<div
				pageActions
				class="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
			>
				<div class="w-full max-w-sm">
					<input
						(input)="onSearchInput($event)"
						[placeholder]="'CLIENTS.PAGE.SEARCH' | translate"
						[attr.aria-label]="'CLIENTS.PAGE.SEARCH_LABEL' | translate"
						[attr.aria-describedby]="'clients-search-hint'"
						type="search"
						class="border-input bg-background text-foreground focus:border-ring focus:ring-ring h-9 w-full rounded-md border px-3 text-base focus:ring-1 focus:outline-none sm:text-sm"
					/>
					<p id="clients-search-hint" class="text-muted-foreground mt-1 text-xs">
						{{ 'CLIENTS.PAGE.SEARCH_HINT' | translate }}
					</p>
				</div>
				@if (canManage()) {
					<button (click)="createDrawer.open()" appButton class="w-full sm:w-auto">
						{{ 'CLIENTS.PAGE.CREATE_BUTTON' | translate }}
					</button>
				}
			</div>

			<app-data-table
				[columns]="columns()"
				[data]="store.customers()"
				[loading]="store.isLoadingList() || store.isMutating()"
				[caption]="'CLIENTS.TABLE.CAPTION' | translate"
				[displayModes]="displayModes"
				tabBleed="4"
			>
				<ng-template appDataTableCellDef="actions" let-row="row">
					<app-row-actions-menu
						[actions]="getRowActions(row)"
						[triggerLabel]="'ROW_ACTIONS.TRIGGER_LABEL' | translate"
					/>
				</ng-template>
			</app-data-table>

			@if (store.totalPages() > 1) {
				<app-pagination
					(pageChange)="store.setPage($event)"
					(pageSizeChange)="store.setPageSize($event)"
					[currentPage]="store.currentPage()"
					[totalPages]="store.totalPages()"
					[pageSize]="store.pageSize()"
				/>
			}
		</app-page-shell>

		<app-create-customer-drawer #createDrawer />

		<app-edit-customer-drawer #editDrawer />
	`,
})
export default class ClientsList {
	protected readonly store = inject(CustomersStore)
	protected readonly displayModes: Array<'table' | 'cards'> = ['table']

	private readonly authStore = inject(AuthStore)
	private readonly translation = inject(AppTranslation)
	private readonly editDrawer = viewChild.required<EditCustomerDrawer>('editDrawer')

	protected readonly canManage = computed(
		() => this.authStore.currentUser()?.hasPermission(Permission.CLIENTS_MANAGE) ?? false,
	)

	/**
	 * Only the very first load replaces the page with its skeleton. Later reloads (search, paging,
	 * saves) keep the controls mounted so the search box does not lose focus or its text.
	 */
	protected readonly isInitialLoading = computed(
		() => this.store.isLoadingList() && this.store.customers().length === 0 && this.store.searchQuery() === '',
	)

	protected readonly columns = computed((): ColumnDef<ICustomer, unknown>[] => {
		const base: ColumnDef<ICustomer, unknown>[] = [
			{ accessorKey: 'id', header: this.translation.instant('CLIENTS.TABLE.HEADER.ID') },
			{ accessorKey: 'dni', header: this.translation.instant('CLIENTS.TABLE.HEADER.DNI') },
			{ accessorKey: 'fullName', header: this.translation.instant('CLIENTS.TABLE.HEADER.NAME') },
			{ accessorKey: 'email', header: this.translation.instant('CLIENTS.TABLE.HEADER.EMAIL') },
			{ accessorKey: 'telephone', header: this.translation.instant('CLIENTS.TABLE.HEADER.TELEPHONE') },
			{
				id: 'birthDate',
				header: this.translation.instant('CLIENTS.TABLE.HEADER.BIRTH_DATE'),
				accessorFn: (row) =>
					row.birthDate ? formatDisplayDate(row.birthDate) : this.translation.instant('CLIENTS.TABLE.NO_BIRTH_DATE'),
			},
		]
		return this.canManage() ? [...base, { id: 'actions', header: '', enableSorting: false }] : base
	})

	protected onSearchInput(event: Event): void {
		this.store.setSearchQuery((event.target as HTMLInputElement).value)
	}

	protected getRowActions(row: ICustomer): readonly (readonly RowAction[])[] {
		return [[{ label: this.translation.instant('COMMON.EDIT'), onSelect: () => this.editDrawer().open(row) }]]
	}
}
