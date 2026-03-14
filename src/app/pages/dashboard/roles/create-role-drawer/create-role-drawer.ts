import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { form, maxLength, pattern, required, schema, FormField as SignalFormField } from '@angular/forms/signals';
import { Button } from '@components/button/button';
import { Drawer } from '@components/drawer/drawer';
import { DrawerFooter } from '@components/drawer/drawer-footer';
import { FormField } from '@components/form-field/form-field';
import { PermissionsStore } from '@store/permissions/permissions.store';
import { RolesStore } from '@store/roles/roles.store';
import { PermissionSelector } from '../permission-selector/permission-selector';

interface CreateRoleFormModel {
	name: string;
	code: string;
	description: string;
	permissionIds: number[];
}

@Component({
	selector: 'app-create-role-drawer',
	standalone: true,
	imports: [Drawer, DrawerFooter, FormField, SignalFormField, Button, PermissionSelector],
	template: `
		<app-drawer title="Create Role" #drawer>
			<form (submit)="onSubmit($event)" class="flex h-full flex-col gap-4">
				<app-form-field label="Name">
					<input [formField]="roleForm.name" type="text" autocomplete="off" />
				</app-form-field>

				<app-form-field label="Code" hint="Lowercase alphanumeric with underscores">
					<input [formField]="roleForm.code" type="text" />
				</app-form-field>

				<app-form-field [showRequired]="false" label="Description">
					<textarea [formField]="roleForm.description" rows="3"></textarea>
				</app-form-field>

				@if (permissionsStore.permissionsGroupedArray().length > 0) {
					<div class="flex min-h-0 flex-1 flex-col">
						<h3 class="mb-2 text-sm font-medium text-gray-900 dark:text-white">Permissions</h3>
						<div class="min-h-0 flex-1 overflow-y-auto rounded-md border border-gray-200 p-3 dark:border-gray-700">
							<app-permission-selector
								[formField]="roleForm.permissionIds"
								[groups]="permissionsStore.permissionsGroupedArray()"
							/>
						</div>
					</div>
				}
			</form>

			<ng-template appDrawerFooter>
				<div class="flex justify-end gap-3">
					<button (click)="drawer.close()" appButton variant="outline">Cancel</button>
					<button (click)="onSubmit($event)" [disabled]="!isFormValid()" appButton>Create</button>
				</div>
			</ng-template>
		</app-drawer>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateRoleDrawer {
	private readonly rolesStore = inject(RolesStore);
	protected readonly permissionsStore = inject(PermissionsStore);
	private readonly drawer = viewChild.required<Drawer>('drawer');

	private readonly model = signal<CreateRoleFormModel>({ name: '', code: '', description: '', permissionIds: [] });
	protected readonly roleForm = form(
		this.model,
		schema<CreateRoleFormModel>((role) => {
			required(role.name);
			maxLength(role.name, 100);
			required(role.code);
			maxLength(role.code, 50);
			pattern(role.code, /^[a-z][a-z0-9_]*$/);
			maxLength(role.description, 500);
		}),
	);

	protected readonly isFormValid = computed(() => this.roleForm().errors().length === 0);

	open(): void {
		this.model.set({ name: '', code: '', description: '', permissionIds: [] });
		this.drawer().show();
	}

	protected onSubmit(event: Event): void {
		event.preventDefault();
		if (!this.isFormValid()) return;

		const { name, code, description, permissionIds } = this.model();
		this.rolesStore.createRoleWithPermissions({
			name,
			code,
			description: description || undefined,
			permissionIds,
		});

		this.drawer().close();
	}
}
