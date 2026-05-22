/**
 * Returns `fallback` when `translation.instant()` has returned the raw key
 * (indicating no translations are loaded), otherwise returns the resolved value.
 *
 * Used by library components in `packages/ui` to provide readable English
 * defaults when the component is rendered without a Translation provider
 * (e.g. in Storybook or lightweight test harnesses).
 *
 * @remarks
 * Detection relies on the convention that `Translation.instant()` returns the
 * raw key string when translations are unloaded. The `resolved === key` test
 * cannot distinguish that condition from a translated string that happens to
 * equal its own key. In practice this is safe because no natural-language
 * translation takes dot-notation `ALL_CAPS` form.
 */
export function resolveOrDefault(resolved: string, key: string, fallback: string): string {
	return resolved === key ? fallback : resolved
}
