import { Component, input, output, viewChild } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { clearAllMocks, fn, type MockFn } from '../../../api/container.mock';
import { Drawer } from './drawer';
import { DrawerFooter } from './drawer-footer';
import { DrawerHeader } from './drawer-header';

let mockShowModal: MockFn<[], void>;
let mockClose: MockFn<[], void>;

function mockDialog(): void {
	mockShowModal = fn<[], void>();
	mockShowModal.mockImplementation(function (this: HTMLDialogElement) {
		this.setAttribute('open', '');
	});
	HTMLDialogElement.prototype.showModal = mockShowModal;

	mockClose = fn<[], void>();
	mockClose.mockImplementation(function (this: HTMLDialogElement) {
		this.removeAttribute('open');
	});
	HTMLDialogElement.prototype.close = mockClose;
}

@Component({
	selector: 'app-drawer-test-host',
	standalone: true,
	imports: [Drawer, DrawerHeader, DrawerFooter],
	template: `
		<app-drawer
			(opened)="opened.emit()"
			(closed)="closed.emit()"
			[direction]="direction()"
			[title]="title()"
			[description]="description()"
			[closeOnEscape]="closeOnEscape()"
			[closeOnBackdrop]="closeOnBackdrop()"
			#drawerRef
		>
			@if (showCustomHeader()) {
				<ng-template appDrawerHeader>
					<span>Custom Header Content</span>
				</ng-template>
			}

			<p>Body content goes here</p>

			@if (showCustomFooter()) {
				<ng-template appDrawerFooter>
					<span>Custom Footer Content</span>
				</ng-template>
			}
		</app-drawer>
	`,
})
class DrawerTestHost {
	readonly direction = input('right');
	readonly title = input('');
	readonly description = input('');
	readonly closeOnEscape = input(true);
	readonly closeOnBackdrop = input(true);
	readonly showCustomHeader = input(false);
	readonly showCustomFooter = input(false);
	readonly opened = output<void>();
	readonly closed = output<void>();
	readonly drawer = viewChild.required(Drawer);
}

async function renderAndOpenDrawer(inputs: Record<string, unknown> = {}) {
	const view = await render(DrawerTestHost, { inputs, on: inputs['on'] as never });
	view.fixture.componentInstance.drawer().show();
	view.fixture.detectChanges();
	return view;
}

describe('Drawer', () => {
	beforeEach(() => {
		clearAllMocks();
		mockDialog();
	});

	describe('Rendering', () => {
		it('should render dialog element when opened via show()', async () => {
			await renderAndOpenDrawer({ title: 'Test Drawer' });

			const dialog = screen.getByRole('dialog');
			expect(dialog).toBeInTheDocument();
		});

		it('should display title in header', async () => {
			await renderAndOpenDrawer({ title: 'My Drawer Title' });

			expect(screen.getByText('My Drawer Title')).toBeInTheDocument();
		});

		it('should display description below title', async () => {
			await renderAndOpenDrawer({ title: 'Title', description: 'A helpful description' });

			expect(screen.getByText('A helpful description')).toBeInTheDocument();
		});

		it('should project body content via ng-content', async () => {
			await renderAndOpenDrawer({ title: 'Test' });

			expect(screen.getByText('Body content goes here')).toBeInTheDocument();
		});

		it('should render custom header via appDrawerHeader', async () => {
			await renderAndOpenDrawer({ showCustomHeader: true });

			expect(screen.getByText('Custom Header Content')).toBeInTheDocument();
		});

		it('should render custom footer via appDrawerFooter', async () => {
			await renderAndOpenDrawer({ showCustomFooter: true });

			expect(screen.getByText('Custom Footer Content')).toBeInTheDocument();
		});
	});

	describe('Accessibility', () => {
		it('should set aria-labelledby pointing to title element', async () => {
			await renderAndOpenDrawer({ title: 'Accessible Title' });

			const dialog = screen.getByRole('dialog');
			const heading = screen.getByRole('heading', { name: /accessible title/i });

			expect(dialog).toHaveAttribute('aria-labelledby', heading.id);
		});

		it('should set aria-describedby when description is provided', async () => {
			await renderAndOpenDrawer({ title: 'Title', description: 'Description text' });

			const dialog = screen.getByRole('dialog');
			const descElement = screen.getByText('Description text');

			expect(dialog).toHaveAttribute('aria-describedby', descElement.id);
		});

		it('should omit aria-describedby when no description is provided', async () => {
			await renderAndOpenDrawer({ title: 'Title Only' });

			const dialog = screen.getByRole('dialog');
			expect(dialog).not.toHaveAttribute('aria-describedby');
		});
	});

	describe('Interaction', () => {
		it('should emit closed on ESC (cancel event)', async () => {
			const closedSpy = fn<[], void>();

			const view = await render(DrawerTestHost, {
				inputs: { title: 'Test' },
				on: { closed: closedSpy },
			});

			view.fixture.componentInstance.drawer().show();
			view.fixture.detectChanges();

			const dialog = screen.getByRole('dialog');
			dialog.dispatchEvent(new Event('cancel', { bubbles: true }));

			expect(closedSpy.calls).toHaveLength(1);
		});

		it('should prevent close on ESC when closeOnEscape is false', async () => {
			const closedSpy = fn<[], void>();

			const view = await render(DrawerTestHost, {
				inputs: { title: 'Test', closeOnEscape: false },
				on: { closed: closedSpy },
			});

			view.fixture.componentInstance.drawer().show();
			view.fixture.detectChanges();

			const dialog = screen.getByRole('dialog');
			const cancelEvent = new Event('cancel', { cancelable: true, bubbles: true });
			dialog.dispatchEvent(cancelEvent);

			expect(closedSpy.calls).toHaveLength(0);
			expect(cancelEvent.defaultPrevented).toBe(true);
		});

		it('should emit opened when show() is called', async () => {
			const openedSpy = fn<[], void>();

			const view = await render(DrawerTestHost, {
				inputs: { title: 'Test' },
				on: { opened: openedSpy },
			});

			view.fixture.componentInstance.drawer().show();
			view.fixture.detectChanges();

			expect(openedSpy.calls).toHaveLength(1);
		});

		it('should not emit opened twice when show() is called while already open', async () => {
			const openedSpy = fn<[], void>();

			const view = await render(DrawerTestHost, {
				inputs: { title: 'Test' },
				on: { opened: openedSpy },
			});

			const drawer = view.fixture.componentInstance.drawer();
			drawer.show();
			drawer.show();
			view.fixture.detectChanges();

			expect(openedSpy.calls).toHaveLength(1);
		});
	});

	describe('CSS', () => {
		it('should apply drawer-right class by default', async () => {
			await renderAndOpenDrawer({ title: 'Test' });

			const dialog = screen.getByRole('dialog');
			expect(dialog).toHaveClass('drawer-right');
		});

		it('should apply drawer-left class for left direction', async () => {
			await renderAndOpenDrawer({ title: 'Test', direction: 'left' });

			const dialog = screen.getByRole('dialog');
			expect(dialog).toHaveClass('drawer-left');
		});

		it('should apply drawer-top class for top direction', async () => {
			await renderAndOpenDrawer({ title: 'Test', direction: 'top' });

			const dialog = screen.getByRole('dialog');
			expect(dialog).toHaveClass('drawer-top');
		});

		it('should apply drawer-bottom class for bottom direction', async () => {
			await renderAndOpenDrawer({ title: 'Test', direction: 'bottom' });

			const dialog = screen.getByRole('dialog');
			expect(dialog).toHaveClass('drawer-bottom');
		});
	});
});
