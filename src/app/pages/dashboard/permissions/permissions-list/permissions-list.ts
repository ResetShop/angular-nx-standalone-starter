import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Badge } from '@components/badge/badge';
import { DataTable } from '@components/data-table/data-table';
import { DataTableCellDef } from '@components/data-table/data-table-cell-def';
import type { PermissionData } from '@contracts/role/role.types';
import { PermissionsStore } from '@store/permissions/permissions.store';
import type { ColumnDef } from '@tanstack/angular-table';

@Component({
	selector: 'app-permissions-list',
	standalone: true,
	imports: [Badge, DataTable, DataTableCellDef],
	template: `
		<div class="space-y-6">
			<div>
				<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Permissions</h1>
				<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
					View all system permissions organized by resource. Each identifier follows the
					<span class="font-mono text-gray-700 dark:text-gray-300">module:resource:action</span>
					pattern — e.g.,
					<span class="font-mono text-gray-700 dark:text-gray-300">admin:users:create</span>
					.
				</p>
			</div>

			<div class="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
				<app-data-table
					[columns]="columns"
					[data]="store.permissions()"
					[loading]="store.isLoading()"
					[grouping]="grouping"
					caption="Permissions grouped by resource"
				>
					<ng-template appDataTableCellDef="identifier" let-value>
						<span appBadge variant="secondary">{{ value }}</span>
					</ng-template>
				</app-data-table>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PermissionsList {
	readonly store = inject(PermissionsStore);

	readonly columns: ColumnDef<PermissionData, unknown>[] = [
		{ accessorKey: 'resource', header: 'Resource' },
		{ accessorKey: 'action', header: 'Action' },
		{ accessorFn: (row) => row.name, id: 'identifier', header: 'Identifier' },
		{ accessorKey: 'description', header: 'Description' },
	];

	readonly grouping = ['resource'];
}
