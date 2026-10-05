import { Component, computed, effect, inject, signal, untracked, viewChild } from '@angular/core'
import {
	email as emailValidator,
	form,
	maxLength,
	required,
	schema,
	FormField as SignalFormField,
} from '@angular/forms/signals'
import type { UpdateUserRequest } from '@contracts/user/user.types'
import type { ManagedUser } from '@domain/user/managed-user.interface'
import { AppTranslation } from '@providers/i18n/app-translation'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Alert, AlertDescription } from '@resetshop/ui/alert/alert'
import { Button } from '@resetshop/ui/button/button'
import { ConfirmDialog } from '@resetshop/ui/confirm-dialog/confirm-dialog'
import { Drawer } from '@resetshop/ui/drawer/drawer'
import { DrawerFooter } from '@resetshop/ui/drawer/drawer-footer'
import { FormField } from '@resetshop/ui/form-field/form-field'
import { Spinner } from '@resetshop/ui/spinner/spinner'
import { parseDurationToMs } from '@resetshop/util'
import { AuthStore } from '@store/auth/auth.store'
import { createMutationToast } from '@store/ui/mutation-toast'
import { DRAWER_CLOSE_AFTER_SUCCESS_DELAY } from '../../settings.constants'
import { ManagedUsersStore } from '../managed-users.store'
import { RoleCheckboxes } from '../role-checkboxes/role-checkboxes'

interface UserFormModel {
	firstName: string
	lastName: string
	email: string
	roleIds: number[]
}

/**
 * Edit surface for managed users: `openEdit(user)` loads an existing user whose name, email and roles can change. Only
 * the fields that changed are sent. Roles that are not removable stay checked (the backend refuses dropping them), and
 * the roles of the signed-in user are not editable here: the backend refuses dropping one's own administrator role and
 * the screen does not risk it.
 */
@Component({
	selector: 'app-user-drawer',
	imports: [
		Alert,
		AlertDescription,
		Button,
		ConfirmDialog,
		Drawer,
		DrawerFooter,
		FormField,
		RoleCheckboxes,
		SignalFormField,
		Spinner,
		TranslatePipe,
	],
	template: `
		<app-drawer
			(closed)="onDrawerClosed()"
			(afterClosed)="updateToast.flushPending()"
			[closeOnBackdrop]="false"
			[title]="'MANAGED_USERS.DRAWER.EDIT_TITLE' | translate"
			class="w-full sm:w-lg"
			#drawer
		>
			<form (submit)="onSubmit($event)" id="user-form" class="flex h-full flex-col gap-4">
				@if (store.mutationError().update) {
					<div appAlert variant="destructive">
						<p appAlertDescription>{{ store.mutationError().update }}</p>
					</div>
				}

				<app-form-field [label]="'MANAGED_USERS.DRAWER.FIRST_NAME' | translate">
					<input [formField]="userForm.firstName" type="text" autocomplete="given-name" />
				</app-form-field>

				<app-form-field [label]="'MANAGED_USERS.DRAWER.LAST_NAME' | translate">
					<input [formField]="userForm.lastName" type="text" autocomplete="family-name" />
				</app-form-field>

				<app-form-field [label]="'MANAGED_USERS.DRAWER.EMAIL' | translate">
					<input [formField]="userForm.email" type="email" autocomplete="email" />
				</app-form-field>

				@if (isOwnAccount()) {
					<p class="text-muted-foreground text-sm">{{ 'MANAGED_USERS.DRAWER.OWN_ROLES_NOTE' | translate }}</p>
				} @else {
					<app-form-field [label]="'MANAGED_USERS.DRAWER.ROLES_LABEL' | translate">
						<app-role-checkboxes [formField]="userForm.roleIds" [lockedIds]="lockedRoleIds()" />
					</app-form-field>
					@if (lockedRoleIds().length > 0) {
						<p class="text-muted-foreground text-sm">{{ 'MANAGED_USERS.DRAWER.LOCKED_ROLES_NOTE' | translate }}</p>
					}
				}
			</form>

			<ng-template appDrawerFooter>
				<div class="flex justify-end gap-3">
					<button (click)="onCancel()" appButton variant="outline">{{ 'COMMON.CANCEL' | translate }}</button>
					<button [disabled]="!canSubmit()" appButton type="submit" form="user-form">
						@if (isSaving()) {
							<app-spinner data-icon="start" />
						}
						{{ (isSaving() ? 'COMMON.SAVING' : 'COMMON.SAVE') | translate }}
					</button>
				</div>
			</ng-template>
		</app-drawer>

		<app-confirm-dialog
			(confirmed)="drawer.close()"
			[title]="'COMMON.DISCARD_DIALOG.TITLE' | translate"
			[message]="'COMMON.DISCARD_DIALOG.MESSAGE' | translate"
			[confirmText]="'COMMON.DISCARD_DIALOG.CONFIRM' | translate"
			confirmVariant="destructive"
			#discardDialog
		/>
	`,
})
export class UserDrawer {
	protected readonly store = inject(ManagedUsersStore)
	private readonly authStore = inject(AuthStore)
	private readonly translation = inject(AppTranslation)
	private readonly drawer = viewChild.required<Drawer>('drawer')
	private readonly discardDialog = viewChild.required<ConfirmDialog>('discardDialog')

