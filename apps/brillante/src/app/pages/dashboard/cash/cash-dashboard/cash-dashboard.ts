import { Component, computed, effect, inject, signal, untracked, viewChild } from '@angular/core'
import { PageShell } from '@components/page-shell/page-shell'
import { Permission, UserRole } from '@contracts/permission/permission.constants'
import { oldestBrowsableDay, parseDateInputValue, toDateInputValue } from '@domain/cash/cash-date'
import { toSignedAmount } from '@domain/cash/cash-totals'
import type { CashTransaction } from '@domain/cash/cash-transaction.model'
import { formatMoney } from '@domain/cash/money'
import { AppTranslation } from '@providers/i18n/app-translation'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Alert, AlertDescription } from '@resetshop/ui/alert/alert'
import { Button } from '@resetshop/ui/button/button'
import { ConfirmDialog } from '@resetshop/ui/confirm-dialog/confirm-dialog'
import { DataTable } from '@resetshop/ui/data-table/data-table'
import { DataTableCellDef } from '@resetshop/ui/data-table/data-table-cell-def'
import { AuthStore } from '@store/auth/auth.store'
import { CashStore } from '@store/cash/cash.store'
import { createMutationToast } from '@store/ui/mutation-toast'
import type { ColumnDef } from '@tanstack/angular-table'
import { format } from 'date-fns'
import { CashTotalsSummary } from '../cash-totals-summary/cash-totals-summary'
import { CashTransactionDetails } from '../cash-transaction-details/cash-transaction-details'
import { CashTransactionDrawer } from '../cash-transaction-drawer/cash-transaction-drawer'

