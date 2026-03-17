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
import { UsersStore } from '@store/users/users.store'
import { parseDurationToMs } from '@utils/duration'
import { RoleSelector } from '../role-selector/role-selector'

interface CreateUserFormModel {
	email: string
	firstName: string
	lastName: string
	roleIds: number[]
	mustChangePassword: boolean
}

// Module-level for readability — mirrors the roles drawer pattern (used by model.set and onDrawerClosed)
const EMPTY_MODEL: CreateUserFormModel = {
	email: '',
	firstName: '',
	lastName: '',
	roleIds: [],
	mustChangePassword: true,
}

@Component({
	selector: 'app-create-user-drawer',
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
		<app-drawer (closed)="onDrawerClosed()" [closeOnBackdrop]="false" class="w-lg" title="Create User" #drawer>
			<form (submit)="onSubmit($event)" id="create-user-form" class="flex h-full flex-col gap-4">
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

				<app-form-field label="Must change password on first login">
					<input [formField]="userForm.mustChangePassword" type="checkbox" />
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
					<button [disabled]="showSubmitSpinner() || !isFormValid()" appButton type="submit" form="create-user-form">
						@if (showSubmitSpinner()) {
							<app-spinner data-icon="start" />
						}
						{{ showSubmitSpinner() ? 'Creating...' : 'Create' }}
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
export class CreateUserDrawer {
	private readonly usersStore = inject(UsersStore)
	protected readonly rolesStore = inject(RolesStore)
	protected readonly drawer = viewChild.required<Drawer>('drawer')
	private readonly discardDialog = viewChild.required<ConfirmDialog>('discardDialog')

	protected readonly model = signal<CreateUserFormModel>({ ...EMPTY_MODEL })
	protected readonly userForm = form(
		this.model,
		schema<CreateUserFormModel>((user) => {
			required(user.email)
			emailValidator(user.email)
			required(user.firstName)
			maxLength(user.firstName, 100)
			required(user.lastName)
			maxLength(user.lastName, 100)
		}),
	)

	protected readonly isFormValid = computed(() => this.userForm().errors().length === 0)
	protected readonly isCreating = computed(() => this.usersStore.isCreating())
	protected readonly showSubmitSpinner = computed(() => this.isCreating() || this.closingAfterSuccess())
	protected readonly mutationError = computed(() => this.usersStore.mutationError().create)

	private readonly closingAfterSuccess = signal(false)
	private submitted = false

	constructor() {
		effect(() => this.closeOnSuccess())
	}

	private closeOnSuccess(): void {
		const creating = this.usersStore.isCreating()
		const error = this.usersStore.mutationError().create
		untracked(() => {
			if (!creating && this.submitted && error === null) {
				this.submitted = false
				this.closingAfterSuccess.set(true)
				setTimeout(() => {
					this.closingAfterSuccess.set(false)
					this.drawer().close()
				}, parseDurationToMs('1s'))
			}
		})
	}

	public open(): void {
		this.rolesStore.loadAllRoles()
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
		this.submitted = false
		this.model.set({ ...EMPTY_MODEL })
		this.userForm().reset()
		this.usersStore.clearMutationError('create')
	}

	protected onSubmit(event: Event): void {
		event.preventDefault()
		if (!this.isFormValid()) return

		const { email, firstName, lastName, roleIds, mustChangePassword } = this.model()
		this.submitted = true
		this.usersStore.createUser({
			email,
			firstName,
			lastName,
			roleIds: roleIds.length ? roleIds : undefined,
			mustChangePassword,
		})
	}
}
