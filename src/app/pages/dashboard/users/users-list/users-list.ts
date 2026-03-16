import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core'
import { Badge } from '@components/badge/badge'
import { Button } from '@components/button/button'
import { ConfirmDialog } from '@components/confirm-dialog/confirm-dialog'
import { DataTable } from '@components/data-table/data-table'
import { DataTableCellDef } from '@components/data-table/data-table-cell-def'
import { PageShell } from '@components/page-shell/page-shell'
import { Pagination } from '@components/pagination/pagination'
import type { IManagedUser, IManagedUserRole } from '@domain/user-management/managed-user.interface'
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

			<div class="flex items-center justify-between gap-4">
				<input
					(input)="onSearchInput($event)"
					type="search"
					placeholder="Search users..."
					class="border-input bg-background text-foreground focus:border-ring focus:ring-ring h-9 w-full max-w-sm rounded-md border px-3 text-sm focus:ring-1 focus:outline-none"
				/>
				<button (click)="createDrawer.open()" appButton>Create User</button>
			</div>

			<div class="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
				<app-data-table [columns]="columns" [data]="store.users()" [loading]="store.isMutating()" caption="Users list">
					<ng-template appDataTableCellDef="status" let-value>
						<span [variant]="value === 'active' ? 'default' : 'destructive'" appBadge>
							{{ value.charAt(0).toUpperCase() + value.slice(1) }}
						</span>
					</ng-template>

					<ng-template appDataTableCellDef="roles" let-value>
						{{ formatRoles(value) }}
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
			</div>

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

	private readonly deleteDialog = viewChild.required<ConfirmDialog>('deleteDialog')

	protected readonly userToDelete = signal<IManagedUser | null>(null)
	protected readonly deleteMessage = computed(() => {
		const name = this.userToDelete()?.fullName ?? ''
		return `Are you sure you want to delete the user '${name}'? This action cannot be undone.`
	})

	protected readonly columns: ColumnDef<IManagedUser, unknown>[] = [
		{ accessorKey: 'fullName', header: 'Name' },
		{ accessorKey: 'email', header: 'Email' },
		{ accessorKey: 'status', header: 'Status' },
		{ accessorKey: 'roles', header: 'Roles' },
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
			this.store.deleteUser(user.id)
			this.userToDelete.set(null)
		}
	}

	protected formatRoles(roles: readonly IManagedUserRole[]): string {
		if (roles.length === 0) return '\u2014'
		return roles.map((r) => r.name).join(', ')
	}
}
