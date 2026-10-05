import { effect, signal, type Signal } from '@angular/core'
import { parseDurationToMs } from '@resetshop/util'

/**
 * Derives a live countdown from a future ISO-8601 timestamp signal (e.g. an account-lockout expiry or
 * a rate-limit `Retry-After`). Returns the whole seconds remaining as a read-only signal — `0` when the
 * source is null, malformed or already past. It ticks every second and self-stops at
 * zero; the interval is torn down via the effect's `onCleanup` (and when the host component is destroyed).
 *
 * MUST be called from an injection context (it registers an `effect`) — i.e.
 * as a component field initializer. Shared by the login, forgot-password, and reset-password pages.
 */
export function createCountdown(source: Signal<string | null>): Signal<number> {
	const remainingSeconds = signal(0)

	effect((onCleanup) => {
		const iso = source()
		let intervalId: ReturnType<typeof setInterval> | undefined
		onCleanup(() => {
			if (intervalId !== undefined) clearInterval(intervalId)
		})

		// No countdown when nothing is pending.
		if (!iso) {
			remainingSeconds.set(0)
			return
		}

		const expiry = new Date(iso).getTime()
		if (Number.isNaN(expiry)) {
			remainingSeconds.set(0)
			return
		}

		const compute = () => Math.max(0, Math.ceil((expiry - Date.now()) / parseDurationToMs('1s')))
		const tick = () => {
			const diff = compute()
			remainingSeconds.set(diff)
			if (diff === 0 && intervalId !== undefined) {
				clearInterval(intervalId)
				intervalId = undefined
			}
		}

		const initial = compute()
		remainingSeconds.set(initial)
		if (initial > 0) {
			intervalId = setInterval(tick, parseDurationToMs('1s'))
		}
	})

	return remainingSeconds.asReadonly()
}

/** Formats whole seconds as `mm:ss` (e.g. 75 → "01:15"). */
export function formatCountdown(totalSeconds: number): string {
	const minutes = Math.floor(totalSeconds / 60)
		.toString()
		.padStart(2, '0')
	const seconds = (totalSeconds % 60).toString().padStart(2, '0')
	return `${minutes}:${seconds}`
}
