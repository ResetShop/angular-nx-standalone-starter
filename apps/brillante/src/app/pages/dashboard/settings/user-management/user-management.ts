import { Component, computed, effect, inject, signal, untracked, viewChild } from '@angular/core'
import { PageShell } from '@components/page-shell/page-shell'
import { UserStatus } from '@contracts/user/user.constants'
import type { ManagedUser } from '@domain/user/managed-user.interface'
import { AppTranslation } from '@providers/i18n/app-translation'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { ConfirmDialog } from '@resetshop/ui/confirm-dialog/confirm-dialog'
import { DataTable } from '@resetshop/ui/data-table/data-table'
import { DataTableCellDef } from '@resetshop/ui/data-table/data-table-cell-def'
import { type RowAction, RowActionsMenu } from '@resetshop/ui/row-actions-menu/row-actions-menu'
import { AuthStore } from '@store/auth/auth.store'
import { createMutationToast } from '@store/ui/mutation-toast'
import type { ColumnDef } from '@tanstack/angular-table'
import { ManagedUsersStore } from './managed-users.store'
import { UserDrawer } from './user-drawer/user-drawer'
import { USER_ROLE_OPTIONS } from './user-role-options'

/**
 * Lists every user and opens the drawer that edits one, or the actions that disable, enable, reset the password of or
 * delete it. The route is guarded by the permission to manage users, so the page itself does not re-check it. Creating
 * users is not offered until the backend can email the new user a link to choose a password.
 */
@Component({
	selector: 'app-user-management',
	imports: [ConfirmDialog, DataTable, DataTableCellDef, PageShell, RowActionsMenu, TranslatePipe, UserDrawer],
	template: `
		<app-page-shell
			[loading]="store.isLoadingList()"
			[error]="store.readError().list"
			[title]="'MANAGED_USERS.TITLE' | translate"
		>
			<p pageDescription>{{ 'MANAGED_USERS.DESCRIPTION' | translate }}</p>

			<div pageActions class="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
				<input
					(input)="onSearchInput($event)"
					[placeholder]="'MANAGED_USERS.SEARCH' | translate"
					[attr.aria-label]="'MANAGED_USERS.SEARCH' | translate"
					type="search"
					class="border-input bg-background text-foreground focus:border-ring focus:ring-ring h-9 w-full max-w-sm rounded-md border px-3 text-base focus:ring-1 focus:outline-none sm:text-sm"
				/>
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
			(confirmed)="onResetConfirmed()"
			[message]="resetMessage()"
			[title]="'MANAGED_USERS.RESET_DIALOG.TITLE' | translate"
			[confirmText]="'MANAGED_USERS.RESET_DIALOG.CONFIRM' | translate"
			#resetDialogRef
		/>

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
	private readonly resetDialog = viewChild.required<ConfirmDialog>('resetDialogRef')
	private readonly deleteToast = createMutationToast(this.translation.instant('MANAGED_USERS.SUCCESS.DELETED'))
	private readonly statusToast = createMutationToast(this.translation.instant('MANAGED_USERS.SUCCESS.UPDATED'))
	private readonly resetToast = createMutationToast(this.translation.instant('MANAGED_USERS.SUCCESS.PASSWORD_RESET'))

	protected readonly userToDelete = signal<ManagedUser | null>(null)
	protected readonly userToReset = signal<ManagedUser | null>(null)
	protected readonly resetMessage = computed(() =>
		this.translation
			.instant('MANAGED_USERS.RESET_DIALOG.MESSAGE')
			.replace('{name}', this.userToReset()?.fullName ?? '')
			.replace('{email}', this.userToReset()?.email ?? ''),
	)
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

	private readonly statusToastEffect = effect(() => {
		const updating = this.store.isUpdating()
		const error = this.store.mutationError().update
		untracked(() => this.statusToast.handleResult(updating, error))
	})

	private readonly resetToastEffect = effect(() => {
		const resetting = this.store.isResettingPassword()
		const error = this.store.mutationError().resetPassword
		untracked(() => this.resetToast.handleResult(resetting, error))
	})

	protected readonly columns = computed((): ColumnDef<ManagedUser, unknown>[] => [
		{ accessorKey: 'fullName', header: this.translation.instant('MANAGED_USERS.TABLE.HEADER.NAME') },
		{ accessorKey: 'email', header: this.translation.instant('MANAGED_USERS.TABLE.HEADER.EMAIL') },
		{
			id: 'roles',
			header: this.translation.instant('MANAGED_USERS.TABLE.HEADER.ROLES'),
			accessorFn: (user) => this.describeRoles(user),
		},
		{
			id: 'status',
			header: this.translation.instant('MANAGED_USERS.TABLE.HEADER.STATUS'),
			accessorFn: (user) => this.describeStatus(user),
		},
		{ id: 'actions', header: '', enableSorting: false },
	])

	protected onSearchInput(event: Event): void {
		this.store.setSearchQuery((event.target as HTMLInputElement).value)
	}

	protected getRowActions(user: ManagedUser): readonly (readonly RowAction[])[] {
		const edit: RowAction = {
			label: this.translation.instant('COMMON.EDIT'),
			onSelect: () => this.userDrawer().openEdit(user),
		}
		// The backend refuses changing the status of, resetting the password of, or deleting one's own account.
		if (this.authStore.currentUser()?.id === user.id) return [[edit]]

		const isActive = user.status === UserStatus.ACTIVE
		const toggleStatus: RowAction = {
			label: this.translation.instant(isActive ? 'MANAGED_USERS.ACTIONS.DISABLE' : 'MANAGED_USERS.ACTIONS.ENABLE'),
			onSelect: () => this.changeStatus(user, isActive ? UserStatus.DISABLED : UserStatus.ACTIVE),
		}
		const resetPassword: RowAction = {
			label: this.translation.instant('MANAGED_USERS.ACTIONS.RESET_PASSWORD'),
			onSelect: () => this.confirmReset(user),
		}
		const remove: RowAction = {
			label: this.translation.instant('COMMON.DELETE'),
			onSelect: () => this.confirmDelete(user),
			variant: 'destructive',
		}
		// A disabled account cannot sign in, so a temporary password for it would only be noise.
		return [isActive ? [edit, toggleStatus, resetPassword] : [edit, toggleStatus], [remove]]
	}

	protected confirmReset(user: ManagedUser): void {
		this.userToReset.set(user)
		this.resetDialog().show()
	}

	protected onResetConfirmed(): void {
		const user = this.userToReset()
		if (!user) return

		this.resetToast.markSubmitted()
		this.store.resetPassword(user.id)
		this.userToReset.set(null)
	}

	protected confirmDelete(user: ManagedUser): void {
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

	private changeStatus(user: ManagedUser, status: typeof UserStatus.ACTIVE | typeof UserStatus.DISABLED): void {
		this.statusToast.markSubmitted()
		this.store.updateUser({ id: user.id, changes: { status } })
	}

	private describeStatus(user: ManagedUser): string {
		return this.translation.instant(
			user.status === UserStatus.ACTIVE ? 'MANAGED_USERS.STATUS.ACTIVE' : 'MANAGED_USERS.STATUS.DISABLED',
		)
	}

	private describeRoles(user: ManagedUser): string {
		if (user.roles.length === 0) return this.translation.instant('MANAGED_USERS.NO_ROLES')
		return user.roles
			.map((role) => {
				const option = USER_ROLE_OPTIONS.find((candidate) => candidate.id === role.id)
				return option ? this.translation.instant(option.labelKey) : role.description
			})
			.join(', ')
	}
}
