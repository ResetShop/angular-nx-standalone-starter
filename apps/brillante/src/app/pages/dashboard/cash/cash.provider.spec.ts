import { provideHttpClient } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import { HttpCashApi } from './cash'
import { CashApi } from './cash.interface'
import { InMemoryCashApi, provideCashMock } from './cash.mock'
import { provideCash } from './cash.provider'

describe('cash providers', () => {
	it('should bind the CashApi token to the HTTP implementation', () => {
		TestBed.configureTestingModule({ providers: [provideHttpClient(), provideCash()] })

		expect(TestBed.inject(CashApi)).toBeInstanceOf(HttpCashApi)
	})

	it('should bind the CashApi token to the given in-memory implementation in the mock provider', () => {
		const api = new InMemoryCashApi()
		TestBed.configureTestingModule({ providers: [provideCashMock(api)] })

		expect(TestBed.inject(CashApi)).toBe(api)
	})
})

describe('InMemoryCashApi', () => {
	it('should report an error configured for a method and recover after clearing it', () => {
		const api = new InMemoryCashApi()
		const failure = new Error('boom')
		api.setError('getAll', failure)
		let error: unknown

		api.getAll({ from: new Date(), to: new Date() }).subscribe({ error: (e: unknown) => (error = e) })
		api.clearErrors()
		let rows: unknown[] | undefined
		api.getAll({ from: new Date(), to: new Date() }).subscribe((value) => (rows = value))

		expect(error).toBe(failure)
		expect(rows).toEqual([])
	})
})
