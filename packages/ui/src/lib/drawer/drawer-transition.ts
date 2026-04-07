import { Directive } from '@angular/core'

/**
 * Manages the open/close CSS transition lifecycle for the Drawer component.
 *
 * The open animation is triggered by setting `data-open` on the dialog element
 * after one frame (so the browser applies `open` first). The close animation
 * removes `data-open` and waits for `transitionend` before calling `dialog.close()`.
 *
 * Applied as a hostDirective on Drawer — always available.
 */
@Directive({ standalone: true })
export class DrawerTransition {
	/** Opens the dialog and triggers the slide-in animation after one frame. */
	public open(element: HTMLDialogElement): void {
		element.showModal()
		requestAnimationFrame(() => element.setAttribute('data-open', ''))
	}

	/** Triggers the close animation and calls `onComplete` after `transitionend`. */
	public close(element: HTMLDialogElement, onComplete: () => void): void {
		element.removeAttribute('data-open')
		const handler = (e: Event) => {
			if (e.target !== element) return
			element.removeEventListener('transitionend', handler)
			element.close()
			onComplete()
		}
		element.addEventListener('transitionend', handler)
	}
}
