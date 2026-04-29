import { Injectable } from '@angular/core'
import type { ConfirmDialog } from './confirm-dialog'

/**
 * Singleton service that enforces only one ConfirmDialog can be active at a time.
 *
 * Opening multiple confirmation dialogs simultaneously creates a confusing user experience.
 * This tracker ensures that attempting to open a second dialog while one is already active
 * throws an error, forcing developers to handle dialog lifecycle properly.
 *
 * @example
 * // The tracker is used internally by ConfirmDialog — no manual usage required.
 * // When dialog.show() is called, it registers with the tracker.
 * // When dialog.close() completes, it unregisters.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogTracker {
	private activeInstance: ConfirmDialog | null = null
	private instanceCount = 0

	/** Generates a unique instance ID for aria attributes. */
	public nextId(): number {
		return ++this.instanceCount
	}

	/** Registers a dialog as the active instance. Throws if another dialog is already active. */
	public register(dialog: ConfirmDialog): void {
		if (this.activeInstance) {
			throw new Error('Only one confirm dialog can be active at a time.')
		}
		this.activeInstance = dialog
	}

	/** Unregisters the dialog if it matches the current active instance. */
	public unregister(dialog: ConfirmDialog): void {
		if (this.activeInstance === dialog) {
			this.activeInstance = null
		}
	}
}
