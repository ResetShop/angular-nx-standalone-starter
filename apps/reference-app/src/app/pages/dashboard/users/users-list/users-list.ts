import {
	ChangeDetectionStrategy,
	Component,
	computed,
	effect,
	inject,
	signal,
	untracked,
	viewChild,
} from '@angular/core'
import { PageShell } from '@components/page-shell/page-shell'
import { UserStatus } from '@contracts/user/user.constants'
import { HasPermissionDirective } from '@directives/has-permission.directive'
import type { IManagedUser } from '@domain/user-management/managed-user.interface'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import { Badge } from '@resetshop/ui/badge/badge'
import { Button } from '@resetshop/ui/button/button'
import { ConfirmDialog } from '@resetshop/ui/confirm-dialog/confirm-dialog'
import { DataTable } from '@resetshop/ui/data-table/data-table'
import { DataTableCellDef } from '@resetshop/ui/data-table/data-table-cell-def'
import { Pagination } from '@resetshop/ui/pagination/pagination'
import { AuthStore } from '@store/auth/auth.store'
import { createMutationToast } from '@store/ui/mutation-toast'
import { UsersStore } from '@store/users/users.store'
import type { ColumnDef } from '@tanstack/angular-table'
import { CreateUserDrawer } from '../create-user-drawer/create-user-drawer'
import { EditUserDrawer } from '../edit-user-drawer/edit-user-drawer'

@Component({
	selector: 'app-users-list',
	standalone: true,
	imports: [
		Badge,
		Button,
		ConfirmDialog,
		CreateUserDrawer,
		DataTable,
		DataTableCellDef,
		EditUserDrawer,
		HasPermissionDirective,
		PageShell,
		Pagination,
		TranslatePipe,
	],
	template: `
		<app-page-shell
			[loading]="store.isLoadingList()"
			[error]="store.readError().list"
			[title]="'USERS.PAGE.TITLE' | translate"
		>
			<p pageDescription>{{ 'USERS.PAGE.DESCRIPTION' | translate }}</p>

			<div pageActionsSkeleton class="flex items-center justify-between gap-4" data-testid="users-actions-skeleton">
				<div class="bg-muted h-9 w-full max-w-sm animate-pulse rounded-md"></div>
				<div class="bg-muted h-9 w-24 animate-pulse rounded-md"></div>
			</div>

			<div pageActions class="flex items-center justify-between gap-4">
				<input
					(input)="onSearchInput($event)"
					[placeholder]="'USERS.PAGE.SEARCH' | translate"
					type="search"
					class="border-input bg-background text-foreground focus:border-ring focus:ring-ring h-9 w-full max-w-sm rounded-md border px-3 text-base focus:ring-1 focus:outline-none sm:text-sm"
				/>
				<button (click)="createDrawer.open()" *hasPermission="'admin:users:create'" appButton>
					{{ 'USERS.PAGE.CREATE_BUTTON' | translate }}
				</button>
			</div>

			<app-data-table
				[columns]="columns()"
				[data]="store.users()"
				[loading]="store.isMutating()"
				[caption]="'USERS.TABLE.CAPTION' | translate"
			>
				<ng-template appDataTableCellDef="status" let-value>
					<span [variant]="value === UserStatus.ACTIVE ? 'default' : 'destructive'" appBadge>
						{{ value.charAt(0).toUpperCase() + value.slice(1) }}
					</span>
				</ng-template>

				<ng-template appDataTableCellDef="actions" let-value let-row="row">
					<div class="flex gap-2">
						<button
							(click)="editDrawer.open(row.id)"
							*hasPermission="'admin:users:update'"
							appButton
							variant="ghost"
							size="sm"
						>
							{{ 'COMMON.EDIT' | translate }}
						</button>
						<button
							(click)="confirmDelete(row)"
							*hasPermission="'admin:users:delete'"
							appButton
							variant="ghost"
							size="sm"
							class="text-destructive"
						>
							{{ 'COMMON.DELETE' | translate }}
						</button>
					</div>
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

		<app-create-user-drawer #createDrawer />
		<app-edit-user-drawer #editDrawer />

		<app-confirm-dialog
			(confirmed)="onDeleteConfirmed()"
			[message]="deleteMessage()"
			[title]="'USERS.PAGE.DELETE_DIALOG.TITLE' | translate"
			[confirmText]="'COMMON.DELETE' | translate"
			#deleteDialog
			confirmVariant="destructive"
		/>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class UsersList {
	protected readonly store = inject(UsersStore)
	protected readonly UserStatus = UserStatus

	private readonly authStore = inject(AuthStore)
	private readonly translation = inject(Translation)

	private readonly deleteDialog = viewChild.required<ConfirmDialog>('deleteDialog')
	private readonly deleteToast = createMutationToast(this.translation.instant('USERS.DELETE_TOAST'))

	protected readonly userToDelete = signal<IManagedUser | null>(null)
	protected readonly deleteMessage = computed(() => {
		const name = this.userToDelete()?.fullName ?? ''
		return this.translation.instant('USERS.PAGE.DELETE_DIALOG.MESSAGE').replace('{name}', name)
	})

	private readonly deleteToastEffect = effect(() => {
		const deleting = this.store.isDeleting()
		const error = this.store.mutationError().delete
		untracked(() => this.deleteToast.handleResult(deleting, error))
	})

	protected readonly columns = computed((): ColumnDef<IManagedUser, unknown>[] => {
		const base: ColumnDef<IManagedUser, unknown>[] = [
			{ accessorKey: 'fullName', header: this.translation.instant('USERS.TABLE.HEADER.NAME') },
			{ accessorKey: 'email', header: this.translation.instant('USERS.TABLE.HEADER.EMAIL') },
			{ accessorKey: 'status', header: this.translation.instant('USERS.TABLE.HEADER.STATUS') },
			{
				id: 'roles',
				header: this.translation.instant('USERS.TABLE.HEADER.ROLES'),
				accessorFn: (row) => (row.roles.length ? row.roles.map((r) => r.name).join(', ') : '\u2014'),
			},
		]
		const user = this.authStore.currentUser()
		if (user?.hasPermission('admin:users:update') || user?.hasPermission('admin:users:delete')) {
			return [...base, { id: 'actions', header: '', enableSorting: false }]
		}
		return base
	})

	protected onSearchInput(event: Event): void {
		const input = event.target as HTMLInputElement
		this.store.setSearchQuery(input.value)
	}

	protected confirmDelete(user: IManagedUser): void {
		this.userToDelete.set(user)
		this.deleteDialog().show()
	}

	protected onDeleteConfirmed(): void {
		const user = this.userToDelete()
		if (user) {
			this.deleteToast.markSubmitted()
			this.store.deleteUser(user.id)
			this.userToDelete.set(null)
		}
	}
}
