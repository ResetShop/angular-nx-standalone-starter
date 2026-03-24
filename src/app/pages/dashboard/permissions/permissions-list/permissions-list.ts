import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { Badge } from '@components/badge/badge'
import { DataTable } from '@components/data-table/data-table'
import { DataTableCellDef } from '@components/data-table/data-table-cell-def'
import { PageShell } from '@components/page-shell/page-shell'
import type { IPermission } from '@domain/access/permission.interface'
import { TranslatePipe } from '@providers/i18n/translate.pipe'
import { Translation } from '@providers/i18n/translation'
import { PermissionsStore } from '@store/permissions/permissions.store'
import type { ColumnDef } from '@tanstack/angular-table'

@Component({
	selector: 'app-permissions-list',
	standalone: true,
	imports: [Badge, DataTable, DataTableCellDef, PageShell, TranslatePipe],
	template: `
		<app-page-shell
			[loading]="store.isLoading()"
			[error]="store.readError().list"
			[title]="'PERMISSIONS.PAGE.TITLE' | translate"
		>
			<p pageDescription>
				{{ 'PERMISSIONS.PAGE.DESCRIPTION_INTRO' | translate }}
				<span class="font-mono text-gray-700 dark:text-gray-300">module:resource:action</span>
				{{ 'PERMISSIONS.PAGE.DESCRIPTION_PATTERN' | translate }}
			</p>

			<app-data-table
				[columns]="columns"
				[data]="store.permissions()"
				[loading]="store.isLoading()"
				[grouping]="grouping"
				[caption]="'PERMISSIONS.TABLE.CAPTION' | translate"
			>
				<ng-template appDataTableCellDef="identifier" let-value>
					<span appBadge variant="secondary">{{ value }}</span>
				</ng-template>
			</app-data-table>
		</app-page-shell>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PermissionsList {
	protected readonly store = inject(PermissionsStore)
	private readonly translation = inject(Translation)

	protected readonly columns: ColumnDef<IPermission, unknown>[] = [
		{ accessorKey: 'resource', header: this.translation.instant('PERMISSIONS.TABLE.HEADER.RESOURCE') },
		{ accessorKey: 'action', header: this.translation.instant('PERMISSIONS.TABLE.HEADER.ACTION') },
		{ accessorKey: 'identifier', header: this.translation.instant('PERMISSIONS.TABLE.HEADER.IDENTIFIER') },
		{ accessorKey: 'description', header: this.translation.instant('PERMISSIONS.TABLE.HEADER.DESCRIPTION') },
	]

	protected readonly grouping = ['resource']
}
