import { Component, computed, effect, inject, signal, untracked, viewChild } from '@angular/core'
import { PageShell } from '@components/page-shell/page-shell'
import type { IUser } from '@domain/user/user.interface'
import { AppTranslation } from '@providers/i18n/app-translation'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Button } from '@resetshop/ui/button/button'
import { ConfirmDialog } from '@resetshop/ui/confirm-dialog/confirm-dialog'
import { DataTable } from '@resetshop/ui/data-table/data-table'
import { DataTableCellDef } from '@resetshop/ui/data-table/data-table-cell-def'
import { type RowAction, RowActionsMenu } from '@resetshop/ui/row-actions-menu/row-actions-menu'
import { AuthStore } from '@store/auth/auth.store'
import { ManagedUsersStore } from '@store/managed-users/managed-users.store'
import { createMutationToast } from '@store/ui/mutation-toast'
import type { ColumnDef } from '@tanstack/angular-table'
import { UserDrawer } from './user-drawer/user-drawer'
import { USER_ROLE_OPTIONS } from './user-role-options'

/**
 * Lists every user and opens the drawers that register, edit or delete them. The route is
 * guarded by the permission to manage users, so the page itself does not re-check it.
 */
@Component({
	selector: 'app-user-management',
	imports: [Button, ConfirmDialog, DataTable, DataTableCellDef, PageShell, RowActionsMenu, TranslatePipe, UserDrawer],
	template: `
		<app-page-shell
			[loading]="store.isLoadingList()"
			[error]="store.readError().list"
			[title]="'MANAGED_USERS.TITLE' | translate"
		>
			<p pageDescription>{{ 'MANAGED_USERS.DESCRIPTION' | translate }}</p>

			<div
				pageActions
				class="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
			>
				<input
					(input)="onSearchInput($event)"
					[placeholder]="'MANAGED_USERS.SEARCH' | translate"
					[attr.aria-label]="'MANAGED_USERS.SEARCH' | translate"
					type="search"
					class="border-input bg-background text-foreground focus:border-ring focus:ring-ring h-9 w-full max-w-sm rounded-md border px-3 text-base focus:ring-1 focus:outline-none sm:text-sm"
				/>
				<button (click)="userDrawer().openCreate()" appButton class="w-full sm:w-auto">
					{{ 'MANAGED_USERS.CREATE_BUTTON' | translate }}
				</button>
			</div>

			<app-data-table
				[columns]="columns()"
				[data]="store.filteredUsers()"
				[loading]="store.isMutating()"
				[caption]="'MANAGED_USERS.TABLE.CAPTION' | translate"
			>
				<ng-template appDataTableCellDef="actions" let-row="row">
					<app-row-actions-menu
						[actions]="getRowActions(row)"
						[triggerLabel]="'ROW_ACTIONS.TRIGGER_LABEL' | translate"
					/>
				</ng-template>
			</app-data-table>
		</app-page-shell>

		<app-user-drawer #userDrawerRef />

		<app-confirm-dialog
			(confirmed)="onDeleteConfirmed()"
			[message]="deleteMessage()"
			[title]="'MANAGED_USERS.DELETE_DIALOG.TITLE' | translate"
			[confirmText]="'COMMON.DELETE' | translate"
			#deleteDialogRef
			confirmVariant="destructive"
		/>
	`,
})
export default class UserManagement {
	protected readonly store = inject(ManagedUsersStore)
	private readonly authStore = inject(AuthStore)
	private readonly translation = inject(AppTranslation)

	protected readonly userDrawer = viewChild.required<UserDrawer>('userDrawerRef')
	private readonly deleteDialog = viewChild.required<ConfirmDialog>('deleteDialogRef')
	private readonly deleteToast = createMutationToast(this.translation.instant('MANAGED_USERS.SUCCESS.DELETED'))

	protected readonly userToDelete = signal<IUser | null>(null)
	protected readonly deleteMessage = computed(() =>
		this.translation
			.instant('MANAGED_USERS.DELETE_DIALOG.MESSAGE')
			.replace('{name}', this.userToDelete()?.fullName ?? ''),
	)

	private readonly deleteToastEffect = effect(() => {
		const deleting = this.store.isDeleting()
		const error = this.store.mutationError().delete
		untracked(() => this.deleteToast.handleResult(deleting, error))
	})

	protected readonly columns = computed((): ColumnDef<IUser, unknown>[] => [
		{ accessorKey: 'fullName', header: this.translation.instant('MANAGED_USERS.TABLE.HEADER.NAME') },
		{ accessorKey: 'userName', header: this.translation.instant('MANAGED_USERS.TABLE.HEADER.USER_NAME') },
		{ accessorKey: 'email', header: this.translation.instant('MANAGED_USERS.TABLE.HEADER.EMAIL') },
		{
			id: 'roles',
			header: this.translation.instant('MANAGED_USERS.TABLE.HEADER.ROLES'),
			accessorFn: (user) => this.describeRoles(user),
		},
		{ id: 'actions', header: '', enableSorting: false },
	])

	protected onSearchInput(event: Event): void {
		this.store.setSearchQuery((event.target as HTMLInputElement).value)
	}

	protected getRowActions(user: IUser): readonly (readonly RowAction[])[] {
		const isSelf = this.authStore.currentUser()?.id === user.id
		const edit: RowAction = {
			label: this.translation.instant('COMMON.EDIT'),
			onSelect: () => this.userDrawer().openEdit(user),
		}
		const remove: RowAction = {
			label: this.translation.instant('COMMON.DELETE'),
			onSelect: () => this.confirmDelete(user),
			variant: 'destructive',
		}
		return [[edit], isSelf ? [] : [remove]]
	}

	protected confirmDelete(user: IUser): void {
		this.userToDelete.set(user)
		this.deleteDialog().show()
	}

	protected onDeleteConfirmed(): void {
		const user = this.userToDelete()
		if (!user) return

		this.deleteToast.markSubmitted()
		this.store.deleteUser(user.id)
		this.userToDelete.set(null)
	}

	private describeRoles(user: IUser): string {
		if (user.roles.length === 0) return this.translation.instant('MANAGED_USERS.NO_ROLES')
		return user.roles
			.map((role) => {
				const option = USER_ROLE_OPTIONS.find((candidate) => candidate.id === role.id)
				return option ? this.translation.instant(option.labelKey) : role.description
			})
			.join(', ')
	}
}
