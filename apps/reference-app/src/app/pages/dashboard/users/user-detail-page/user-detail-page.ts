import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { PageShell } from '@components/page-shell/page-shell'
import { UserStatus } from '@contracts/user/user.constants'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { featherArrowLeft } from '@ng-icons/feather-icons'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import { Badge } from '@resetshop/ui/badge/badge'
import { UsersStore } from '@store/users/users.store'
import { UserAccountActions } from './user-account-actions'
import { UserDangerZone } from './user-danger-zone'
import { UserProfileSection } from './user-profile-section'
import { UserRolesSection } from './user-roles-section'

@Component({
	selector: 'app-user-detail-page',
	standalone: true,
	imports: [
		PageShell,
		Badge,
		NgIcon,
		RouterLink,
		UserProfileSection,
		UserRolesSection,
		UserAccountActions,
		UserDangerZone,
		TranslatePipe,
	],
	viewProviders: [provideIcons({ featherArrowLeft })],
	template: `
		<a
			routerLink="/dashboard/users"
			class="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-2 text-sm font-medium"
		>
			<ng-icon name="featherArrowLeft" size="16" />
			{{ 'USERS.DETAIL.BACK' | translate }}
		</a>

		<app-page-shell [title]="pageTitle()" [loading]="store.isLoadingDetail()" [error]="store.readError().detail">
			@if (store.selectedUser(); as user) {
				<div class="flex items-center gap-3">
					<span [variant]="user.status === UserStatus.ACTIVE ? 'default' : 'destructive'" appBadge>
						{{ statusLabel(user.status) | translate }}
					</span>
				</div>

				<app-user-profile-section [user]="user" />
				<app-user-roles-section [user]="user" />
				<app-user-account-actions [user]="user" />
				<app-user-danger-zone [user]="user" />
			}
		</app-page-shell>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class UserDetailPage {
	protected readonly store = inject(UsersStore)
	protected readonly UserStatus = UserStatus

	private readonly route = inject(ActivatedRoute)
	private readonly translation = inject(Translation)

	protected readonly pageTitle = computed(
		() => this.store.selectedUser()?.fullName ?? this.translation.instant('USERS.DETAIL.TITLE'),
	)

	constructor() {
		// Read the snapshot once — no reactive re-fetch needed since the route id is stable.
		const id = Number(this.route.snapshot.paramMap.get('id'))
		if (Number.isInteger(id) && id > 0) {
			this.store.loadUser(id)
		}
	}

	protected statusLabel(status: UserStatus): string {
		const labels = {
			[UserStatus.ACTIVE]: 'COMMON.STATUS.ACTIVE',
			[UserStatus.DISABLED]: 'COMMON.STATUS.DISABLED',
			[UserStatus.DELETED]: 'COMMON.STATUS.DELETED',
		} as const
		return labels[status]
	}
}
