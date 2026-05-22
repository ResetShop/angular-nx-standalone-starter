/**
 * Returns `fallback` when `translation.instant()` has returned the raw key
 * (indicating no translations are loaded), otherwise returns the resolved value.
 *
 * Used by library components in `packages/ui` to provide readable English
 * defaults when the component is rendered without a Translation provider
 * (e.g. in Storybook or lightweight test harnesses).
 */
export function resolveOrDefault(resolved: string, key: string, fallback: string): string {
	return resolved === key ? fallback : resolved
}
