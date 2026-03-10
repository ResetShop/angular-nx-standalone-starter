import { ChangeDetectionStrategy, Component, input, viewChild } from '@angular/core';
import { Drawer } from '@components/drawer/drawer';
import { DrawerHeader } from '@components/drawer/drawer-header';
import type { IManagedUser } from '@domain/user-management/managed-user.interface';

@Component({
	selector: 'app-user-form-drawer',
	standalone: true,
	imports: [Drawer, DrawerHeader],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<app-drawer #drawerRef>
			<ng-template appDrawerHeader>
				<h2>{{ mode() === 'create' ? 'Create User' : 'Edit User' }}</h2>
			</ng-template>
			<p>Form placeholder — full implementation in follow-up issue.</p>
		</app-drawer>
	`,
})
export class UserFormDrawer {
	readonly mode = input<'create' | 'edit'>('create');
	readonly user = input<IManagedUser | null>(null);

	private readonly drawerRef = viewChild.required(Drawer);

	open(): void {
		this.drawerRef().show();
	}

	close(): void {
		this.drawerRef().close();
	}
}
