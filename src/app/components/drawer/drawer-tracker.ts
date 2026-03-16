import { Injectable } from '@angular/core'
import type { Drawer } from './drawer'

@Injectable({ providedIn: 'root' })
export class DrawerTracker {
	private activeInstance: Drawer | null = null
	private instanceCount = 0

	/** Generates a unique instance ID for aria attributes. */
	public nextId(): number {
		return ++this.instanceCount
	}

	public register(drawer: Drawer): void {
		if (this.activeInstance) {
			throw new Error('Only one drawer can be active at a time.')
		}
		this.activeInstance = drawer
	}

	public unregister(drawer: Drawer): void {
		if (this.activeInstance === drawer) {
			this.activeInstance = null
		}
	}
}
