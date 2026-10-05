import { TestBed } from '@angular/core/testing'
import type { LegacyTokenResponse } from '@contracts/auth/auth.types'
import { parseDurationToMs } from '@resetshop/util'
import {
	advanceTimersByTime,
	clearAllMocks,
	fn,
	type MockFn,
	useFakeTimers,
	useRealTimers,
} from '@resetshop/util/test-utils'
import { firstValueFrom, of, Subject } from 'rxjs'
import { AuthApi } from './auth.interface'
import { LegacyTokenSession } from './legacy-token-session'

describe('LegacyTokenSession', () => {
	let getLegacyToken: MockFn<[], ReturnType<AuthApi['getLegacyToken']>>
	let session: LegacyTokenSession

	const issued = (token: string, lifetime: string): LegacyTokenResponse => ({
		token,
		expiresAt: new Date(Date.now() + parseDurationToMs(lifetime)).toISOString(),
	})

	beforeEach(() => {
		clearAllMocks()
		useFakeTimers()
		getLegacyToken = fn()
		getLegacyToken.mockImplementation(() => of(issued('first', '1h')))
		TestBed.configureTestingModule({ providers: [{ provide: AuthApi, useValue: { getLegacyToken } }] })
		session = TestBed.inject(LegacyTokenSession)
	})

	afterEach(() => {
		useRealTimers()
	})

	it('issues a token on first use and reuses it while it is valid', async () => {
		expect(await firstValueFrom(session.get())).toBe('first')
		expect(await firstValueFrom(session.get())).toBe('first')

		expect(getLegacyToken.calls).toHaveLength(1)
	})

	it('issues a new token a minute before the cached one expires', async () => {
		await firstValueFrom(session.get())
		getLegacyToken.mockImplementation(() => of(issued('second', '1h')))

		advanceTimersByTime(parseDurationToMs('59m') + parseDurationToMs('30s'))

		expect(await firstValueFrom(session.get())).toBe('second')
	})

	it('shares one request between concurrent callers', () => {
		const response = new Subject<LegacyTokenResponse>()
		getLegacyToken.mockImplementation(() => response)
		const received: string[] = []

		session.get().subscribe((token) => received.push(token))
		session.get().subscribe((token) => received.push(token))
		response.next(issued('shared', '1h'))
		response.complete()

		expect(getLegacyToken.calls).toHaveLength(1)
		expect(received).toEqual(['shared', 'shared'])
	})

	it('renew drops the cached token and issues another', async () => {
		await firstValueFrom(session.get())
		getLegacyToken.mockImplementation(() => of(issued('renewed', '1h')))

		expect(await firstValueFrom(session.renew())).toBe('renewed')
		expect(await firstValueFrom(session.get())).toBe('renewed')
	})

	it('does not cache a token that was requested before the sign-out', () => {
		const response = new Subject<LegacyTokenResponse>()
		getLegacyToken.mockImplementation(() => response)
		session.get().subscribe()

		session.clear()
		response.next(issued('stale', '1h'))
		response.complete()
		getLegacyToken.mockImplementation(() => of(issued('fresh', '1h')))

		let received = ''
		session.get().subscribe((token) => (received = token))
		expect(received).toBe('fresh')
	})

	it('clear forgets the token so the next use asks the backend again', async () => {
		await firstValueFrom(session.get())

		session.clear()
		await firstValueFrom(session.get())

		expect(getLegacyToken.calls).toHaveLength(2)
	})
})
