import { type Provider, signal } from '@angular/core'
import { AuthStore } from './auth.store'

/**
 * Minimal AuthStore stand-in exposing only the reactive `isAuthenticated` signal
 * that public-facing components (e.g. LandingHeader) read. The value is cast to a
 * Partial of the real store instance so the type relationship is explicit — the mock
 * stops compiling if `isAuthenticated`'s signature changes.
 */
export function provideAuthStateMock(isAuthenticated: boolean): Provider {
	return {
		provide: AuthStore,
		useValue: { isAuthenticated: signal(isAuthenticated) } as Partial<InstanceType<typeof AuthStore>>,
	}
}
