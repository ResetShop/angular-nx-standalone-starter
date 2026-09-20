import { Component, input, output, viewChild } from '@angular/core'
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog'

/** One changed field, with display-ready (already translated/formatted) before and after values. */
export interface ConfirmChangesEntry {
	readonly label: string
	readonly before: string
	readonly after: string
}

/**
 * A confirmation dialog that lists pending changes as before → after rows and asks the user to
 * confirm them before they are persisted. It composes `ConfirmDialog` (native `<dialog>`, stacking,
 * ESC-to-cancel, animation) and only adds the change list. All text arrives through inputs, so the
 * component renders identically with or without a translation provider.
 */
@Component({
	selector: 'app-confirm-changes-dialog',
	standalone: true,
	imports: [ConfirmDialog],
	host: { '[attr.title]': 'null' },
	templateUrl: './confirm-changes-dialog.html',
})
export class ConfirmChangesDialog {
	/** Dialog title */
	public readonly title = input<string>('Confirm changes')

	/** Short explanation rendered above the change list */
	public readonly message = input<string>('')

	/** The changes to review, one row per changed field */
	public readonly changes = input.required<readonly ConfirmChangesEntry[]>()

	/** Screen-reader prefix for the previous value */
	public readonly beforeLabel = input<string>('Before')

	/** Screen-reader prefix for the new value */
	public readonly afterLabel = input<string>('After')

	/** Text for the confirm button */
	public readonly confirmText = input<string>('Confirm')

	/** Text for the cancel button */
	public readonly cancelText = input<string>('Cancel')

	/** Emits when the user confirms the changes */
	public readonly confirmed = output<void>()

	/** Emits when the user cancels */
	public readonly cancelled = output<void>()

	private readonly dialog = viewChild.required(ConfirmDialog)

	public show(): void {
		this.dialog().show()
	}

	public close(): void {
		this.dialog().close()
	}
}
