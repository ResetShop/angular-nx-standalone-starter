import { NgTemplateOutlet } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	contentChild,
	ElementRef,
	inject,
	input,
	OnDestroy,
	output,
	viewChild,
} from '@angular/core';
import { Spinner } from '../spinner/spinner';
import { DrawerFooter } from './drawer-footer';
import { DrawerHeader } from './drawer-header';
import { DrawerLoading } from './drawer-loading';
import { DrawerPanel } from './drawer-panel';
import { DrawerTracker } from './drawer-tracker';
import { DrawerTransition } from './drawer-transition';

export type DrawerDirection = 'left' | 'right' | 'top' | 'bottom';

@Component({
	selector: 'app-drawer',
	standalone: true,
	imports: [NgTemplateOutlet, Spinner],
	hostDirectives: [DrawerLoading, DrawerTransition, { directive: DrawerPanel, inputs: ['direction'] }],
	templateUrl: './drawer.html',
	styleUrl: './drawer.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Drawer implements OnDestroy {
	/** Emits when the drawer opens */
	readonly opened = output<void>();

	/** Emits when the drawer closes */
	readonly closed = output<void>();

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

	private readonly drawerTracker = inject(DrawerTracker);
	private readonly instanceId = this.drawerTracker.nextId();

	private readonly loading = inject(DrawerLoading);
	private readonly transition = inject(DrawerTransition);
	private readonly panel = inject(DrawerPanel);

	/** Whether the spinner should be shown */
	readonly showSpinner = this.loading.showSpinner;

	/** Combined panel classes */
	readonly panelClasses = this.panel.panelClasses;

	/** Unique ID for aria-labelledby */
	readonly titleId = `drawer-title-${this.instanceId}`;

	/** Unique ID for aria-describedby */
	readonly descriptionId = `drawer-desc-${this.instanceId}`;

	private readonly drawerRef = viewChild.required<ElementRef<HTMLDialogElement>>('drawerRef');
	private readonly drawerElement = computed(() => this.drawerRef().nativeElement);

	ngOnDestroy(): void {
		this.drawerTracker.unregister(this);
	}

	/**
	 * Opens the drawer with a loading spinner. The spinner stays visible until both
	 * the 500ms minimum has elapsed AND `setContentReady()` is called.
	 * For immediate content, call `setContentReady()` right after `show()`.
	 */
	show(): void {
		const drawer = this.drawerElement();
		if (drawer.open) return;
		this.loading.start();
		this.transition.init(drawer, () => this.drawerTracker.unregister(this));
		this.drawerTracker.register(this);
		drawer.showModal();
		this.transition.open();
		this.opened.emit();
	}

	/** Signals that the consumer's async content is ready to display */
	setContentReady(): void {
		this.loading.setContentReady();
	}

	close(): void {
		const drawer = this.drawerElement();
		if (!drawer.open) return;
		this.loading.reset();
		this.transition.close();
		this.closed.emit();
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
