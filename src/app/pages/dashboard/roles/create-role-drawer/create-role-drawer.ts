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
import { Button } from '@components/button/button';
import { Drawer } from '@components/drawer/drawer';
import { DrawerFooter } from '@components/drawer/drawer-footer';
import { FormField } from '@components/form-field/form-field';
import { PermissionsStore } from '@store/permissions/permissions.store';
import { RolesStore } from '@store/roles/roles.store';
import { toSnakeCode } from '@utils/slug';
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
		<app-drawer (closed)="onDrawerClosed()" class="w-lg" title="Create Role" #drawer>
			<form (submit)="onSubmit($event)" class="flex h-full flex-col gap-4">
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
			required(role.code);
			required(role.description);
			maxLength(role.name, 100);
			disabled(role.code);
			maxLength(role.description, 500);
		}),
	);

	protected readonly isFormValid = computed(() => this.roleForm().errors().length === 0);

	private readonly nameValue = computed(() => this.model().name);

	constructor() {
		effect(() => {
			const code = toSnakeCode(this.nameValue());
			untracked(() => this.model.update((m) => ({ ...m, code })));
		});
	}

	open(): void {
		this.drawer().show();
	}

	protected onDrawerClosed(): void {
		this.model.set({ name: '', code: '', description: '', permissionIds: [] });
		this.roleForm().reset();
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
