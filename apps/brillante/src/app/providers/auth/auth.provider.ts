import { type EnvironmentProviders, inject, makeEnvironmentProviders, type Provider } from '@angular/core'
import { CURRENT_USER_SOURCE } from '@resetshop/angular-core/auth/current-user.token'
import { NAVIGATION_PERMISSION_CHECK } from '@resetshop/angular-core/navigation/navigation'
import { AuthStore } from '@store/auth/auth.store'
import { HttpAuthApi } from './auth'
import { AuthApi } from './auth.interface'

type AuthFeatureKind = 'navigation-permission-check'

export interface AuthFeature {
	readonly kind: AuthFeatureKind
	readonly providers: Provider[]
}

/**
 * Opt-in feature that wires the navigation library's permission check to `AuthStore`.
 * Returns `true` while no user is signed in so the sidebar does not flicker as a
 * permission-stripped list during logout; route-level access stays enforced by `permissionGuard`.
 */
export function withNavigationPermissionCheck(): AuthFeature {
	return {
		kind: 'navigation-permission-check',
		providers: [
			{
				provide: NAVIGATION_PERMISSION_CHECK,
				useFactory: () => {
					const store = inject(AuthStore)
					return (permission: string) => {
						const user = store.currentUser()
						if (!user) return true
						return user.hasPermission(permission)
					}
				},
			},
		],
	}
}

export function provideAuth(...features: AuthFeature[]): EnvironmentProviders {
	return makeEnvironmentProviders([
		{ provide: AuthApi, useExisting: HttpAuthApi },
		{ provide: CURRENT_USER_SOURCE, useExisting: AuthStore },
		...features.flatMap((feature) => feature.providers),
	])
}
