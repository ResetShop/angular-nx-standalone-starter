import { Injectable } from '@angular/core';
import type { Drawer } from './drawer';

@Injectable({ providedIn: 'root' })
export class DrawerTracker {
	private activeInstance: Drawer | null = null;

	register(drawer: Drawer): void {
		if (this.activeInstance) {
			throw new Error('Only one drawer can be active at a time.');
		}
		this.activeInstance = drawer;
	}

	unregister(drawer: Drawer): void {
		if (this.activeInstance === drawer) {
			this.activeInstance = null;
		}
	}
}