@Component({
	selector: 'app-cash-dashboard',
	standalone: true,
	imports: [
		Alert,
		AlertDescription,
		Button,
		CashTotalsSummary,
		CashTransactionDetails,
		CashTransactionDrawer,
		ConfirmDialog,
		DataTable,
		DataTableCellDef,
		PageShell,
		TranslatePipe,
	],
	template: `
		<app-page-shell [loading]="shellLoading()" [error]="store.readError().list" [title]="'CASH.PAGE.TITLE' | translate">
			<p pageDescription>{{ 'CASH.PAGE.DESCRIPTION' | translate }}</p>

			<div
				pageActionsSkeleton
				class="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end"
				data-testid="cash-actions-skeleton"
			>
				<div class="bg-muted h-9 w-full animate-pulse rounded-md sm:w-40"></div>
				<div class="bg-muted h-9 w-full animate-pulse rounded-md sm:w-40"></div>
				<div class="bg-muted h-9 w-full animate-pulse rounded-md sm:w-32"></div>
			</div>

			<div pageActions class="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
				<label class="text-foreground flex flex-col gap-1 text-sm font-medium">
					<span>{{ 'CASH.FILTERS.FROM' | translate }}</span>
					<input
						(change)="onFromChange($event)"
						[value]="fromValue()"
						[min]="minDate()"
						[max]="maxDate"
						[disabled]="!canNavigateDates()"
						[class]="dateInputClasses"
						type="date"
					/>
				</label>
				<label class="text-foreground flex flex-col gap-1 text-sm font-medium">
					<span>{{ 'CASH.FILTERS.TO' | translate }}</span>
					<input
						(change)="onToChange($event)"
						[value]="toValue()"
						[min]="minDate()"
						[max]="maxDate"
						[disabled]="!canNavigateDates()"
						[class]="dateInputClasses"
						type="date"
					/>
				</label>
				<button (click)="store.setToday()" appButton variant="outline" type="button">
					{{ 'CASH.FILTERS.TODAY' | translate }}
				</button>

				@if (canManage() && store.canOpenRegister()) {
					<button (click)="onOpenRegister()" [disabled]="store.isOpening()" appButton type="button">
						{{ 'CASH.ACTIONS.OPEN_REGISTER' | translate }}
					</button>
				}
				@if (canManage() && store.canOperateRegister()) {
					<button (click)="transactionDrawer().openCreate()" appButton type="button">
						{{ 'CASH.ACTIONS.CREATE' | translate }}
					</button>
					<button
						(click)="closeDialog().show()"
						[disabled]="store.isClosing()"
						appButton
						variant="outline"
						type="button"
					>
						{{ 'CASH.ACTIONS.CLOSE_REGISTER' | translate }}
					</button>
				}
			</div>

			<app-cash-totals-summary [totals]="store.totals()" />

			@if (store.transactions().length === 0) {
				<div appAlert>
					<p appAlertDescription>
						{{ 'CASH.TABLE.EMPTY' | translate }}
						@if (store.canOpenRegister()) {
							{{ 'CASH.TABLE.EMPTY_TODAY_HINT' | translate }}
						}
					</p>
				</div>
			} @else {
				<div class="grid gap-4 sm:gap-6 lg:grid-cols-3">
					<div class="min-w-0 lg:col-span-2">
						<app-data-table
							[columns]="columns()"
							[data]="rows()"
							[loading]="store.isLoadingList()"
							[caption]="'CASH.TABLE.CAPTION' | translate"
						>
							<ng-template appDataTableCellDef="id" let-value let-row="row">
								<button
									(click)="store.selectTransaction(row)"
									[attr.aria-label]="viewDetailsLabel(row)"
									[attr.aria-pressed]="row.id === store.selectedTransaction()?.id"
									class="text-foreground font-medium underline-offset-2 hover:underline"
									type="button"
								>
									{{ value }}
								</button>
							</ng-template>
						</app-data-table>
					</div>
					<app-cash-transaction-details
						(editRequested)="transactionDrawer().openEdit($event)"
						(deleteRequested)="deleteDialog().show()"
						[transaction]="store.selectedTransaction()"
						[canManage]="canManage()"
						class="lg:col-span-1 lg:self-start"
					/>
				</div>
			}
		</app-page-shell>

		<app-cash-transaction-drawer #transactionDrawerRef />

		<app-confirm-dialog
			(confirmed)="onDeleteConfirmed()"
			[title]="'CASH.DIALOGS.DELETE.TITLE' | translate"
			[message]="deleteMessage()"
			[confirmText]="'CASH.ACTIONS.DELETE' | translate"
			#deleteDialogRef
			confirmVariant="destructive"
		/>

		<app-confirm-dialog
			(confirmed)="onCloseConfirmed()"
			[title]="'CASH.DIALOGS.CLOSE_REGISTER.TITLE' | translate"
			[message]="'CASH.DIALOGS.CLOSE_REGISTER.MESSAGE' | translate"
			[confirmText]="'CASH.DIALOGS.CLOSE_REGISTER.CONFIRM' | translate"
			#closeDialogRef
		/>
	`,
})
export default class CashDashboard {
	protected readonly store = inject(CashStore)
	private readonly authStore = inject(AuthStore)
	private readonly translation = inject(AppTranslation)

	protected readonly dateInputClasses =
		'border-input bg-background text-foreground focus:border-ring focus:ring-ring h-9 rounded-md border px-3 text-base focus:ring-1 focus:outline-none disabled:opacity-50 sm:text-sm'
	protected readonly transactionDrawer = viewChild.required<CashTransactionDrawer>('transactionDrawerRef')
	protected readonly deleteDialog = viewChild.required<ConfirmDialog>('deleteDialogRef')
	protected readonly closeDialog = viewChild.required<ConfirmDialog>('closeDialogRef')

	private readonly deleteToast = createMutationToast(this.translation.instant('CASH.TOASTS.DELETED'))
	private readonly openToast = createMutationToast(this.translation.instant('CASH.TOASTS.OPENED'))
	private readonly closeToast = createMutationToast(this.translation.instant('CASH.TOASTS.CLOSED'))

	/** The shell only blocks the page on the first load; later period changes refresh in place. */
	private readonly hasLoaded = signal(false)
	protected readonly shellLoading = computed(() => !this.hasLoaded() && this.store.isLoadingList())

	private readonly markLoadedEffect = effect(() => {
		if (!this.store.isLoadingList()) untracked(() => this.hasLoaded.set(true))
	})

