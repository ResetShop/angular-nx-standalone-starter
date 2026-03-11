import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Pagination } from '@components/pagination/pagination';
import { UsersStore } from '@store/users/users.store';

@Component({
	selector: 'app-users-list',
	standalone: true,
	imports: [Pagination],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		@if (store.isLoadingList()) {
			<p>Loading users...</p>
		} @else if (store.listError()) {
			<p>{{ store.listError() }}</p>
		} @else {
			@for (user of store.users(); track user.id) {
				<div>{{ user.fullName }} — {{ user.status }}</div>
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
export default class UsersList {
	protected readonly store = inject(UsersStore);
}
