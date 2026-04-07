import { computed, Directive, OnDestroy, signal } from '@angular/core'
import { parseDurationToMs } from '@resetshop/util'

export const DRAWER_SPINNER_MIN_DISPLAY = '500ms'

/**
 * Manages the loading spinner lifecycle for the Drawer component.
 *
 * The spinner stays visible until both conditions are met:
 * 1. The minimum display duration (500ms) has elapsed
 * 2. The consumer has called `setContentReady()`
 *
 * Applied as a hostDirective on Drawer — always available, activated via `start()`.
 */
@Directive({ standalone: true })
export class DrawerLoading implements OnDestroy {
	private readonly minimumElapsed = signal(false)
	private readonly contentReady = signal(true)
	private minimumTimer: ReturnType<typeof setTimeout> | null = null

	public readonly showSpinner = computed(() => !this.minimumElapsed() || !this.contentReady())

	/** Activates the loading state: shows spinner until minimum + content ready. */
	public start(): void {
		this.contentReady.set(false)
		this.minimumElapsed.set(false)
		this.clearTimer()
		this.minimumTimer = setTimeout(() => this.minimumElapsed.set(true), parseDurationToMs(DRAWER_SPINNER_MIN_DISPLAY))
	}

	/** Signals that the consumer's async content is ready to display. */
	public setContentReady(): void {
		this.contentReady.set(true)
	}

	/** Resets loading state and cancels any pending timer. */
	public reset(): void {
		this.clearTimer()
		this.minimumElapsed.set(false)
		this.contentReady.set(true)
	}

	public ngOnDestroy(): void {
		this.clearTimer()
	}

	private clearTimer(): void {
		if (this.minimumTimer) {
			clearTimeout(this.minimumTimer)
			this.minimumTimer = null
		}
	}
}
