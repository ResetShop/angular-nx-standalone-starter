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
import { disabled, form, maxLength, required, schema, FormField as SignalFormField } from '@angular/forms/signals'
import { Alert, AlertDescription } from '@components/alert/alert'
import { Button } from '@components/button/button'
import { ConfirmDialog } from '@components/confirm-dialog/confirm-dialog'
import { Drawer } from '@components/drawer/drawer'
import { DrawerFooter } from '@components/drawer/drawer-footer'
import { FormField } from '@components/form-field/form-field'
import { Spinner } from '@components/spinner/spinner'
import { PermissionsStore } from '@store/permissions/permissions.store'
import { RolesStore } from '@store/roles/roles.store'
import { parseDurationToMs } from '@utils/duration'
import { toSnakeCode } from '@utils/slug'
import { PermissionSelector } from '../permission-selector/permission-selector'

interface CreateRoleFormModel {
	name: string
	code: string
	description: string
	permissionIds: number[]
}

const EMPTY_MODEL: CreateRoleFormModel = { name: '', code: '', description: '', permissionIds: [] }

@Component({
	selector: 'app-create-role-drawer',
	standalone: true,
	imports: [
		Drawer,
		DrawerFooter,
		FormField,
		SignalFormField,
		Button,
		Spinner,
		PermissionSelector,
		Alert,
		AlertDescription,
		ConfirmDialog,
	],
	template: `
		<app-drawer (closed)="onDrawerClosed()" [closeOnBackdrop]="false" class="w-lg" title="Create Role" #drawer>
			<form (submit)="onSubmit($event)" id="create-role-form" class="flex h-full flex-col gap-4">
				@if (mutationError()) {
					<div appAlert variant="destructive">
						<p appAlertDescription>{{ mutationError() }}</p>
					</div>
				}

				<app-form-field label="Name">
					<input [formField]="roleForm.name" type="text" autocomplete="off" />
				</app-form-field>

				<app-form-field label="Code" hint="Auto-generated from name">
					<input [formField]="roleForm.code" type="text" />
				</app-form-field>

				<app-form-field label="Description">
					<textarea [formField]="roleForm.description" rows="3"></textarea>
				</app-form-field>

				@if (permissionsStore.permissionsGroupedArray().length > 0) {
					<app-form-field label="Permissions" class="flex min-h-0 flex-1 flex-col">
						<app-permission-selector
							[formField]="roleForm.permissionIds"
							[groups]="permissionsStore.permissionsGroupedArray()"
						/>
					</app-form-field>
				}
			</form>

			<ng-template appDrawerFooter>
				<div class="flex justify-end gap-3">
					<button (click)="onCancel()" appButton variant="outline">Cancel</button>
					<button [disabled]="showSubmitSpinner() || !isFormValid()" appButton type="submit" form="create-role-form">
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
export class CreateRoleDrawer {
	private readonly rolesStore = inject(RolesStore)
	protected readonly permissionsStore = inject(PermissionsStore)
	protected readonly drawer = viewChild.required<Drawer>('drawer')
	private readonly discardDialog = viewChild.required<ConfirmDialog>('discardDialog')

	private readonly model = signal<CreateRoleFormModel>({ ...EMPTY_MODEL })
	protected readonly roleForm = form(
		this.model,
		schema<CreateRoleFormModel>((role) => {
			required(role.name)
			required(role.code)
			maxLength(role.name, 100)
			disabled(role.code)
			maxLength(role.description, 500)
		}),
	)

	protected readonly isFormValid = computed(() => this.roleForm().errors().length === 0)
	protected readonly isCreating = computed(() => this.rolesStore.isCreating())
	protected readonly showSubmitSpinner = computed(() => this.isCreating() || this.closingAfterSuccess())
	protected readonly mutationError = computed(() => this.rolesStore.mutationError().create)

	private readonly closingAfterSuccess = signal(false)
	private readonly nameValue = computed(() => this.model().name)
	private submitted = false

	constructor() {
		effect(() => {
			const code = toSnakeCode(this.nameValue())
			untracked(() => this.model.update((m) => ({ ...m, code })))
		})

		effect(() => this.closeOnSuccess())
	}

	private closeOnSuccess(): void {
		const creating = this.rolesStore.isCreating()
		const error = this.rolesStore.mutationError().create
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
		this.drawer().show()
		this.drawer().setContentReady()
	}

	protected onCancel(): void {
		if (this.roleForm().dirty()) {
			this.discardDialog().show()
		} else {
			this.drawer().close()
		}
	}

	protected onDrawerClosed(): void {
		this.submitted = false
		this.model.set({ ...EMPTY_MODEL })
		this.roleForm().reset()
		this.rolesStore.clearMutationError('create')
	}

	protected onSubmit(event: Event): void {
		event.preventDefault()
		if (!this.isFormValid()) return

		const { name, code, description, permissionIds } = this.model()
		this.submitted = true
		this.rolesStore.createRoleWithPermissions({
			name,
			code,
			description: description || undefined,
			permissionIds,
		})
	}
}
