import { Component, computed, effect, inject, signal, untracked, viewChild } from '@angular/core'
import { Router, RouterLink } from '@angular/router'
import { PageShell } from '@components/page-shell/page-shell'
import { Permission } from '@contracts/permission/permission.constants'
import type { Repair } from '@domain/repair/repair.model'
import { AppTranslation } from '@providers/i18n/app-translation'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Button } from '@resetshop/ui/button/button'
import { ConfirmDialog } from '@resetshop/ui/confirm-dialog/confirm-dialog'
import { DataTable } from '@resetshop/ui/data-table/data-table'
import { DataTableCellDef } from '@resetshop/ui/data-table/data-table-cell-def'
import { Pagination } from '@resetshop/ui/pagination/pagination'
import { type RowAction, RowActionsMenu } from '@resetshop/ui/row-actions-menu/row-actions-menu'
import { AuthStore } from '@store/auth/auth.store'
import { RepairStore } from '@store/repair/repair.store'
import { createMutationToast } from '@store/ui/mutation-toast'
import type { ColumnDef } from '@tanstack/angular-table'
import { format, isValid, parseISO } from 'date-fns'
import { RepairStatusBadge } from '../repair-status-badge/repair-status-badge'

function formatDateTime(date: Date | null): string {
	return date ? format(date, 'yyyy-MM-dd HH:mm') : ''
}

@Component({
	selector: 'app-repairs-list',
	standalone: true,
	imports: [
		Button,
		ConfirmDialog,
		DataTable,
		DataTableCellDef,
		PageShell,
		Pagination,
		RepairStatusBadge,
		RouterLink,
		RowActionsMenu,
		TranslatePipe,
	],
	template: `
		<app-page-shell
			[loading]="store.isLoadingList() && store.repairs().length === 0"
			[error]="store.readError().list"
			[title]="'REPAIRS.PAGE.TITLE' | translate"
		>
			<p pageDescription>{{ 'REPAIRS.PAGE.DESCRIPTION' | translate }}</p>

			<div
				pageActionsSkeleton
				class="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
				data-testid="repairs-actions-skeleton"
			>
				<div class="bg-muted h-9 w-full max-w-sm animate-pulse rounded-md"></div>
				<div class="bg-muted h-9 w-full animate-pulse rounded-md sm:w-24"></div>
			</div>

			<div pageActions class="flex flex-col gap-3">
				<div class="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
					<input
						(input)="onSearchInput($event)"
						[placeholder]="'REPAIRS.PAGE.SEARCH' | translate"
						type="search"
						class="border-input bg-background text-foreground focus:border-ring focus:ring-ring h-9 w-full max-w-sm rounded-md border px-3 text-base focus:ring-1 focus:outline-none sm:text-sm"
					/>
					@if (canManage()) {
						<a appButton routerLink="/dashboard/repairs/new" class="w-full sm:w-auto">
							{{ 'REPAIRS.PAGE.NEW_BUTTON' | translate }}
						</a>
					}
				</div>

				<div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
					<select
						(change)="onStatusFilterChange($event)"
						[attr.aria-label]="'REPAIRS.PAGE.STATUS_FILTER' | translate"
						class="border-input bg-background text-foreground h-9 rounded-md border px-2 text-base sm:text-sm"
					>
						<option value="">{{ 'REPAIRS.PAGE.STATUS_ALL' | translate }}</option>
						@for (status of store.statuses(); track status.id) {
							<option [value]="status.id" [selected]="store.statusFilter() === status.id">
								{{ status.description }}
							</option>
						}
					</select>

					<input
						(change)="onDateFromChange($event)"
						[attr.aria-label]="'REPAIRS.PAGE.DATE_FROM' | translate"
						[value]="dateFrom()"
						type="date"
						class="border-input bg-background text-foreground h-9 rounded-md border px-2 text-base sm:text-sm"
					/>
					<input
						(change)="onDateToChange($event)"
						[attr.aria-label]="'REPAIRS.PAGE.DATE_TO' | translate"
						[value]="dateTo()"
						type="date"
						class="border-input bg-background text-foreground h-9 rounded-md border px-2 text-base sm:text-sm"
					/>

					<label class="text-foreground flex items-center gap-2 text-sm">
						<input (change)="onShowFinishedChange($event)" [checked]="store.showFinished()" type="checkbox" />
						{{ 'REPAIRS.PAGE.SHOW_FINISHED' | translate }}
					</label>

					<button (click)="store.reload()" appButton type="button" variant="outline" class="sm:ml-auto">
						{{ 'REPAIRS.PAGE.REFRESH' | translate }}
					</button>
				</div>

				@if (dateRangeInvalid()) {
					<p role="alert" class="text-destructive text-sm">{{ 'REPAIRS.PAGE.DATE_RANGE_INVALID' | translate }}</p>
				}
			</div>

			<app-data-table
				[columns]="columns()"
				[data]="store.pagedRepairs()"
				[loading]="store.isLoadingList() || store.isMutating()"
				[caption]="'REPAIRS.TABLE.CAPTION' | translate"
			>
				<ng-template appDataTableCellDef="id" let-value let-row="row">
					<a [routerLink]="['/dashboard/repairs', row.id]" class="text-foreground font-medium hover:underline">
						{{ value }}
					</a>
				</ng-template>

				<ng-template appDataTableCellDef="status" let-row="row">
					<app-repair-status-badge [status]="row.status" />
				</ng-template>

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
					[currentPage]="store.activePage()"
					[totalPages]="store.totalPages()"
					[pageSize]="store.pageSize()"
					[pageSizeOptions]="[15, 30, 50]"
				/>
			}
		</app-page-shell>

		<app-confirm-dialog
			(confirmed)="onDeleteConfirmed()"
			[message]="deleteMessage()"
			[title]="'REPAIRS.DELETE_DIALOG.TITLE' | translate"
			[confirmText]="'COMMON.DELETE' | translate"
			#confirmDeleteDialog
			confirmVariant="destructive"
		/>
	`,
})
export default class RepairsList {
	protected readonly store = inject(RepairStore)

