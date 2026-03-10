import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Pagination } from '@components/pagination/pagination';
import { RolesStore } from '@store/roles/roles.store';

@Component({
	selector: 'app-roles-list',
	standalone: true,
	imports: [Pagination],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		@if (store.isLoadingList()) {
			<p>Loading roles...</p>
		} @else if (store.listError()) {
			<p>{{ store.listError() }}</p>
		} @else {
			@for (role of store.roles(); track role.id) {
				<div>{{ role.name }} — {{ role.code }}</div>
			}
			<app-pagination
				(pageChange)="store.setPage($event)"
				(pageSizeChange)="store.setPageSize($event)"
				[currentPage]="store.currentPage()"
				[totalPages]="store.totalPages()"
				[pageSize]="store.pageSize()"
			/>
		}
	`,
})
export default class RolesList {
	protected readonly store = inject(RolesStore);

	constructor() {
		void this.store.loadRoles();
	}
}
