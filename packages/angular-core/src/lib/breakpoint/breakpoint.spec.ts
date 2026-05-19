import { BreakpointObserver } from '@angular/cdk/layout'
import { PLATFORM_ID } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { clearAllMocks, fn, type MockFn } from '@resetshop/util/test-utils'
import { of } from 'rxjs'
import { createBreakpointSignal } from './breakpoint'

describe('createBreakpointSignal', () => {
	let observerMock: { observe: MockFn }

	beforeEach(() => {
		clearAllMocks()
		observerMock = {
			observe: fn().mockReturnValue(of({ matches: false, breakpoints: {} })),
		}
	})

	function configureTestBed(platformId: 'browser' | 'server' = 'browser'): void {
		TestBed.configureTestingModule({
			providers: [
				{ provide: PLATFORM_ID, useValue: platformId },
				{ provide: BreakpointObserver, useValue: observerMock },
			],
		})
	}

	it('returns a signal that emits false on non-browser platforms', () => {
		configureTestBed('server')

		const result = TestBed.runInInjectionContext(() => createBreakpointSignal('sm'))

		expect(result()).toBe(false)
		expect(observerMock.observe.calls).toHaveLength(0)
	})

	it('returns false when the BreakpointObserver reports no match', () => {
		configureTestBed('browser')

		const result = TestBed.runInInjectionContext(() => createBreakpointSignal('sm'))

		expect(result()).toBe(false)
	})

	it('returns true when the BreakpointObserver reports a match', () => {
		observerMock.observe.mockReturnValue(of({ matches: true, breakpoints: {} }))
		configureTestBed('browser')

		const result = TestBed.runInInjectionContext(() => createBreakpointSignal('sm'))

		expect(result()).toBe(true)
	})

	it('constructs a max-width media query by default using the breakpoint fallback', () => {
		configureTestBed('browser')

		TestBed.runInInjectionContext(() => createBreakpointSignal('sm'))

		expect(observerMock.observe.calls).toHaveLength(1)
		expect(observerMock.observe.calls[0][0]).toBe('(max-width: calc(40rem - 1px))')
	})

	it('uses the medium fallback for the md breakpoint', () => {
		configureTestBed('browser')

		TestBed.runInInjectionContext(() => createBreakpointSignal('md'))

		expect(observerMock.observe.calls[0][0]).toBe('(max-width: calc(48rem - 1px))')
	})

	it('uses the large fallback for the lg breakpoint', () => {
		configureTestBed('browser')

		TestBed.runInInjectionContext(() => createBreakpointSignal('lg'))

		expect(observerMock.observe.calls[0][0]).toBe('(max-width: calc(64rem - 1px))')
	})

	it('constructs a min-width media query when direction is "min"', () => {
		configureTestBed('browser')

		TestBed.runInInjectionContext(() => createBreakpointSignal('lg', 'min'))

		expect(observerMock.observe.calls[0][0]).toBe('(min-width: 64rem)')
	})
})
