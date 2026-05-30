import { computed, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { CurrentUser } from './current-user'
import { CURRENT_USER_SOURCE, type CurrentUserSource } from './current-user.token'

describe('CurrentUser', () => {
	let currentUser: ReturnType<typeof signal<{ id: number } | null>>

	beforeEach(() => {
		clearAllMocks()
		currentUser = signal<{ id: number } | null>({ id: 42 })

		const source: CurrentUserSource = { currentUser }

		TestBed.configureTestingModule({
			providers: [{ provide: CURRENT_USER_SOURCE, useValue: source }],
		})
	})

	function getService(): CurrentUser {
		return TestBed.inject(CurrentUser)
	}

	it('returns true when the entity id matches the current user id', () => {
		expect(getService().is({ id: 42 })).toBe(true)
	})

	it('returns false when the entity id differs from the current user id', () => {
		expect(getService().is({ id: 99 })).toBe(false)
	})

	it('returns false when the current user is null', () => {
		currentUser.set(null)

		expect(getService().is({ id: 42 })).toBe(false)
	})

	it('returns false when the entity is null', () => {
		expect(getService().is(null)).toBe(false)
	})

	it('returns false when the entity is undefined', () => {
		expect(getService().is(undefined)).toBe(false)
	})

	it('re-evaluates inside a computed when the current user signal updates', () => {
		const service = getService()
		const target = { id: 7 }
		const matches = TestBed.runInInjectionContext(() => computed(() => service.is(target)))

		expect(matches()).toBe(false)

		currentUser.set({ id: 7 })
		expect(matches()).toBe(true)

		currentUser.set({ id: 8 })
		expect(matches()).toBe(false)
	})
})
