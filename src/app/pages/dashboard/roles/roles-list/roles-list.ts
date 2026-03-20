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
import { ADMIN_ROLE_PERMISSIONS } from '@contracts/permission/permission.constants'
import type { IRole } from '@domain/access/role.interface'
import { AuthStore } from '@store/auth/auth.store'
import { RolesStore } from '@store/roles/roles.store'
import { createMutationToast } from '@store/ui/mutation-toast'
import type { ColumnDef } from '@tanstack/angular-table'
import { CreateRoleDrawer } from '../create-role-drawer/create-role-drawer'
import { EditRoleDrawer } from '../edit-role-drawer/edit-role-drawer'

@Component({
	selector: 'app-roles-list',
	standalone: true,
	imports: [
		Badge,
		Button,
		ConfirmDialog,
		CreateRoleDrawer,
		DataTable,
		DataTableCellDef,
		EditRoleDrawer,
		PageShell,
		Pagination,
	],
	template: `
		<app-page-shell [loading]="store.isLoadingList()" [error]="store.readError().list" title="Roles">
			<p pageDescription>Manage system roles and their associated permissions.</p>

			<div pageActionsSkeleton class="flex items-center justify-between gap-4" data-testid="roles-actions-skeleton">
				<div class="bg-muted h-9 w-full max-w-sm animate-pulse rounded-md"></div>
				<div class="bg-muted h-9 w-24 animate-pulse rounded-md"></div>
			</div>

			<div pageActions class="flex items-center justify-between gap-4">
				<input
					(input)="onSearchInput($event)"
					type="search"
					placeholder="Search roles..."
					class="border-input bg-background text-foreground focus:border-ring focus:ring-ring h-9 w-full max-w-sm rounded-md border px-3 text-sm focus:ring-1 focus:outline-none"
				/>
				@if (canCreate()) {
					<button (click)="createDrawer.open()" appButton>Create Role</button>
				}
			</div>

			<app-data-table [columns]="columns()" [data]="store.roles()" [loading]="store.isMutating()" caption="Roles list">
				<ng-template appDataTableCellDef="code" let-value>
					<span appBadge variant="secondary">{{ value }}</span>
				</ng-template>

				<ng-template appDataTableCellDef="actions" let-value let-row="row">
					<div class="flex gap-2">
						@if (canUpdate()) {
							<button (click)="editDrawer.open(row.id)" appButton variant="ghost" size="sm">Edit</button>
						}
						@if (canDelete() && row.removable) {
							<button (click)="confirmDelete(row)" appButton variant="ghost" size="sm" class="text-destructive">
								Delete
							</button>
						}
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

		@if (canCreate()) {
			<app-create-role-drawer #createDrawer />
		}
		@if (canUpdate()) {
			<app-edit-role-drawer #editDrawer />
		}

		@if (canDelete()) {
			<app-confirm-dialog
				(confirmed)="onDeleteConfirmed()"
				[message]="deleteMessage()"
				#deleteDialog
				title="Delete Role"
				confirmText="Delete"
				confirmVariant="destructive"
			/>
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RolesList {
	protected readonly store = inject(RolesStore)

	private readonly authStore = inject(AuthStore)

	protected readonly canCreate = computed(
		() => this.authStore.currentUser()?.hasPermissionByIdentifier(ADMIN_ROLE_PERMISSIONS.CREATE) ?? false,
	)
	protected readonly canUpdate = computed(
		() => this.authStore.currentUser()?.hasPermissionByIdentifier(ADMIN_ROLE_PERMISSIONS.UPDATE) ?? false,
	)
	protected readonly canDelete = computed(
		() => this.authStore.currentUser()?.hasPermissionByIdentifier(ADMIN_ROLE_PERMISSIONS.DELETE) ?? false,
	)

	private readonly deleteDialog = viewChild<ConfirmDialog>('deleteDialog')
	private readonly deleteToast = createMutationToast('Role deleted successfully.')

	protected readonly roleToDelete = signal<IRole | null>(null)
	protected readonly deleteMessage = computed(() => {
		const name = this.roleToDelete()?.name ?? ''
		return `Are you sure you want to delete the role '${name}'? This action cannot be undone.`
	})

	private readonly deleteToastEffect = effect(() => {
		const deleting = this.store.isDeleting()
		const error = this.store.mutationError().delete
		untracked(() => this.deleteToast.handleResult(deleting, error))
	})

	protected readonly columns = computed((): ColumnDef<IRole, unknown>[] => {
		const base: ColumnDef<IRole, unknown>[] = [
			{ accessorKey: 'name', header: 'Name' },
			{ accessorKey: 'code', header: 'Code' },
			{ accessorKey: 'description', header: 'Description' },
		]
		if (this.canUpdate() || this.canDelete()) {
			return [...base, { id: 'actions', header: '', enableSorting: false }]
		}
		return base
	})

	protected onSearchInput(event: Event): void {
		const input = event.target as HTMLInputElement
		this.store.setSearchQuery(input.value)
	}

	protected confirmDelete(role: IRole): void {
		this.roleToDelete.set(role)
		this.deleteDialog()?.show()
	}

	protected onDeleteConfirmed(): void {
		const role = this.roleToDelete()
		if (role) {
			this.deleteToast.markSubmitted()
			this.store.deleteRole(role.id)
			this.roleToDelete.set(null)
		}
	}
}
