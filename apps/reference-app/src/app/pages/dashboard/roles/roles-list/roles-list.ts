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
import { HasPermissionDirective } from '@directives/has-permission.directive'
import type { IRole } from '@domain/access/role.interface'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { featherEdit3, featherTrash2 } from '@ng-icons/feather-icons'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import { Badge } from '@resetshop/ui/badge/badge'
import { Button } from '@resetshop/ui/button/button'
import { ConfirmDialog } from '@resetshop/ui/confirm-dialog/confirm-dialog'
import { DataTable } from '@resetshop/ui/data-table/data-table'
import { DataTableCardDef } from '@resetshop/ui/data-table/data-table-card-def'
import { DataTableCellDef } from '@resetshop/ui/data-table/data-table-cell-def'
import { Pagination } from '@resetshop/ui/pagination/pagination'
import { AuthStore } from '@store/auth/auth.store'
import { RolesStore } from '@store/roles/roles.store'
import { createMutationToast } from '@store/ui/mutation-toast'
import type { ColumnDef } from '@tanstack/angular-table'
import { CreateRoleDrawer } from '../create-role-drawer/create-role-drawer'
import { EditRoleDrawer } from '../edit-role-drawer/edit-role-drawer'
import { RoleCard } from './role-card'

@Component({
	selector: 'app-roles-list',
	standalone: true,
	imports: [
		Badge,
		Button,
		ConfirmDialog,
		CreateRoleDrawer,
		DataTable,
		DataTableCardDef,
		DataTableCellDef,
		EditRoleDrawer,
		HasPermissionDirective,
		NgIcon,
		PageShell,
		Pagination,
		RoleCard,
		TranslatePipe,
	],
	viewProviders: [provideIcons({ featherEdit3, featherTrash2 })],
	template: `
		<app-page-shell
			[loading]="store.isLoadingList()"
			[error]="store.readError().list"
			[title]="'ROLES.PAGE.TITLE' | translate"
		>
			<p pageDescription>{{ 'ROLES.PAGE.DESCRIPTION' | translate }}</p>

			<div pageActionsSkeleton class="flex items-center justify-between gap-4" data-testid="roles-actions-skeleton">
				<div class="bg-muted h-9 w-full max-w-sm animate-pulse rounded-md"></div>
				<div class="bg-muted h-9 w-24 animate-pulse rounded-md"></div>
			</div>

			<div pageActions class="flex items-center justify-between gap-4">
				<input
					(input)="onSearchInput($event)"
					[placeholder]="'ROLES.PAGE.SEARCH' | translate"
					type="search"
					class="border-input bg-background text-foreground focus:border-ring focus:ring-ring h-9 w-full max-w-sm rounded-md border px-3 text-base focus:ring-1 focus:outline-none sm:text-sm"
				/>
				<button (click)="createDrawer.open()" *hasPermission="'admin:roles:create'" appButton>
					{{ 'ROLES.PAGE.CREATE_BUTTON' | translate }}
				</button>
			</div>

			<app-data-table
				[columns]="columns()"
				[data]="store.roles()"
				[loading]="store.isMutating()"
				[caption]="'ROLES.TABLE.CAPTION' | translate"
				[displayModes]="displayModes"
				cardsBelow="sm"
			>
				<ng-template appDataTableCellDef="code" let-value>
					<span appBadge variant="secondary">{{ value }}</span>
				</ng-template>

				<ng-template appDataTableCellDef="actions" let-value let-row="row">
					<!-- gap-4 (16px) > data-touch-target -inset-3 (12px) — prevents sibling hit-area overlap. -->
					<div class="flex gap-4">
						<button
							(click)="editDrawer.open(row.id)"
							*hasPermission="'admin:roles:update'"
							appButton
							variant="ghost"
							size="sm"
							data-touch-target
						>
							<ng-icon data-icon="start" name="featherEdit3" />
							<span class="sr-only sm:not-sr-only">{{ 'COMMON.EDIT' | translate }}</span>
						</button>
						<ng-container *hasPermission="'admin:roles:delete'">
							@if (row.removable) {
								<button
									(click)="confirmDelete(row)"
									appButton
									variant="ghost"
									size="sm"
									class="text-destructive"
									data-touch-target
								>
									<ng-icon data-icon="start" name="featherTrash2" />
									<span class="sr-only sm:not-sr-only">{{ 'COMMON.DELETE' | translate }}</span>
								</button>
							}
						</ng-container>
					</div>
				</ng-template>

				<ng-template appDataTableCardDef let-row>
					<app-role-card (edit)="editDrawer.open(row.id)" (delete)="confirmDelete(row)" [role]="row" />
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

		<app-create-role-drawer #createDrawer />
		<app-edit-role-drawer #editDrawer />

		<app-confirm-dialog
			(confirmed)="onDeleteConfirmed()"
			[message]="deleteMessage()"
			[title]="'ROLES.PAGE.DELETE_DIALOG.TITLE' | translate"
			[confirmText]="'COMMON.DELETE' | translate"
			#deleteDialog
			confirmVariant="destructive"
		/>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RolesList {
	protected readonly store = inject(RolesStore)
	protected readonly displayModes: Array<'table' | 'cards'> = ['table', 'cards']

	private readonly authStore = inject(AuthStore)
	private readonly translation = inject(Translation)

	private readonly deleteDialog = viewChild.required<ConfirmDialog>('deleteDialog')
	private readonly deleteToast = createMutationToast(this.translation.instant('ROLES.DELETE_TOAST'))

	protected readonly roleToDelete = signal<IRole | null>(null)
	protected readonly deleteMessage = computed(() => {
		const name = this.roleToDelete()?.name ?? ''
		return this.translation.instant('ROLES.PAGE.DELETE_DIALOG.MESSAGE').replace('{name}', name)
	})

	private readonly deleteToastEffect = effect(() => {
		const deleting = this.store.isDeleting()
		const error = this.store.mutationError().delete
		untracked(() => this.deleteToast.handleResult(deleting, error))
	})

	protected readonly columns = computed((): ColumnDef<IRole, unknown>[] => {
		const base: ColumnDef<IRole, unknown>[] = [
			{ accessorKey: 'name', header: this.translation.instant('ROLES.TABLE.HEADER.NAME') },
			{ accessorKey: 'code', header: this.translation.instant('ROLES.TABLE.HEADER.CODE') },
			{ accessorKey: 'description', header: this.translation.instant('ROLES.TABLE.HEADER.DESCRIPTION') },
		]
		const user = this.authStore.currentUser()
		if (user?.hasPermission('admin:roles:update') || user?.hasPermission('admin:roles:delete')) {
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
		this.deleteDialog().show()
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