	private readonly authStore = inject(AuthStore)
	private readonly router = inject(Router)
	private readonly translation = inject(AppTranslation)

	private readonly deleteDialog = viewChild.required<ConfirmDialog>('confirmDeleteDialog')
	private readonly deleteToast = createMutationToast(this.translation.instant('REPAIRS.DELETE_TOAST'))

	protected readonly dateFrom = signal('')
	protected readonly dateTo = signal('')
	protected readonly repairToDelete = signal<Repair | null>(null)

	protected readonly canManage = computed(
		() => this.authStore.currentUser()?.hasPermission(Permission.REPAIRS_MANAGE) ?? false,
	)

	protected readonly dateRangeInvalid = computed(() => {
		const from = parseISO(this.dateFrom())
		const to = parseISO(this.dateTo())
		return isValid(from) && isValid(to) && from > to
	})

	protected readonly deleteMessage = computed(() => {
		const repair = this.repairToDelete()
		return this.translation
			.instant('REPAIRS.DELETE_DIALOG.MESSAGE')
			.replace('{id}', String(repair?.id ?? ''))
			.replace('{customer}', repair?.customer.fullName ?? '')
	})

	private readonly deleteToastEffect = effect(() => {
		const deleting = this.store.isDeleting()
		const error = this.store.mutationError().delete
		untracked(() => this.deleteToast.handleResult(deleting, error))
	})

	protected readonly columns = computed((): ColumnDef<Repair, unknown>[] => {
		const t = (key: Parameters<AppTranslation['instant']>[0]) => this.translation.instant(key)
		const base: ColumnDef<Repair, unknown>[] = [
			{ id: 'id', header: t('REPAIRS.TABLE.HEADER.ID'), accessorFn: (row) => row.id },
			{ id: 'customer', header: t('REPAIRS.TABLE.HEADER.CUSTOMER'), accessorFn: (row) => row.customer.fullName },
			{
				id: 'manufacturer',
				header: t('REPAIRS.TABLE.HEADER.MANUFACTURER'),
				accessorFn: (row) => row.device.manufacturer,
			},
			{ id: 'model', header: t('REPAIRS.TABLE.HEADER.MODEL'), accessorFn: (row) => row.device.model },
			{ id: 'deviceId', header: t('REPAIRS.TABLE.HEADER.DEVICE_ID'), accessorFn: (row) => row.device.deviceId },
			{ id: 'checkIn', header: t('REPAIRS.TABLE.HEADER.CHECK_IN'), accessorFn: (row) => formatDateTime(row.checkIn) },
			{
				id: 'lastUpdate',
				header: t('REPAIRS.TABLE.HEADER.LAST_UPDATE'),
				accessorFn: (row) => formatDateTime(row.lastUpdate),
			},
			{ id: 'status', header: t('REPAIRS.TABLE.HEADER.STATUS'), accessorFn: (row) => row.status.description },
		]
		return [...base, { id: 'actions', header: '', enableSorting: false }]
	})

	protected onSearchInput(event: Event): void {
		this.store.setSearchQuery((event.target as HTMLInputElement).value)
	}

	protected onStatusFilterChange(event: Event): void {
		const value = (event.target as HTMLSelectElement).value
		this.store.setStatusFilter(value === '' ? null : Number(value))
	}

	protected onShowFinishedChange(event: Event): void {
		this.store.setShowFinished((event.target as HTMLInputElement).checked)
	}

	protected onDateFromChange(event: Event): void {
		this.dateFrom.set((event.target as HTMLInputElement).value)
		this.applyDateRange()
	}

	protected onDateToChange(event: Event): void {
		this.dateTo.set((event.target as HTMLInputElement).value)
		this.applyDateRange()
	}

	protected getRowActions(row: Repair): readonly (readonly RowAction[])[] {
		const view: RowAction[] = [
			{
				label: this.translation.instant('REPAIRS.ACTIONS.VIEW'),
				onSelect: () => void this.router.navigate(['/dashboard/repairs', row.id]),
			},
		]
		const destructive: RowAction[] = this.canManage()
			? [
					{
						label: this.translation.instant('COMMON.DELETE'),
						onSelect: () => this.confirmDelete(row),
						variant: 'destructive',
					},
				]
			: []
		return [view, destructive]
	}

	protected onDeleteConfirmed(): void {
		const repair = this.repairToDelete()
		if (!repair?.id) return
		this.deleteToast.markSubmitted()
		this.store.deleteRepair(repair.id)
		this.repairToDelete.set(null)
	}

	private confirmDelete(repair: Repair): void {
		this.repairToDelete.set(repair)
		this.deleteDialog().show()
	}

	/**
	 * The API filters by range only when both ends are known, so the store is updated once both
	 * dates are set (or both are cleared) and the range is coherent.
	 */
	private applyDateRange(): void {
		const from = parseISO(this.dateFrom())
		const to = parseISO(this.dateTo())
		if (isValid(from) && isValid(to) && from <= to) {
			this.store.setDateRange(from, to)
		} else if (this.dateFrom() === '' && this.dateTo() === '') {
			this.store.setDateRange(null, null)
		}
	}
}
