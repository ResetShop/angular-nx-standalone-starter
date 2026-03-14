import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import {
	form,
	maxLength,
	pattern,
	required,
	schema,
	FormField as SignalFormField,
	type FieldTree,
} from '@angular/forms/signals';
import { Button } from '@components/button/button';
import { Drawer } from '@components/drawer/drawer';
import { DrawerFooter } from '@components/drawer/drawer-footer';
import { FormField } from '@components/form-field/form-field';
import { PermissionsStore } from '@store/permissions/permissions.store';
import { RolesStore } from '@store/roles/roles.store';
import { PermissionSelector } from '../permission-selector/permission-selector';

interface RoleFormModel {
	name: string;
	code: string;
	description: string;
}

@Component({
	selector: 'app-role-form-drawer',
	standalone: true,
	imports: [Drawer, DrawerFooter, FormField, SignalFormField, Button, PermissionSelector],
	template: `
		<app-drawer [title]="drawerTitle()" #drawer>
			<form (submit)="onSubmit($event)" class="flex h-full flex-col gap-4">
				<app-form-field label="Name">
					<input [formField]="roleForm.name" type="text" />
				</app-form-field>

				@if (mode() === 'edit') {
					<div>
						<span class="text-foreground block text-sm/6 font-medium">Code</span>
						<div class="border-input bg-muted mt-2 block w-full rounded-lg border px-3 py-2 text-sm opacity-60">
							{{ model().code }}
						</div>
						<p class="text-muted-foreground mt-1.5 text-sm">Code cannot be changed</p>
					</div>
				} @else {
					<app-form-field label="Code" hint="Lowercase alphanumeric with underscores">
						<input [formField]="roleForm.code" type="text" />
					</app-form-field>
				}

				<app-form-field [showRequired]="false" label="Description">
					<textarea [formField]="roleForm.description" rows="3"></textarea>
				</app-form-field>

				@if (permissionsStore.permissionsGroupedArray().length > 0) {
					<div class="flex min-h-0 flex-1 flex-col">
						<h3 class="mb-2 text-sm font-medium text-gray-900 dark:text-white">Permissions</h3>
						<div class="min-h-0 flex-1 overflow-y-auto rounded-md border border-gray-200 p-3 dark:border-gray-700">
							<app-permission-selector
								(selectionChange)="onPermissionSelectionChange($event)"
								[groups]="permissionsStore.permissionsGroupedArray()"
								[selectedIds]="selectedPermissionIds()"
							/>
						</div>
					</div>
				}
			</form>

			<ng-template appDrawerFooter>
				<div class="flex justify-end gap-3">
					<button (click)="drawer.close()" appButton variant="outline">Cancel</button>
					<button (click)="onSubmit($event)" [disabled]="!isFormValid()" appButton>
						{{ mode() === 'create' ? 'Create' : 'Save' }}
					</button>
				</div>
			</ng-template>
		</app-drawer>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleFormDrawer {
	protected readonly rolesStore = inject(RolesStore);
	protected readonly permissionsStore = inject(PermissionsStore);

	private readonly drawer = viewChild.required<Drawer>('drawer');

	protected readonly mode = signal<'create' | 'edit'>('create');
	private readonly editRoleId = signal<number | null>(null);
	protected readonly selectedPermissionIds = signal<number[]>([]);

	protected readonly drawerTitle = computed(() => (this.mode() === 'create' ? 'Create Role' : 'Edit Role'));

	protected readonly model = signal<RoleFormModel>({ name: '', code: '', description: '' });
	protected readonly roleForm: FieldTree<RoleFormModel> = form(
		this.model,
		schema<RoleFormModel>((role) => {
			required(role.name);
			maxLength(role.name, 100);
			required(role.code);
			maxLength(role.code, 50);
			pattern(role.code, /^[a-z][a-z0-9_]*$/);
			maxLength(role.description, 500);
		}),
	);

	protected readonly isFormValid = computed(() => this.roleForm().errors().length === 0);

	constructor() {
		effect(() => {
			const role = this.rolesStore.selectedRole();
			if (this.mode() === 'edit' && role && role.id === this.editRoleId()) {
				this.model.set({
					name: role.name,
					code: role.code,
					description: role.description ?? '',
				});
				this.selectedPermissionIds.set(role.permissions.map((p) => p.id));
			}
		});
	}

	openForCreate(): void {
		this.mode.set('create');
		this.editRoleId.set(null);
		this.model.set({ name: '', code: '', description: '' });
		this.selectedPermissionIds.set([]);
		this.drawer().show();
	}

	openForEdit(roleId: number): void {
		this.mode.set('edit');
		this.editRoleId.set(roleId);
		this.rolesStore.loadRole(roleId);
		this.drawer().show();
	}

	protected onPermissionSelectionChange(ids: number[]): void {
		this.selectedPermissionIds.set(ids);
	}

	protected onSubmit(event: Event): void {
		event.preventDefault();
		if (!this.isFormValid()) return;

		const { name, code, description } = this.model();

		if (this.mode() === 'create') {
			this.rolesStore.createRoleWithPermissions({
				name,
				code,
				description: description || undefined,
				permissionIds: this.selectedPermissionIds(),
			});
		} else {
			const id = this.editRoleId();
			if (!id) return;
			this.rolesStore.updateRoleWithPermissions({
				id,
				body: { name, description: description || undefined },
				permissionIds: this.selectedPermissionIds(),
			});
		}

		this.drawer().close();
	}
}
