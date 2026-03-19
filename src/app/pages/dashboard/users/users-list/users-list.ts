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
import { Badge } from '@components/badge/badge'
import { Button } from '@components/button/button'
import { ConfirmDialog } from '@components/confirm-dialog/confirm-dialog'
import { DataTable } from '@components/data-table/data-table'
import { DataTableCellDef } from '@components/data-table/data-table-cell-def'
import { PageShell } from '@components/page-shell/page-shell'
import { Pagination } from '@components/pagination/pagination'
import { UserStatus } from '@contracts/user/user.constants'
import type { IManagedUser } from '@domain/user-management/managed-user.interface'
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
		PageShell,
		Pagination,
	],
	template: `
		<app-page-shell [loading]="store.isLoadingList()" [error]="store.readError().list" title="Users">
			<p pageDescription>Manage system users, their roles, and account status.</p>

			<div pageActions class="flex items-center justify-between gap-4">
				<input
					(input)="onSearchInput($event)"
					type="search"
					placeholder="Search users..."
					class="border-input bg-background text-foreground focus:border-ring focus:ring-ring h-9 w-full max-w-sm rounded-md border px-3 text-sm focus:ring-1 focus:outline-none"
				/>
				<button (click)="createDrawer.open()" appButton>Create User</button>
			</div>

			<app-data-table [columns]="columns" [data]="store.users()" [loading]="store.isMutating()" caption="Users list">
				<ng-template appDataTableCellDef="status" let-value>
					<span [variant]="value === UserStatus.ACTIVE ? 'default' : 'destructive'" appBadge>
						{{ value.charAt(0).toUpperCase() + value.slice(1) }}
					</span>
				</ng-template>

				<ng-template appDataTableCellDef="actions" let-value let-row="row">
					<div class="flex gap-2">
						<button (click)="editDrawer.open(row.id)" appButton variant="ghost" size="sm">Edit</button>
						<button (click)="confirmDelete(row)" appButton variant="ghost" size="sm" class="text-destructive">
							Delete
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
			#deleteDialog
			title="Delete User"
			confirmText="Delete"
			confirmVariant="destructive"
		/>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class UsersList {
	protected readonly store = inject(UsersStore)
	protected readonly UserStatus = UserStatus

	private readonly deleteDialog = viewChild.required<ConfirmDialog>('deleteDialog')
	private readonly deleteToast = createMutationToast('User deleted successfully.')

	protected readonly userToDelete = signal<IManagedUser | null>(null)
	protected readonly deleteMessage = computed(() => {
		const name = this.userToDelete()?.fullName ?? ''
		return `Are you sure you want to delete the user '${name}'? This action cannot be undone.`
	})

	private readonly deleteToastEffect = effect(() => {
		const deleting = this.store.isDeleting()
		const error = this.store.mutationError().delete
		untracked(() => this.deleteToast.handleResult(deleting, error))
	})

	protected readonly columns: ColumnDef<IManagedUser, unknown>[] = [
		{ accessorKey: 'fullName', header: 'Name' },
		{ accessorKey: 'email', header: 'Email' },
		{ accessorKey: 'status', header: 'Status' },
		{
			id: 'roles',
			header: 'Roles',
			accessorFn: (row) => (row.roles.length ? row.roles.map((r) => r.name).join(', ') : '\u2014'),
		},
		{ id: 'actions', header: '', enableSorting: false },
	]

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
