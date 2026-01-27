import {
	ChangeDetectionStrategy,
	Component,
	computed,
	type ElementRef,
	input,
	output,
	viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, fromEvent, Subject, switchMap, take } from 'rxjs';
import { Button } from '@components/button/button';

@Component({
	selector: 'app-confirm-dialog',
	standalone: true,
	imports: [Button],
	templateUrl: './confirm-dialog.html',
	styleUrl: './confirm-dialog.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {
	/** Dialog title */
	readonly title = input<string>('Confirm');

	/** Dialog message body */
	readonly message = input<string>('');

	/** Text for the confirm button */
	readonly confirmText = input<string>('Confirm');

	/** Text for the cancel button */
	readonly cancelText = input<string>('Cancel');

	/** Variant for the confirm button */
	readonly confirmVariant = input<'default' | 'destructive'>('default');

	/** Emits when user confirms */
	readonly confirmed = output<void>();

	/** Emits when user cancels */
	readonly cancelled = output<void>();

	readonly titleId = 'confirm-dialog-title';
	readonly messageId = 'confirm-dialog-message';

	private readonly closeTransition$ = new Subject<void>();
	private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialogRef');
	private readonly dialogElement = computed(() => this.dialogRef().nativeElement);

	constructor() {
		this.closeTransition$
			.pipe(
				switchMap(() =>
					fromEvent(this.dialogElement(), 'transitionend').pipe(
						filter((e) => e.target === this.dialogElement()),
						take(1),
					),
				),
				takeUntilDestroyed(),
			)
			.subscribe(() => {
				this.dialogElement().close();
			});
	}

	show(): void {
		const el = this.dialogElement();
		if (el.open) return;
		el.showModal();
		requestAnimationFrame(() => el.setAttribute('data-open', ''));
	}

	close(): void {
		const el = this.dialogElement();
		if (!el.open) return;
		el.removeAttribute('data-open');
		this.closeTransition$.next();
	}

	onConfirm(): void {
		this.confirmed.emit();
		this.close();
	}

	onCancel(): void {
		this.cancelled.emit();
		this.close();
	}

	onDialogCancel(event: Event): void {
		event.preventDefault();
		this.onCancel();
	}
}
