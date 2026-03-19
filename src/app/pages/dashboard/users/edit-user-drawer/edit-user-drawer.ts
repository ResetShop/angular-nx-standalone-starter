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
import {
	email as emailValidator,
	form,
	maxLength,
	required,
	schema,
	FormField as SignalFormField,
} from '@angular/forms/signals'
import { Alert, AlertDescription } from '@components/alert/alert'
import { Button } from '@components/button/button'
import { ConfirmDialog } from '@components/confirm-dialog/confirm-dialog'
import { Drawer } from '@components/drawer/drawer'
import { DrawerFooter } from '@components/drawer/drawer-footer'
import { FormField } from '@components/form-field/form-field'
import { Spinner } from '@components/spinner/spinner'
import { RolesStore } from '@store/roles/roles.store'
import { createMutationToast } from '@store/ui/mutation-toast'
import { UsersStore } from '@store/users/users.store'
import { parseDurationToMs } from '@utils/duration'
import { RoleSelector } from '../role-selector/role-selector'

interface EditUserFormModel {
	email: string
	firstName: string
	lastName: string
	roleIds: number[]
}

// Module-level for readability — mirrors the roles drawer pattern (used by model.set and onDrawerClosed)
const EMPTY_MODEL: EditUserFormModel = { email: '', firstName: '', lastName: '', roleIds: [] }

@Component({
	selector: 'app-edit-user-drawer',
	standalone: true,
	imports: [
		Drawer,
		DrawerFooter,
		FormField,
		SignalFormField,
		Button,
		Spinner,
		RoleSelector,
		Alert,
		AlertDescription,
		ConfirmDialog,
	],
	template: `
		<app-drawer
			(closed)="onDrawerClosed()"
			(afterClosed)="toast.flushPending()"
			[closeOnBackdrop]="false"
			class="w-lg"
			title="Edit User"
			#drawer
		>
			<form (submit)="onSubmit($event)" id="edit-user-form" class="flex h-full flex-col gap-4">
				@if (mutationError()) {
					<div appAlert variant="destructive">
						<p appAlertDescription>{{ mutationError() }}</p>
					</div>
				}

				<app-form-field label="First Name">
					<input [formField]="userForm.firstName" type="text" autocomplete="given-name" />
				</app-form-field>

				<app-form-field label="Last Name">
					<input [formField]="userForm.lastName" type="text" autocomplete="family-name" />
				</app-form-field>

				<app-form-field label="Email">
					<input [formField]="userForm.email" type="email" autocomplete="email" />
				</app-form-field>

				@if (rolesStore.allRoles().length > 0) {
					<app-form-field label="Roles" class="flex min-h-0 flex-1 flex-col">
						<app-role-selector [formField]="userForm.roleIds" [roles]="rolesStore.allRoles()" />
					</app-form-field>
				}
			</form>

			<ng-template appDrawerFooter>
				<div class="flex justify-end gap-3">
					<button (click)="onCancel()" appButton variant="outline">Cancel</button>
					<button
						[disabled]="drawer.showSpinner() || showSubmitSpinner() || !isFormValid()"
						type="submit"
						form="edit-user-form"
						appButton
					>
						@if (showSubmitSpinner()) {
							<app-spinner data-icon="start" />
						}
						{{ showSubmitSpinner() ? 'Saving...' : 'Save' }}
					</button>
				</div>
			</ng-template>
		</app-drawer>

		<app-confirm-dialog
			(confirmed)="drawer.close()"
			title="Discard changes"
			message="You have unsaved changes. Are you sure you want to discard them?"
			confirmText="Discard"
			confirmVariant="destructive"
			#discardDialog
		/>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditUserDrawer {
	private readonly usersStore = inject(UsersStore)
	protected readonly rolesStore = inject(RolesStore)
	protected readonly drawer = viewChild.required<Drawer>('drawer')
	private readonly discardDialog = viewChild.required<ConfirmDialog>('discardDialog')

	protected readonly toast = createMutationToast('User updated successfully.', { deferred: true })

	private readonly editUserId = signal<number | null>(null)

	private readonly model = signal<EditUserFormModel>({ ...EMPTY_MODEL })
	protected readonly userForm = form(
		this.model,
		schema<EditUserFormModel>((user) => {
			required(user.email)
			emailValidator(user.email)
			required(user.firstName)
			maxLength(user.firstName, 100)
			required(user.lastName)
			maxLength(user.lastName, 100)
		}),
	)

	protected readonly isFormValid = computed(() => this.userForm().errors().length === 0)
	protected readonly isUpdating = computed(() => this.usersStore.isUpdating())
	protected readonly showSubmitSpinner = computed(() => this.isUpdating() || this.closingAfterSuccess())
	protected readonly mutationError = computed(() => this.usersStore.mutationError().update)

	private readonly closingAfterSuccess = signal(false)

	constructor() {
		// Populates form when selectedUser loads — editUserId guards against stale data
		effect(() => {
			const user = this.usersStore.selectedUser()
			if (user && user.id === this.editUserId()) {
				this.model.set({
					email: user.email,
					firstName: user.firstName,
					lastName: user.lastName,
					roleIds: user.roles.map((r) => r.id),
				})
				this.drawer().setContentReady()
			}
		})

		effect(() => this.closeOnSuccess())
	}

	private closeOnSuccess(): void {
		const updating = this.usersStore.isUpdating()
		const error = this.usersStore.mutationError().update
		untracked(() => {
			if (this.toast.handleResult(updating, error) === 'success') {
				this.closingAfterSuccess.set(true)
				setTimeout(() => {
					this.closingAfterSuccess.set(false)
					this.drawer().close()
				}, parseDurationToMs('1s'))
			}
		})
	}

	public open(userId: number): void {
		this.editUserId.set(userId)
		this.usersStore.loadUser(userId)
		this.rolesStore.loadAllRoles()
		this.drawer().show()
	}

	protected onCancel(): void {
		if (this.userForm().dirty()) {
			this.discardDialog().show()
		} else {
			this.drawer().close()
		}
	}

	protected onDrawerClosed(): void {
		this.editUserId.set(null)
		this.model.set({ ...EMPTY_MODEL })
		this.userForm().reset()
		this.usersStore.clearMutationError('update')
	}

	protected onSubmit(event: Event): void {
		event.preventDefault()
		if (!this.isFormValid()) return

		const id = this.editUserId()
		if (!id) return

		const { email, firstName, lastName, roleIds } = this.model()
		this.toast.markSubmitted()
		this.usersStore.updateUser({
			id,
			body: { email, firstName, lastName, roleIds: roleIds.length ? roleIds : undefined },
		})
	}
}
