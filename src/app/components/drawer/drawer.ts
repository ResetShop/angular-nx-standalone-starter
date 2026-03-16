import { NgTemplateOutlet } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	contentChild,
	ElementRef,
	HostAttributeToken,
	inject,
	input,
	OnDestroy,
	output,
	signal,
	viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, fromEvent, Subject, switchMap, take } from 'rxjs';
import { Spinner } from '../spinner/spinner';
import { DrawerFooter } from './drawer-footer';
import { DrawerHeader } from './drawer-header';
import { DrawerTracker } from './drawer-tracker';

export type DrawerDirection = 'left' | 'right' | 'top' | 'bottom';

@Component({
	selector: 'app-drawer',
	standalone: true,
	imports: [NgTemplateOutlet, Spinner],
	templateUrl: './drawer.html',
	styleUrl: './drawer.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Drawer implements OnDestroy {
	/** Emits when the drawer opens */
	readonly opened = output<void>();

	/** Emits when the drawer closes */
	readonly closed = output<void>();

	/** Direction from which the drawer slides in */
	readonly direction = input<DrawerDirection>('right');

	/** Title displayed in the header (if no custom header template) */
	readonly title = input<string>('');

	/** Description displayed below the title */
	readonly description = input<string>('');

	/** Whether clicking the backdrop closes the drawer */
	readonly closeOnBackdrop = input(true);

	/** Whether pressing ESC closes the drawer */
	readonly closeOnEscape = input(true);

	/** Content child for custom header */
	readonly headerTemplate = contentChild(DrawerHeader);

	/** Content child for custom footer */
	readonly footerTemplate = contentChild(DrawerFooter);

	private readonly hostClasses = inject(new HostAttributeToken('class'), { optional: true }) ?? '';
	private readonly drawerTracker = inject(DrawerTracker);
	private readonly closeTransition$ = new Subject<void>();
	private readonly instanceId = this.drawerTracker.nextId();
	private readonly minimumElapsed = signal(false);
	private readonly contentReady = signal(true);
	private minimumTimer: ReturnType<typeof setTimeout> | null = null;

	/** Whether the spinner should be shown */
	readonly showSpinner = computed(() => !this.minimumElapsed() || !this.contentReady());

	/** Unique ID for aria-labelledby */
	readonly titleId = `drawer-title-${this.instanceId}`;

	/** Unique ID for aria-describedby */
	readonly descriptionId = `drawer-desc-${this.instanceId}`;

	private readonly drawerRef = viewChild.required<ElementRef<HTMLDialogElement>>('drawerRef');
	private readonly drawerElement = computed(() => this.drawerRef().nativeElement);

	constructor() {
		this.closeTransition$
			.pipe(
				switchMap(() =>
					fromEvent(this.drawerElement(), 'transitionend').pipe(
						filter((e) => e.target === this.drawerElement()),
						take(1),
					),
				),
				takeUntilDestroyed(),
			)
			.subscribe(() => {
				this.drawerElement().close();
				this.drawerTracker.unregister(this);
			});
	}

	/** Layout classes based on direction */
	private readonly layoutClasses = computed(() => {
		const dir = this.direction();
		if (dir === 'left' || dir === 'right') {
			return 'h-full max-w-3/4';
		}
		return 'w-screen max-h-3/4';
	});

	/** Position classes based on direction */
	private readonly positionClasses = computed(() => {
		const positions: Record<DrawerDirection, string> = {
			left: 'inset-y-0 left-0',
			right: 'inset-y-0 right-0 ml-auto',
			top: 'inset-x-0 top-0',
			bottom: 'inset-x-0 bottom-0 mt-auto',
		};
		return positions[this.direction()];
	});

	/** Direction class for CSS animations */
	private readonly directionClass = computed(() => `drawer-${this.direction()}`);

	/** Combined panel classes */
	readonly panelClasses = computed(() => {
		return `${this.layoutClasses()} ${this.positionClasses()} ${this.directionClass()} ${this.hostClasses}`.trim();
	});

	ngOnDestroy(): void {
		this.clearMinimumTimer();
		this.drawerTracker.unregister(this);
	}

	show(): void {
		const drawer = this.drawerElement();
		if (drawer.open) return;
		this.contentReady.set(true);
		this.startMinimumTimer();
		this.drawerTracker.register(this);
		drawer.showModal();
		// Wait one frame so the browser applies `open` before `data-open` triggers the CSS transition
		requestAnimationFrame(() => drawer.setAttribute('data-open', ''));
		this.opened.emit();
	}

	/**
	 * Opens the drawer with a loading state. The spinner stays visible until both
	 * the 500ms minimum has elapsed AND `setContentReady()` is called.
	 */
	showWithLoading(): void {
		const drawer = this.drawerElement();
		if (drawer.open) return;
		this.contentReady.set(false);
		this.startMinimumTimer();
		this.drawerTracker.register(this);
		drawer.showModal();
		requestAnimationFrame(() => drawer.setAttribute('data-open', ''));
		this.opened.emit();
	}

	/** Signals that the consumer's async content is ready to display */
	setContentReady(): void {
		this.contentReady.set(true);
	}

	close(): void {
		const drawer = this.drawerElement();
		if (!drawer.open) return;
		this.clearMinimumTimer();
		// Hide content immediately to prevent validation flash during close animation
		this.minimumElapsed.set(false);
		this.contentReady.set(true);
		drawer.removeAttribute('data-open');
		this.closeTransition$.next();
		this.closed.emit();
	}

	private startMinimumTimer(): void {
		this.minimumElapsed.set(false);
		this.clearMinimumTimer();
		this.minimumTimer = setTimeout(() => this.minimumElapsed.set(true), 500);
	}

	private clearMinimumTimer(): void {
		if (this.minimumTimer) {
			clearTimeout(this.minimumTimer);
			this.minimumTimer = null;
		}
	}

	onCancel(event: Event): void {
		if (!this.closeOnEscape()) {
			event.preventDefault();
			return;
		}
		this.close();
	}

	onBackdropClick(event: MouseEvent): void {
		if (!this.closeOnBackdrop()) return;
		if (event.target === this.drawerElement()) {
			this.close();
		}
	}
}
