import { Component, computed, effect, inject, signal, untracked, viewChild } from '@angular/core'
import {
	email as emailValidator,
	form,
	maxLength,
	required,
	schema,
	FormField as SignalFormField,
} from '@angular/forms/signals'
import type { CreateUserRequest } from '@contracts/user/user.types'
import type { IUser } from '@domain/user/user.interface'
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
import { createMutationToast } from '@store/ui/mutation-toast'
import { DRAWER_CLOSE_AFTER_SUCCESS_DELAY } from '../../settings.constants'
import { ManagedUsersStore } from '../managed-users.store'
import { RoleCheckboxes } from '../role-checkboxes/role-checkboxes'
import { USER_ROLE_OPTIONS } from '../user-role-options'

interface UserFormModel {
	firstName: string
	lastName: string
	userName: string
	email: string
	roleIds: number[]
}

/**
 * Create and edit surface for managed users. `openCreate()` starts an empty form that registers
 * a user; `openEdit(user)` loads an existing user whose name, email and roles can change (the
 * username identifies the account and stays fixed).
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
			(afterClosed)="createToast.flushPending(); updateToast.flushPending()"
			[closeOnBackdrop]="false"
			[title]="title()"
			class="w-full sm:w-lg"
			#drawer
		>
			<form (submit)="onSubmit($event)" id="user-form" class="flex h-full flex-col gap-4">
				@if (mutationError()) {
					<div appAlert variant="destructive">
						<p appAlertDescription>{{ mutationError() }}</p>
					</div>
				}

				<app-form-field [label]="'MANAGED_USERS.DRAWER.FIRST_NAME' | translate">
					<input [formField]="userForm.firstName" type="text" autocomplete="given-name" />
				</app-form-field>

				<app-form-field [label]="'MANAGED_USERS.DRAWER.LAST_NAME' | translate">
					<input [formField]="userForm.lastName" type="text" autocomplete="family-name" />
				</app-form-field>

				@if (isEditing()) {
					<div class="flex flex-col gap-1.5">
						<span class="text-foreground text-sm font-medium">{{ 'MANAGED_USERS.DRAWER.USER_NAME' | translate }}</span>
						<span class="text-muted-foreground text-sm" data-testid="user-name-readonly">{{ model().userName }}</span>
					</div>
				} @else {
					<app-form-field [label]="'MANAGED_USERS.DRAWER.USER_NAME' | translate">
						<input [formField]="userForm.userName" type="text" autocomplete="username" />
					</app-form-field>
				}

				<app-form-field [label]="'MANAGED_USERS.DRAWER.EMAIL' | translate">
					<input [formField]="userForm.email" type="email" autocomplete="email" />
				</app-form-field>

				<app-form-field [label]="'MANAGED_USERS.DRAWER.ROLES_LABEL' | translate">
					<app-role-checkboxes [formField]="userForm.roleIds" />
				</app-form-field>
			</form>

			<ng-template appDrawerFooter>
				<div class="flex justify-end gap-3">
					<button (click)="onCancel()" appButton variant="outline">{{ 'COMMON.CANCEL' | translate }}</button>
					<button [disabled]="!canSubmit()" appButton type="submit" form="user-form">
						@if (isSaving()) {
							<app-spinner data-icon="start" />
						}
						{{ submitLabelKey() | translate }}
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
	private readonly store = inject(ManagedUsersStore)
	private readonly translation = inject(AppTranslation)
	private readonly drawer = viewChild.required<Drawer>('drawer')
	private readonly discardDialog = viewChild.required<ConfirmDialog>('discardDialog')

	protected readonly createToast = createMutationToast(this.translation.instant('MANAGED_USERS.SUCCESS.CREATED'), {
		deferred: true,
	})
	protected readonly updateToast = createMutationToast(this.translation.instant('MANAGED_USERS.SUCCESS.UPDATED'), {
		deferred: true,
	})

	/** The user being edited; null while the drawer creates a new one. */
	private readonly editedUser = signal<IUser | null>(null)

	protected readonly isEditing = computed(() => this.editedUser() !== null)

	protected readonly model = signal<UserFormModel>(emptyModel())
	protected readonly userForm = form(
		this.model,
		schema<UserFormModel>((user) => {
			required(user.firstName)
			maxLength(user.firstName, 100)
			required(user.lastName)
			maxLength(user.lastName, 100)
			required(user.userName, { when: () => !this.isEditing() })
			maxLength(user.userName, 100)
			required(user.email)
			emailValidator(user.email)
		}),
	)

	protected readonly title = computed(() =>
		this.translation.instant(
			this.isEditing() ? 'MANAGED_USERS.DRAWER.EDIT_TITLE' : 'MANAGED_USERS.DRAWER.CREATE_TITLE',
		),
	)
	protected readonly mutationError = computed(() =>
		this.isEditing() ? this.store.mutationError().update : this.store.mutationError().create,
	)

	private readonly closingAfterSuccess = signal(false)
	protected readonly isSaving = computed(
		() => this.store.isCreating() || this.store.isUpdating() || this.closingAfterSuccess(),
	)
	protected readonly canSubmit = computed(
		() => !this.isSaving() && this.userForm().valid() && (!this.isEditing() || this.userForm().dirty()),
	)
	protected readonly submitLabelKey = computed(() => {
		if (this.isSaving()) return this.isEditing() ? 'COMMON.SAVING' : 'COMMON.CREATING'
		return this.isEditing() ? 'COMMON.SAVE' : 'COMMON.CREATE'
	})

	private readonly closeOnSuccessEffect = effect(() => {
		const creating = this.store.isCreating()
		const updating = this.store.isUpdating()
		const createError = this.store.mutationError().create
		const updateError = this.store.mutationError().update
		untracked(() => {
			const outcome =
				this.createToast.handleResult(creating, createError) ?? this.updateToast.handleResult(updating, updateError)
			if (outcome === 'success') {
				this.closeAfterSuccessDelay()
			}
		})
	})

	public openCreate(): void {
		this.editedUser.set(null)
		this.model.set(emptyModel())
		this.show()
	}

	public openEdit(user: IUser): void {
		this.editedUser.set(user)
		this.model.set({
			firstName: user.firstName,
			lastName: user.lastName,
			userName: user.userName,
			email: user.email,
			roleIds: user.roles.map((role) => role.id),
		})
		this.show()
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
		this.store.clearMutationError('create')
		this.store.clearMutationError('update')
	}

	protected onSubmit(event: Event): void {
		event.preventDefault()
		if (!this.canSubmit()) return

		const { firstName, lastName, userName, email, roleIds } = this.model()
		const roles = USER_ROLE_OPTIONS.filter((option) => roleIds.includes(option.id)).map((option) => ({
			id: option.id,
			description: option.description,
		}))
		const editedUser = this.editedUser()

		if (editedUser) {
			this.updateToast.markSubmitted()
			this.store.updateUser({ id: editedUser.id, firstName, lastName, email, roles })
			return
		}

		const body: CreateUserRequest = { firstName, lastName, userName, email, roles }
		this.createToast.markSubmitted()
		this.store.createUser(body)
	}

	private show(): void {
		this.userForm().reset()
		this.drawer().show()
		this.drawer().setContentReady()
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
	return { firstName: '', lastName: '', userName: '', email: '', roleIds: [] }
}
