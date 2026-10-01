import { AuthApi } from '@providers/auth/auth.interface'
import { InMemoryAuthApi } from '@providers/auth/auth.mock'
import { provideTranslationMock } from '@providers/i18n/translation.mock'
import { IdentityApi } from '@providers/identity/identity.interface'
import { InMemoryIdentityApi } from '@providers/identity/identity.mock'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { AuthStore } from '@store/auth/auth.store'
import { render, screen } from '@testing-library/angular'
import userEvent from '@testing-library/user-event'
import Login from './login'

describe('Login', () => {
	let identityApi: InMemoryIdentityApi

	beforeEach(() => {
		clearAllMocks()
		localStorage.clear()
		identityApi = new InMemoryIdentityApi()
	})

	async function renderLogin(authApi = new InMemoryAuthApi()) {
		return render(Login, {
			providers: [
				provideTranslationMock(),
				{ provide: IdentityApi, useValue: identityApi },
				{ provide: AuthApi, useValue: authApi },
			],
		})
	}

	it('presents the application and a sign-in button', async () => {
		await renderLogin()

		expect(screen.getByRole('heading', { name: 'SHELL.LOGIN.TITLE' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'SHELL.LOGIN.BUTTON' })).toBeEnabled()
	})

	it('redirects to the identity provider when the user signs in', async () => {
		const user = userEvent.setup()
		await renderLogin()

		await user.click(screen.getByRole('button', { name: 'SHELL.LOGIN.BUTTON' }))

		expect(identityApi.loginRedirects).toBe(1)
	})

	it('shows an alert when the last sign-in attempt failed', async () => {
		const authApi = new InMemoryAuthApi()
		authApi.setError('authenticate', new Error('unknown user'))
		identityApi.profile = { email: 'ghost@brillante.test' }
		const { fixture } = await renderLogin(authApi)

		fixture.debugElement.injector.get(AuthStore).login()
		fixture.detectChanges()

		expect(await screen.findByRole('alert')).toHaveTextContent('SHELL.LOGIN.ERROR')
	})
})
