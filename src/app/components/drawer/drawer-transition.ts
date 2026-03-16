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
	private readonly close$ = new Subject<HTMLDialogElement>();

	constructor() {
		this.close$
			.pipe(
				switchMap((element) =>
					fromEvent(element, 'transitionend').pipe(
						filter((e) => e.target === element),
						take(1),
						switchMap(() => {
							element.close();
							return [];
						}),
					),
				),
				takeUntilDestroyed(),
			)
			.subscribe();
	}

	/** Triggers the open animation by setting `data-open` after one frame. */
	open(element: HTMLDialogElement): void {
		requestAnimationFrame(() => element.setAttribute('data-open', ''));
	}

	/** Triggers the close animation and waits for `transitionend` to finalize. */
	close(element: HTMLDialogElement): void {
		element.removeAttribute('data-open');
		this.close$.next(element);
	}
}
