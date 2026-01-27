import { Injectable } from '@angular/core';
import type { ConfirmDialog } from './confirm-dialog';

@Injectable({ providedIn: 'root' })
export class ConfirmDialogTracker {
	private activeInstance: ConfirmDialog | null = null;

	register(dialog: ConfirmDialog): void {
		if (this.activeInstance) {
			throw new Error('Only one confirm dialog can be active at a time.');
		}
		this.activeInstance = dialog;
	}

	unregister(dialog: ConfirmDialog): void {
		if (this.activeInstance === dialog) {
			this.activeInstance = null;
		}
	}
}