	protected readonly updateToast = createMutationToast(this.translation.instant('MANAGED_USERS.SUCCESS.UPDATED'), {
		deferred: true,
	})

	private readonly editedUser = signal<ManagedUser | null>(null)
	/** Roles the user holds that the backend will not let go of, so the form does not offer unchecking them. */
	protected readonly lockedRoleIds = computed(() =>
		(this.editedUser()?.roles ?? []).filter((role) => !role.removable).map((role) => role.id),
	)
	protected readonly isOwnAccount = computed(() => {
		const edited = this.editedUser()
		return edited !== null && edited.id === this.authStore.currentUser()?.id
	})

	protected readonly model = signal<UserFormModel>(emptyModel())
	protected readonly userForm = form(
		this.model,
		schema<UserFormModel>((user) => {
			required(user.firstName)
			maxLength(user.firstName, 100)
			required(user.lastName)
			maxLength(user.lastName, 100)
			required(user.email)
			emailValidator(user.email)
		}),
	)

	private readonly closingAfterSuccess = signal(false)
	protected readonly isSaving = computed(() => this.store.isUpdating() || this.closingAfterSuccess())
	/** What the form changes with respect to the stored user; empty when edits were reverted. */
	private readonly pendingChanges = computed(() => {
		const user = this.editedUser()
		return user ? this.changesOf(user) : {}
	})
	protected readonly canSubmit = computed(
		() => !this.isSaving() && this.userForm().valid() && Object.keys(this.pendingChanges()).length > 0,
	)

	private readonly closeOnSuccessEffect = effect(() => {
		const updating = this.store.isUpdating()
		const updateError = this.store.mutationError().update
		untracked(() => {
			if (this.updateToast.handleResult(updating, updateError) === 'success') {
				this.closeAfterSuccessDelay()
			}
		})
	})

	public openEdit(user: ManagedUser): void {
		// An error from an earlier status change (shown as a toast by the page) must not greet the next edit.
		this.store.clearMutationError('update')
		this.editedUser.set(user)
		this.model.set({
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email,
			roleIds: user.roles.map((role) => role.id),
		})
		this.userForm().reset()
		this.drawer().show()
		this.drawer().setContentReady()
	}

	protected onCancel(): void {
		if (this.userForm().dirty()) {
			this.discardDialog().show()
		} else {
			this.drawer().close()
		}
	}

	protected onDrawerClosed(): void {
		this.model.set(emptyModel())
		this.userForm().reset()
		this.store.clearMutationError('update')
	}

	protected onSubmit(event: Event): void {
		event.preventDefault()
		const user = this.editedUser()
		if (!user || !this.canSubmit()) return

		this.updateToast.markSubmitted()
		this.store.updateUser({ id: user.id, changes: this.pendingChanges() })
	}

	/** Only what differs from the stored user, so an unchanged email is never sent (it would be checked for clashes). */
	private changesOf(user: ManagedUser): UpdateUserRequest {
		const { firstName, lastName, email, roleIds } = this.model()
		const changes: UpdateUserRequest = {}
		if (firstName !== user.firstName) changes.firstName = firstName
		if (lastName !== user.lastName) changes.lastName = lastName
		if (email !== user.email) changes.email = email
		const currentRoleIds = user.roles.map((role) => role.id)
		const rolesChanged = roleIds.length !== currentRoleIds.length || roleIds.some((id) => !currentRoleIds.includes(id))
		if (!this.isOwnAccount() && rolesChanged) changes.roleIds = roleIds
		return changes
	}

	private closeAfterSuccessDelay(): void {
		this.closingAfterSuccess.set(true)
		setTimeout(() => {
			this.closingAfterSuccess.set(false)
			this.drawer().close()
		}, parseDurationToMs(DRAWER_CLOSE_AFTER_SUCCESS_DELAY))
	}
}

function emptyModel(): UserFormModel {
	return { firstName: '', lastName: '', email: '', roleIds: [] }
}
