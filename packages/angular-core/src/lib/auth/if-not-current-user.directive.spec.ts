import { Component, input, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { render, screen } from '@testing-library/angular'
import { CURRENT_USER_SOURCE, type CurrentUserSource } from './current-user.token'
import { IfNotCurrentUserDirective } from './if-not-current-user.directive'

@Component({
	selector: 'app-test-host',
	standalone: true,
	imports: [IfNotCurrentUserDirective],
	template: `
		<span *ifNotCurrentUser="entity()" data-testid="gated-content">Show me</span>
		<span data-testid="always-visible">Always here</span>
	`,
})
class TestHost {
	public readonly entity = input<{ id: number } | null | undefined>({ id: 1 })
}

describe('IfNotCurrentUserDirective', () => {
	let currentUser: ReturnType<typeof signal<{ id: number } | null>>

	beforeEach(() => {
		clearAllMocks()
		currentUser = signal<{ id: number } | null>({ id: 42 })
	})

	async function renderHost(entity: { id: number } | null | undefined = { id: 1 }) {
		const source: CurrentUserSource = { currentUser }
		return render(TestHost, {
			componentInputs: { entity },
			providers: [{ provide: CURRENT_USER_SOURCE, useValue: source }],
		})
	}

	it('renders the template when the entity id differs from the current user id', async () => {
		await renderHost({ id: 1 })

		expect(screen.getByTestId('gated-content')).toBeInTheDocument()
		expect(screen.getByTestId('always-visible')).toBeInTheDocument()
	})

	it('hides the template when the entity id matches the current user id', async () => {
		await renderHost({ id: 42 })

		expect(screen.queryByTestId('gated-content')).not.toBeInTheDocument()
		expect(screen.getByTestId('always-visible')).toBeInTheDocument()
	})

	it('renders the template when the current user is null', async () => {
		currentUser.set(null)

		await renderHost({ id: 42 })

		expect(screen.getByTestId('gated-content')).toBeInTheDocument()
	})

	it('renders the template when the entity is null', async () => {
		await renderHost(null)

		expect(screen.getByTestId('gated-content')).toBeInTheDocument()
	})

	it('hides reactively when the entity input changes to match the current user', async () => {
		const { fixture } = await renderHost({ id: 1 })
		expect(screen.getByTestId('gated-content')).toBeInTheDocument()

		fixture.componentRef.setInput('entity', { id: 42 })
		TestBed.tick()

		expect(screen.queryByTestId('gated-content')).not.toBeInTheDocument()
	})

	it('hides reactively when the current user signal updates to match the entity', async () => {
		await renderHost({ id: 7 })
		expect(screen.getByTestId('gated-content')).toBeInTheDocument()

		currentUser.set({ id: 7 })
		TestBed.tick()

		expect(screen.queryByTestId('gated-content')).not.toBeInTheDocument()
	})
})
