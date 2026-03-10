import { ChangeDetectionStrategy, Component, input, viewChild } from '@angular/core';
import { Drawer } from '@components/drawer/drawer';
import { DrawerHeader } from '@components/drawer/drawer-header';
import type { IRole } from '@domain/access/role.interface';

@Component({
	selector: 'app-role-form-drawer',
	standalone: true,
	imports: [Drawer, DrawerHeader],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<app-drawer #drawerRef>
			<ng-template appDrawerHeader>
				<h2>{{ mode() === 'create' ? 'Create Role' : 'Edit Role' }}</h2>
			</ng-template>
			<p>Form placeholder — full implementation in follow-up issue.</p>
		</app-drawer>
	`,
})
export class RoleFormDrawer {
	readonly mode = input<'create' | 'edit'>('create');
	readonly role = input<IRole | null>(null);

	private readonly drawerRef = viewChild.required(Drawer);

	open(): void {
		this.drawerRef().show();
	}

	close(): void {
		this.drawerRef().close();
	}
}
