import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Badge } from '@components/badge/badge';
import { DataTable } from '@components/data-table/data-table';
import { DataTableCellDef } from '@components/data-table/data-table-cell-def';
import { PageShell } from '@components/page-shell/page-shell';
import type { IPermission } from '@domain/access/permission.interface';
import { PermissionsStore } from '@store/permissions/permissions.store';
import type { ColumnDef } from '@tanstack/angular-table';

@Component({
	selector: 'app-permissions-list',
	standalone: true,
	imports: [Badge, DataTable, DataTableCellDef, PageShell],
	template: `
		<app-page-shell [loading]="store.isLoading()" [error]="store.readError().list" title="Permissions">
			<p pageDescription>
				View all system permissions organized by resource. Each identifier follows the
				<span class="font-mono text-gray-700 dark:text-gray-300">module:resource:action</span>
				pattern — e.g.,
				<span class="font-mono text-gray-700 dark:text-gray-300">admin:users:create</span>
				.
			</p>

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
		</app-page-shell>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PermissionsList {
	protected readonly store = inject(PermissionsStore);

	protected readonly columns: ColumnDef<IPermission, unknown>[] = [
		{ accessorKey: 'resource', header: 'Resource' },
		{ accessorKey: 'action', header: 'Action' },
		{ accessorKey: 'identifier', header: 'Identifier' },
		{ accessorKey: 'description', header: 'Description' },
	];

	protected readonly grouping = ['resource'];
}
