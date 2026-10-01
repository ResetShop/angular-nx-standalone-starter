import { provideToast } from '@components/toast/toast.provider'
import { provideCustomer } from '@providers/customer/customer.provider'
import { provideUser } from '@providers/user/user.provider'
import type { NamedRoute } from '@resetshop/angular-core/interfaces/navigation'
import { ProfileStore } from '@store/customers/profile.store'

export default [
	{
		path: '',
		title: '',
		// The user and customer APIs, the profile store and the toast bridge live once on the
		// section's parent route, so the profile page shares them with any page added below.
		providers: [provideUser(), provideCustomer(), ProfileStore, provideToast()],
		children: [
			{
				path: '',
				title: 'PROFILE.TITLE',
				pathMatch: 'full',
				loadComponent: () => import('./profile-page/profile-page'),
			},
		],
	},
] satisfies NamedRoute[]
