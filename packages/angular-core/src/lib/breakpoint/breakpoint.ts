import { BreakpointObserver } from '@angular/cdk/layout'
import { isPlatformBrowser } from '@angular/common'
import { inject, PLATFORM_ID, signal, type Signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { map } from 'rxjs'

export type BreakpointName = 'sm' | 'md' | 'lg'
export type BreakpointDirection = 'max' | 'min'

/**
 * Creates a reactive `Signal<boolean>` that tracks whether the current
 * viewport matches a Tailwind breakpoint.
 *
 * Reads `--breakpoint-{name}` from the document root at construction time
 * with a fallback to the Tailwind default value. Falls back to a
 * never-matching signal on non-browser platforms (SSR safety).
 *
 * Must be called from an Angular injection context (field initializer,
 * preferred — or inside `runInInjectionContext`).
 *
 * @example
 * // "True when viewport is narrower than `sm` (< 640px)"
 * private readonly isMobile = createBreakpointSignal('sm')
 *
 * @example
 * // "True when viewport is `lg` or wider (>= 1024px)"
 * private readonly isDesktop = createBreakpointSignal('lg', 'min')
 */
export function createBreakpointSignal(
	breakpoint: BreakpointName,
	direction: BreakpointDirection = 'max',
): Signal<boolean> {
	if (!isPlatformBrowser(inject(PLATFORM_ID))) {
		return signal(false).asReadonly()
	}
	// Tailwind 4 ships `--breakpoint-{sm,md,lg}` on :root by default. These literals
	// match Tailwind's default theme and only apply when the CSS custom property is absent.
	const fallbacks: Record<BreakpointName, string> = { sm: '40rem', md: '48rem', lg: '64rem' }
	const value =
		getComputedStyle(document.documentElement).getPropertyValue(`--breakpoint-${breakpoint}`).trim() ||
		fallbacks[breakpoint]
	const query = direction === 'max' ? `(max-width: calc(${value} - 1px))` : `(min-width: ${value})`
	return toSignal(
		inject(BreakpointObserver)
			.observe(query)
			.pipe(map((state) => state.matches)),
		{ initialValue: false },
	)
}
