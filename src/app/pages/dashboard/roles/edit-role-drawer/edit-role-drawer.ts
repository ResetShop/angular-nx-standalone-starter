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
import { PermissionSelector } from '../permission-selector/permission-selector'

interface EditRoleFormModel {
	name: string
	code: string
	description: string
	permissionIds: number[]
}

const EMPTY_MODEL: EditRoleFormModel = { name: '', code: '', description: '', permissionIds: [] }

@Component({
	selector: 'app-edit-role-drawer',
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
		<app-drawer (closed)="onDrawerClosed()" [closeOnBackdrop]="false" class="w-lg" title="Edit Role" #drawer>
			<form (submit)="onSubmit($event)" id="edit-role-form" class="flex h-full flex-col gap-4">
				@if (mutationError()) {
					<div appAlert variant="destructive">
						<p appAlertDescription>{{ mutationError() }}</p>
					</div>
				}

				<app-form-field label="Name">
					<input [formField]="roleForm.name" type="text" autocomplete="off" />
				</app-form-field>

				<app-form-field label="Code" hint="Code cannot be changed">
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
					<button
						[disabled]="drawer.showSpinner() || showSubmitSpinner() || !isFormValid()"
						appButton
						type="submit"
						form="edit-role-form"
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
export class EditRoleDrawer {
	private readonly rolesStore = inject(RolesStore)
	protected readonly permissionsStore = inject(PermissionsStore)
	protected readonly drawer = viewChild.required<Drawer>('drawer')
	private readonly discardDialog = viewChild.required<ConfirmDialog>('discardDialog')

	private readonly editRoleId = signal<number | null>(null)

	private readonly model = signal<EditRoleFormModel>({ ...EMPTY_MODEL })
	protected readonly roleForm = form(
		this.model,
		schema<EditRoleFormModel>((role) => {
			required(role.name)
			required(role.code)
			maxLength(role.name, 100)
			disabled(role.code)
			maxLength(role.description, 500)
		}),
	)

	protected readonly isFormValid = computed(() => this.roleForm().errors().length === 0)
	protected readonly isUpdating = computed(() => this.rolesStore.isUpdating())
	protected readonly showSubmitSpinner = computed(() => this.isUpdating() || this.closingAfterSuccess())
	protected readonly mutationError = computed(() => this.rolesStore.mutationError().update)

	private readonly closingAfterSuccess = signal(false)
	private submitted = false

	constructor() {
		// Populates form when selectedRole loads — editRoleId guards against stale data
		effect(() => {
			const role = this.rolesStore.selectedRole()
			if (role && role.id === this.editRoleId()) {
				this.model.set({
					name: role.name,
					code: role.code,
					description: role.description ?? '',
					permissionIds: role.permissions.map((p) => p.id),
				})
				this.drawer().setContentReady()
			}
		})

		effect(() => this.closeOnSuccess())
	}

	private closeOnSuccess(): void {
		const updating = this.rolesStore.isUpdating()
		const error = this.rolesStore.mutationError().update
		untracked(() => {
			if (!updating && this.submitted && error === null) {
				this.submitted = false
				this.closingAfterSuccess.set(true)
				setTimeout(() => {
					this.closingAfterSuccess.set(false)
					this.drawer().close()
				}, parseDurationToMs('1s'))
			}
		})
	}

	public open(roleId: number): void {
		this.editRoleId.set(roleId)
		this.rolesStore.loadRole(roleId)
		this.drawer().show()
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
		this.editRoleId.set(null)
		this.model.set({ ...EMPTY_MODEL })
		this.roleForm().reset()
		this.rolesStore.clearMutationError('update')
	}

	protected onSubmit(event: Event): void {
		event.preventDefault()
		if (!this.isFormValid()) return

		const id = this.editRoleId()
		if (!id) return

		const { name, description, permissionIds } = this.model()
		this.submitted = true
		this.rolesStore.updateRoleWithPermissions({
			id,
			body: { name, description: description || undefined },
			permissionIds,
		})
	}
}
