import { Directive } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, fromEvent, Subject, switchMap, take } from 'rxjs';

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
	private element: HTMLDialogElement | null = null;
	private readonly closeTransition$ = new Subject<void>();
	private onCloseComplete: (() => void) | null = null;

	constructor() {
		this.closeTransition$
			.pipe(
				switchMap(() =>
					fromEvent(this.element!, 'transitionend').pipe(
						filter((e) => e.target === this.element),
						take(1),
					),
				),
				takeUntilDestroyed(),
			)
			.subscribe(() => {
				this.element!.close();
				this.onCloseComplete?.();
			});
	}

	/** Binds the directive to a dialog element. Must be called before open/close. */
	init(element: HTMLDialogElement, onCloseComplete: () => void): void {
		this.element = element;
		this.onCloseComplete = onCloseComplete;
	}

	/** Triggers the open animation by setting `data-open` after one frame. */
	open(): void {
		requestAnimationFrame(() => this.element!.setAttribute('data-open', ''));
	}

	/** Triggers the close animation and waits for `transitionend` to finalize. */
	close(): void {
		this.element!.removeAttribute('data-open');
		this.closeTransition$.next();
	}
}
