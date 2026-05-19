import { BreakpointObserver } from '@angular/cdk/layout'
import { isPlatformBrowser } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject, PLATFORM_ID, signal, type Signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { PageShell } from '@components/page-shell/page-shell'
import type { IPermission } from '@domain/access/permission.interface'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import { Badge } from '@resetshop/ui/badge/badge'
import { DataTable } from '@resetshop/ui/data-table/data-table'
import { DataTableCardDef } from '@resetshop/ui/data-table/data-table-card-def'
import { DataTableCellDef } from '@resetshop/ui/data-table/data-table-cell-def'
import { PermissionsStore } from '@store/permissions/permissions.store'
import type { ColumnDef } from '@tanstack/angular-table'
import { map } from 'rxjs'

@Component({
	selector: 'app-permissions-list',
	standalone: true,
	imports: [Badge, DataTable, DataTableCardDef, DataTableCellDef, PageShell, TranslatePipe],
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
				[displayMode]="isMobileViewport() ? 'cards' : 'table'"
			>
				<ng-template appDataTableCellDef="identifier" let-value>
					<span appBadge variant="secondary">{{ value }}</span>
				</ng-template>

				<!-- Card mode flattens the 'resource' grouping intentionally — group headers are a table-mode feature. -->
				<ng-template appDataTableCardDef let-row>
					<div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
						<div class="flex items-start justify-between gap-2">
							<p class="font-medium text-gray-900 dark:text-gray-100">{{ row.resource }} · {{ row.action }}</p>
							<span appBadge variant="secondary">{{ row.identifier }}</span>
						</div>
						@if (row.description) {
							<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">{{ row.description }}</p>
						}
					</div>
				</ng-template>
			</app-data-table>
		</app-page-shell>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PermissionsList {
	protected readonly store = inject(PermissionsStore)
	private readonly translation = inject(Translation)
	private readonly platformId = inject(PLATFORM_ID)

	protected readonly isMobileViewport = this.createSmViewportSignal()

	protected readonly columns: ColumnDef<IPermission, unknown>[] = [
		{ accessorKey: 'resource', header: this.translation.instant('PERMISSIONS.TABLE.HEADER.RESOURCE') },
		{ accessorKey: 'action', header: this.translation.instant('PERMISSIONS.TABLE.HEADER.ACTION') },
		{ accessorKey: 'identifier', header: this.translation.instant('PERMISSIONS.TABLE.HEADER.IDENTIFIER') },
		{ accessorKey: 'description', header: this.translation.instant('PERMISSIONS.TABLE.HEADER.DESCRIPTION') },
	]

	protected readonly grouping = ['resource']

	private createSmViewportSignal(): Signal<boolean> {
		if (!isPlatformBrowser(this.platformId)) return signal(false).asReadonly()
		const sm = getComputedStyle(document.documentElement).getPropertyValue('--breakpoint-sm').trim() || '40rem'
		return toSignal(
			inject(BreakpointObserver)
				.observe(`(max-width: calc(${sm} - 1px))`)
				.pipe(map((s) => s.matches)),
			{ initialValue: false },
		)
	}
}
