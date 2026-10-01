import { provideToast } from '@components/toast/toast.provider'
import { provideCustomer } from '@providers/customer/customer.provider'
import type { NamedRoute } from '@resetshop/angular-core/interfaces/navigation'
import { CustomersStore } from '@store/customers/customers.store'

export default [
	{
		path: '',
		title: '',
		// The customer API, its store and the toast bridge live once on the section's parent route,
		// so every page below shares the same CustomersStore instance.
		providers: [provideCustomer(), CustomersStore, provideToast()],
		children: [
			{
				path: '',
				title: 'CLIENTS.PAGE.TITLE',
				pathMatch: 'full',
				// Reading is guarded by the dashboard route; writes (create, edit) need CLIENTS_MANAGE and are gated inside the page.
				loadComponent: () => import('./clients-list/clients-list'),
			},
		],
	},
] satisfies NamedRoute[]
