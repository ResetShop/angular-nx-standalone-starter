import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { Badge } from '@components/badge/badge';
import { Button } from '@components/button/button';
import { ConfirmDialog } from '@components/confirm-dialog/confirm-dialog';
import { DataTable } from '@components/data-table/data-table';
import { DataTableCellDef } from '@components/data-table/data-table-cell-def';
import { PageShell } from '@components/page-shell/page-shell';
import { Pagination } from '@components/pagination/pagination';
import type { RoleData } from '@contracts/role/role.types';
import { RolesStore } from '@store/roles/roles.store';
import type { ColumnDef } from '@tanstack/angular-table';
import { CreateRoleDrawer } from '../create-role-drawer/create-role-drawer';
import { EditRoleDrawer } from '../edit-role-drawer/edit-role-drawer';

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

			<div class="flex items-center justify-between gap-4">
				<input
					(input)="onSearchInput($event)"
					type="search"
					placeholder="Search roles..."
					class="border-input bg-background text-foreground focus:border-ring focus:ring-ring h-9 w-full max-w-sm rounded-md border px-3 text-sm focus:ring-1 focus:outline-none"
				/>
				<button (click)="createDrawer.open()" appButton>Create Role</button>
			</div>

			<div class="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
				<app-data-table [columns]="columns" [data]="store.roles()" [loading]="store.isCreating()" caption="Roles list">
					<ng-template appDataTableCellDef="code" let-value>
						<span appBadge variant="secondary">{{ value }}</span>
					</ng-template>

					<ng-template appDataTableCellDef="actions" let-value let-row="row">
						<div class="flex gap-2">
							<button (click)="editDrawer.open(row.id)" appButton variant="ghost" size="sm">Edit</button>
							@if (row.removable) {
								<button (click)="confirmDelete(row)" appButton variant="ghost" size="sm" class="text-destructive">
									Delete
								</button>
							}
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

		<app-create-role-drawer #createDrawer />
		<app-edit-role-drawer #editDrawer />

		<app-confirm-dialog
			(confirmed)="onDeleteConfirmed()"
			[message]="deleteMessage()"
			#deleteDialog
			title="Delete Role"
			confirmText="Delete"
			confirmVariant="destructive"
		/>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RolesList {
	protected readonly store = inject(RolesStore);

	private readonly deleteDialog = viewChild.required<ConfirmDialog>('deleteDialog');

	protected readonly roleToDelete = signal<RoleData | null>(null);
	protected readonly deleteMessage = computed(() => {
		const name = this.roleToDelete()?.name ?? '';
		return `Are you sure you want to delete the role '${name}'? This action cannot be undone.`;
	});

	protected readonly columns: ColumnDef<RoleData, unknown>[] = [
		{ accessorKey: 'name', header: 'Name' },
		{ accessorKey: 'code', header: 'Code' },
		{ accessorKey: 'description', header: 'Description' },
		{ id: 'actions', header: '', enableSorting: false },
	];

	protected onSearchInput(event: Event): void {
		const input = event.target as HTMLInputElement;
		this.store.setSearchQuery(input.value);
	}

	protected confirmDelete(role: RoleData): void {
		this.roleToDelete.set(role);
		this.deleteDialog().show();
	}

	protected onDeleteConfirmed(): void {
		const role = this.roleToDelete();
		if (role) {
			this.store.deleteRole(role.id);
			this.roleToDelete.set(null);
		}
	}
}
