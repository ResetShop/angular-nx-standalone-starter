import {
	ChangeDetectionStrategy,
	Component,
	computed,
	effect,
	inject,
	signal,
	untracked,
	viewChild,
} from '@angular/core';
import { disabled, form, maxLength, required, schema, FormField as SignalFormField } from '@angular/forms/signals';
import { Alert, AlertDescription } from '@components/alert/alert';
import { Button } from '@components/button/button';
import { Drawer } from '@components/drawer/drawer';
import { DrawerFooter } from '@components/drawer/drawer-footer';
import { FormField } from '@components/form-field/form-field';
import { PermissionsStore } from '@store/permissions/permissions.store';
import { RolesStore } from '@store/roles/roles.store';
import { PermissionSelector } from '../permission-selector/permission-selector';

interface EditRoleFormModel {
	name: string;
	code: string;
	description: string;
	permissionIds: number[];
}

@Component({
	selector: 'app-edit-role-drawer',
	standalone: true,
	imports: [Drawer, DrawerFooter, FormField, SignalFormField, Button, PermissionSelector, Alert, AlertDescription],
	template: `
		<app-drawer (closed)="onDrawerClosed()" class="w-lg" title="Edit Role" #drawer>
			<form (submit)="onSubmit($event)" class="flex h-full flex-col gap-4">
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
					<button (click)="drawer.close()" appButton variant="outline">Cancel</button>
					<button (click)="onSubmit($event)" [disabled]="drawer.showSpinner() || !isFormValid()" appButton>Save</button>
				</div>
			</ng-template>
		</app-drawer>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditRoleDrawer {
	private readonly rolesStore = inject(RolesStore);
	protected readonly permissionsStore = inject(PermissionsStore);
	private readonly drawer = viewChild.required<Drawer>('drawer');

	private readonly editRoleId = signal<number | null>(null);

	private readonly model = signal<EditRoleFormModel>({ name: '', code: '', description: '', permissionIds: [] });
	protected readonly roleForm = form(
		this.model,
		schema<EditRoleFormModel>((role) => {
			required(role.name);
			required(role.code);
			maxLength(role.name, 100);
			disabled(role.code);
			maxLength(role.description, 500);
		}),
	);

	protected readonly isFormValid = computed(() => this.roleForm().errors().length === 0);
	protected readonly mutationError = computed(() => this.rolesStore.mutationError().update);

	private submitted = false;

	constructor() {
		// Populates form when selectedRole loads — editRoleId guards against stale data
		effect(() => {
			const role = this.rolesStore.selectedRole();
			if (role && role.id === this.editRoleId()) {
				this.model.set({
					name: role.name,
					code: role.code,
					description: role.description ?? '',
					permissionIds: role.permissions.map((p) => p.id),
				});
				this.drawer().setContentReady();
			}
		});

		effect(() => this.closeOnSuccess());
	}

	private closeOnSuccess(): void {
		const updating = this.rolesStore.isUpdating();
		const error = this.rolesStore.mutationError().update;
		untracked(() => {
			if (!updating && this.submitted && error === null) {
				this.submitted = false;
				this.drawer().close();
			}
		});
	}

	open(roleId: number): void {
		this.editRoleId.set(roleId);
		this.rolesStore.loadRole(roleId);
		this.drawer().showWithLoading();
	}

	protected onDrawerClosed(): void {
		this.submitted = false;
		this.editRoleId.set(null);
		this.model.set({ name: '', code: '', description: '', permissionIds: [] });
		this.roleForm().reset();
		this.rolesStore.clearMutationError('update');
	}

	protected onSubmit(event: Event): void {
		event.preventDefault();
		if (!this.isFormValid()) return;

		const id = this.editRoleId();
		if (!id) return;

		const { name, description, permissionIds } = this.model();
		this.submitted = true;
		this.rolesStore.updateRoleWithPermissions({
			id,
			body: { name, description: description || undefined },
			permissionIds,
		});
	}
}