	private readonly currentUser = computed(() => this.authStore.currentUser())
	protected readonly canManage = computed(() => this.currentUser()?.hasPermission(Permission.CASH_MANAGE) ?? false)
	protected readonly canNavigateDates = computed(() => {
		const user = this.currentUser()
		return [UserRole.ADMIN, UserRole.OWNER, UserRole.COUNTER_CLERK].some((role) => user?.hasRole(role))
	})
	protected readonly minDate = computed(() =>
		this.currentUser()?.hasRole(UserRole.ADMIN) ? '2016-01-01' : toDateInputValue(oldestBrowsableDay()),
	)
	protected readonly maxDate = toDateInputValue(new Date())
	protected readonly fromValue = computed(() => toDateInputValue(this.store.dateFrom()))
	protected readonly toValue = computed(() => toDateInputValue(this.store.dateTo()))

	protected readonly rows = computed(() =>
		[...this.store.transactions()].sort((a, b) => a.date.getTime() - b.date.getTime()),
	)

	protected readonly deleteMessage = computed(() =>
		this.translation
			.instant('CASH.DIALOGS.DELETE.MESSAGE')
			.replace('{id}', String(this.store.selectedTransaction()?.id ?? '')),
	)

	protected readonly columns = computed((): ColumnDef<CashTransaction, unknown>[] => [
		{ accessorKey: 'id', header: this.translation.instant('CASH.TABLE.HEADER.ID') },
		{
			id: 'concept',
			header: this.translation.instant('CASH.TABLE.HEADER.CONCEPT'),
			accessorFn: (row) => row.concept.parent?.description ?? row.concept.description,
		},
		{
			id: 'subconcept',
			header: this.translation.instant('CASH.TABLE.HEADER.SUBCONCEPT'),
			accessorFn: (row) => (row.concept.parent ? row.concept.description : '—'),
		},
		{
			id: 'income',
			header: this.translation.instant('CASH.TABLE.HEADER.INCOME'),
			accessorFn: (row) => (row.kind === 'income' ? formatMoney(row.amount) : ''),
			enableSorting: false,
		},
		{
			id: 'expense',
			header: this.translation.instant('CASH.TABLE.HEADER.EXPENSE'),
			accessorFn: (row) => (row.kind === 'expense' ? formatMoney(row.amount) : ''),
			enableSorting: false,
		},
		{
			id: 'balance',
			header: this.translation.instant('CASH.TABLE.HEADER.BALANCE'),
			accessorFn: (row) => formatMoney(toSignedAmount(row)),
			enableSorting: false,
		},
		{
			id: 'time',
			header: this.translation.instant('CASH.TABLE.HEADER.TIME'),
			accessorFn: (row) => format(row.date, 'HH:mm'),
		},
	])

	private readonly deleteToastEffect = effect(() => {
		const deleting = this.store.isDeleting()
		const error = this.store.mutationError().delete
		untracked(() => this.deleteToast.handleResult(deleting, error))
	})

	private readonly openToastEffect = effect(() => {
		const opening = this.store.isOpening()
		const error = this.store.mutationError().open
		untracked(() => this.openToast.handleResult(opening, error))
	})

	private readonly closeToastEffect = effect(() => {
		const closing = this.store.isClosing()
		const error = this.store.mutationError().close
		untracked(() => this.closeToast.handleResult(closing, error))
	})

	protected viewDetailsLabel(row: CashTransaction): string {
		return this.translation.instant('CASH.TABLE.VIEW_DETAILS').replace('{id}', String(row.id))
	}

	protected onFromChange(event: Event): void {
		const from = parseDateInputValue((event.target as HTMLInputElement).value)
		if (from) this.store.setDateRange(from, this.store.dateTo())
	}

	protected onToChange(event: Event): void {
		const to = parseDateInputValue((event.target as HTMLInputElement).value)
		if (to) this.store.setDateRange(this.store.dateFrom(), to)
	}

	protected onOpenRegister(): void {
		this.openToast.markSubmitted()
		this.store.openRegister()
	}

	protected onCloseConfirmed(): void {
		this.closeToast.markSubmitted()
		this.store.closeRegister()
	}

	protected onDeleteConfirmed(): void {
		const selected = this.store.selectedTransaction()
		if (!selected) return
		this.deleteToast.markSubmitted()
		this.store.deleteTransaction(selected.id)
	}
}
