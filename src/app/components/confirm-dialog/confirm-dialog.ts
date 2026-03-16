import {
	ChangeDetectionStrategy,
	Component,
	computed,
	type ElementRef,
	inject,
	input,
	type OnDestroy,
	output,
	viewChild,
} from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Button } from '@components/button/button'
import { filter, fromEvent, Subject, switchMap, take } from 'rxjs'
import { ConfirmDialogTracker } from './confirm-dialog-tracker'

@Component({
	selector: 'app-confirm-dialog',
	standalone: true,
	imports: [Button],
	templateUrl: './confirm-dialog.html',
	styleUrl: './confirm-dialog.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog implements OnDestroy {
	/** Dialog title */
	protected readonly title = input<string>('Confirm')

	/** Dialog message body */
	protected readonly message = input<string>('')

	/** Text for the confirm button */
	protected readonly confirmText = input<string>('Confirm')

	/** Text for the cancel button */
	protected readonly cancelText = input<string>('Cancel')

	/** Variant for the confirm button */
	protected readonly confirmVariant = input<'default' | 'destructive'>('default')

	/** Emits when user confirms */
	protected readonly confirmed = output<void>()

	/** Emits when user cancels */
	protected readonly cancelled = output<void>()

	private readonly confirmDialogTracker = inject(ConfirmDialogTracker)
	private readonly instanceId = this.confirmDialogTracker.nextId()

	/** Unique ID for aria-labelledby */
	protected readonly titleId = `confirm-dialog-title-${this.instanceId}`

	/** Unique ID for aria-describedby */
	protected readonly messageId = `confirm-dialog-message-${this.instanceId}`
	private readonly closeTransition$ = new Subject<void>()
	private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialogRef')
	private readonly dialogElement = computed(() => this.dialogRef().nativeElement)

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
				this.dialogElement().close()
				this.confirmDialogTracker.unregister(this)
			})
	}

	public show(): void {
		const el = this.dialogElement()
		if (el.open) return
		this.confirmDialogTracker.register(this)
		el.showModal()
		requestAnimationFrame(() => el.setAttribute('data-open', ''))
	}

	public close(): void {
		const el = this.dialogElement()
		if (!el.open) return
		el.removeAttribute('data-open')
		this.closeTransition$.next()
	}

	public ngOnDestroy(): void {
		this.confirmDialogTracker.unregister(this)
	}

	protected onConfirm(): void {
		this.confirmed.emit()
		this.close()
	}

	protected onCancel(): void {
		this.cancelled.emit()
		this.close()
	}

	protected onDialogCancel(event: Event): void {
		event.preventDefault()
		this.onCancel()
	}
}
