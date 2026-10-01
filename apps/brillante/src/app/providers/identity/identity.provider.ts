import { makeEnvironmentProviders } from '@angular/core'
import { provideAuth0 } from '@auth0/auth0-angular'
import { environment } from '../../environments/environment'
import { Auth0IdentityApi } from './identity'
import { IdentityApi } from './identity.interface'

export function provideIdentity() {
	return makeEnvironmentProviders([
		provideAuth0({
			domain: environment.auth0.domain,
			clientId: environment.auth0.clientId,
			authorizationParams: {
				audience: environment.auth0.audience,
				redirect_uri: window.location.origin,
			},
			cacheLocation: 'localstorage',
		}),
		{ provide: IdentityApi, useExisting: Auth0IdentityApi },
	])
}
