import { Injectable, signal } from '@angular/core'

@Injectable({ providedIn: 'root' })
export class NavigationState {
	private readonly expandedItems = signal<Set<string>>(new Set())

	public isExpanded(id: string): boolean {
		return this.expandedItems().has(id)
	}

	public toggle(id: string): void {
		this.expandedItems.update((items) => {
			const newSet = new Set(items)
			if (newSet.has(id)) {
				newSet.delete(id)
			} else {
				newSet.add(id)
			}
			return newSet
		})
	}

	public expand(id: string): void {
		this.expandedItems.update((items) => {
			const newSet = new Set(items)
			newSet.add(id)
			return newSet
		})
	}
}
