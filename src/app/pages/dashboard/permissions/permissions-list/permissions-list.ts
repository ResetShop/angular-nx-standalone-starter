import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PermissionsStore } from '@store/permissions/permissions.store';

@Component({
	selector: 'app-permissions-list',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		@if (store.isLoading()) {
			<p>Loading permissions...</p>
		} @else if (store.error()) {
			<p>{{ store.error() }}</p>
		} @else {
			@for (group of store.permissionsGroupedArray(); track group.resource) {
				<h3>{{ group.resource }}</h3>
				@for (permission of group.permissions; track permission.id) {
					<div>{{ permission.name }} — {{ permission.action }}</div>
				}
			}
		}
	`,
})
export default class PermissionsList {
	protected readonly store = inject(PermissionsStore);

	constructor() {
		void this.store.loadPermissions();
	}
}
