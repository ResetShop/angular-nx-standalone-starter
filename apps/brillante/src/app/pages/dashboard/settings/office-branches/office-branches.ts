import { Component, computed, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { PageShell } from '@components/page-shell/page-shell'
import type { OfficeBranchDto } from '@contracts/office-branch/office-branch.types'
import { Permission } from '@contracts/permission/permission.constants'
import { AppTranslation } from '@providers/i18n/app-translation'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Badge } from '@resetshop/ui/badge/badge'
import { Button } from '@resetshop/ui/button/button'
import { DataTable } from '@resetshop/ui/data-table/data-table'
import { DataTableCellDef } from '@resetshop/ui/data-table/data-table-cell-def'
import { AuthStore } from '@store/auth/auth.store'
import { OfficeBranchStore } from '@store/office-branch/office-branch.store'
import { UIStore } from '@store/ui/ui.store'
import { NotificationType } from '@store/ui/ui.types'
import type { ColumnDef } from '@tanstack/angular-table'

/**
 * Lists the branches and lets any signed-in user choose the one this browser works on. The
 * assignment is dashboard-wide state owned by `OfficeBranchStore`; adding a branch is reserved
 * for users allowed to manage branches.
 */
@Component({
	selector: 'app-office-branches',
	imports: [Badge, Button, DataTable, DataTableCellDef, PageShell, RouterLink, TranslatePipe],
	template: `
		<app-page-shell
			[loading]="store.isLoadingList()"
			[error]="store.readError().list"
			[title]="'OFFICE_BRANCHES.TITLE' | translate"
		>
			<p pageDescription>{{ 'OFFICE_BRANCHES.DESCRIPTION' | translate }}</p>

			<div pageActions class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<p class="text-sm" data-testid="current-branch">
					<span class="text-muted-foreground">{{ 'OFFICE_BRANCHES.CURRENT.LABEL' | translate }}:</span>
					<strong class="text-foreground ml-1">
						{{ store.currentBranch()?.name ?? ('OFFICE_BRANCHES.CURRENT.NONE' | translate) }}
					</strong>
				</p>
				@if (canManage()) {
					<a [routerLink]="['add']" appButton class="w-full sm:w-auto">
						{{ 'OFFICE_BRANCHES.ADD_BUTTON' | translate }}
					</a>
				}
			</div>

			<app-data-table
				[columns]="columns()"
				[data]="store.branches()"
				[caption]="'OFFICE_BRANCHES.TABLE.CAPTION' | translate"
			>
				<ng-template appDataTableCellDef="actions" let-row="row">
					@if (isCurrent(row)) {
						<span appBadge variant="secondary">{{ 'OFFICE_BRANCHES.ASSIGNED' | translate }}</span>
					} @else {
						<button (click)="assign(row)" appButton variant="outline" size="sm" type="button">
							{{ 'OFFICE_BRANCHES.ASSIGN' | translate }}
						</button>
					}
				</ng-template>
			</app-data-table>
		</app-page-shell>
	`,
})
export default class OfficeBranches {
	protected readonly store = inject(OfficeBranchStore)
	private readonly authStore = inject(AuthStore)
	private readonly uiStore = inject(UIStore)
	private readonly translation = inject(AppTranslation)

	// The branch list is requested as soon as the page is created.
	private readonly loadBranchesRequest = this.store.loadBranches()

	protected readonly canManage = computed(
		() => this.authStore.currentUser()?.hasPermission(Permission.SETTINGS_OFFICE_BRANCHES_MANAGE) ?? false,
	)

	protected readonly columns = computed((): ColumnDef<OfficeBranchDto, unknown>[] => [
		{ accessorKey: 'name', header: this.translation.instant('OFFICE_BRANCHES.TABLE.HEADER.NAME') },
		{ accessorKey: 'address', header: this.translation.instant('OFFICE_BRANCHES.TABLE.HEADER.ADDRESS') },
		{ id: 'actions', header: '', enableSorting: false },
	])

	protected isCurrent(branch: OfficeBranchDto): boolean {
		return this.store.currentBranch()?.id === branch.id
	}

	protected assign(branch: OfficeBranchDto): void {
		this.store.assign(branch)
		this.uiStore.showNotification({
			type: NotificationType.SUCCESS,
			message: this.translation.instant('OFFICE_BRANCHES.ASSIGN_TOAST').replace('{name}', branch.name),
		})
	}
}
