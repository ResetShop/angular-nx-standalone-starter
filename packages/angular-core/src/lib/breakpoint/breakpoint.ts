import { BreakpointObserver } from '@angular/cdk/layout'
import { isPlatformBrowser } from '@angular/common'
import { inject, PLATFORM_ID, signal, type Signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { map } from 'rxjs'

/**
 * Tailwind 4 ships these CSS custom properties on `:root` by default.
 * The fallback values match Tailwind's default theme — used when the
 * custom property is absent (e.g., during SSR or when Tailwind's reset
 * has not yet applied).
 */
const BREAKPOINT_FALLBACKS: Record<BreakpointName, string> = Object.freeze({
	sm: '40rem',
	md: '48rem',
	lg: '64rem',
} as const)

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
 * constructor body, or inside `runInInjectionContext`).
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
	const value =
		getComputedStyle(document.documentElement).getPropertyValue(`--breakpoint-${breakpoint}`).trim() ||
		BREAKPOINT_FALLBACKS[breakpoint]
	const query = direction === 'max' ? `(max-width: calc(${value} - 1px))` : `(min-width: ${value})`
	return toSignal(
		inject(BreakpointObserver)
			.observe(query)
			.pipe(map((state) => state.matches)),
		{ initialValue: false },
	)
}
