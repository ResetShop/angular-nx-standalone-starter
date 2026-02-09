import { Component, input, output, viewChild } from '@angular/core';
import { clearAllMocks, fn, type MockFn } from '@test-utils';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './confirm-dialog';

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
	selector: 'app-confirm-dialog-test-host',
	standalone: true,
	imports: [ConfirmDialog],
	template: `
		<app-confirm-dialog
			(confirmed)="confirmed.emit()"
			(cancelled)="cancelled.emit()"
			[title]="title()"
			[message]="message()"
			[confirmText]="confirmText()"
			[cancelText]="cancelText()"
			[confirmVariant]="confirmVariant()"
			#dialogRef
		/>
	`,
})
class ConfirmDialogTestHost {
	readonly title = input('Confirm');
	readonly message = input('Are you sure?');
	readonly confirmText = input('Confirm');
	readonly cancelText = input('Cancel');
	readonly confirmVariant = input<'default' | 'destructive'>('default');
	readonly confirmed = output<void>();
	readonly cancelled = output<void>();
	readonly dialog = viewChild.required(ConfirmDialog);
}

async function renderAndOpen(inputs: Record<string, unknown> = {}) {
	const view = await render(ConfirmDialogTestHost, { inputs, on: inputs['on'] as never });
	view.fixture.componentInstance.dialog().show();
	view.fixture.detectChanges();
	return view;
}

describe('ConfirmDialog', () => {
	beforeEach(() => {
		clearAllMocks();
		mockDialog();
	});

	describe('Rendering', () => {
		it('should render dialog with alertdialog role when opened', async () => {
			await renderAndOpen({ title: 'Delete Item' });

			const dialog = screen.getByRole('alertdialog');
			expect(dialog).toBeInTheDocument();
		});

		it('should display title', async () => {
			await renderAndOpen({ title: 'Delete Item' });

			expect(screen.getByText('Delete Item')).toBeInTheDocument();
		});

		it('should display message', async () => {
			await renderAndOpen({ title: 'Confirm', message: 'Are you sure you want to proceed?' });

			expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
		});

		it('should display confirm and cancel buttons', async () => {
			await renderAndOpen({ title: 'Confirm' });

			expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
		});

		it('should display custom button text', async () => {
			await renderAndOpen({
				title: 'Delete',
				confirmText: 'Yes, Delete',
				cancelText: 'No, Keep It',
			});

			expect(screen.getByRole('button', { name: /yes, delete/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /no, keep it/i })).toBeInTheDocument();
		});
	});

	describe('Accessibility', () => {
		it('should set aria-labelledby when title is provided', async () => {
			await renderAndOpen({ title: 'Confirm Action' });

			const dialog = screen.getByRole('alertdialog');
			expect(dialog).toHaveAttribute('aria-labelledby');
		});

		it('should set aria-describedby when message is provided', async () => {
			await renderAndOpen({ title: 'Confirm', message: 'This is a message' });

			const dialog = screen.getByRole('alertdialog');
			expect(dialog).toHaveAttribute('aria-describedby');
		});
	});

	describe('Interaction', () => {
		it('should emit confirmed when confirm button is clicked', async () => {
			const confirmedSpy = fn<[], void>();

			const view = await render(ConfirmDialogTestHost, {
				inputs: { title: 'Confirm' },
				on: { confirmed: confirmedSpy },
			});

			view.fixture.componentInstance.dialog().show();
			view.fixture.detectChanges();

			const user = userEvent.setup();
			await user.click(screen.getByRole('button', { name: /confirm/i }));

			expect(confirmedSpy.calls).toHaveLength(1);
		});

		it('should emit cancelled when cancel button is clicked', async () => {
			const cancelledSpy = fn<[], void>();

			const view = await render(ConfirmDialogTestHost, {
				inputs: { title: 'Confirm' },
				on: { cancelled: cancelledSpy },
			});

			view.fixture.componentInstance.dialog().show();
			view.fixture.detectChanges();

			const user = userEvent.setup();
			await user.click(screen.getByRole('button', { name: /cancel/i }));

			expect(cancelledSpy.calls).toHaveLength(1);
		});

		it('should emit cancelled on native cancel event (ESC)', async () => {
			const cancelledSpy = fn<[], void>();

			const view = await render(ConfirmDialogTestHost, {
				inputs: { title: 'Confirm' },
				on: { cancelled: cancelledSpy },
			});

			view.fixture.componentInstance.dialog().show();
			view.fixture.detectChanges();

			const dialog = screen.getByRole('alertdialog');
			const cancelEvent = new Event('cancel', { cancelable: true, bubbles: true });
			dialog.dispatchEvent(cancelEvent);

			expect(cancelledSpy.calls).toHaveLength(1);
			expect(cancelEvent.defaultPrevented).toBe(true);
		});

		it('should not open twice when show() is called while already open', async () => {
			const view = await render(ConfirmDialogTestHost, {
				inputs: { title: 'Test' },
			});

			const dialog = view.fixture.componentInstance.dialog();
			dialog.show();
			dialog.show();
			view.fixture.detectChanges();

			expect(mockShowModal.calls).toHaveLength(1);
		});

		it('should not close when dialog is already closed', async () => {
			const view = await render(ConfirmDialogTestHost, {
				inputs: { title: 'Test' },
			});

			const dialog = view.fixture.componentInstance.dialog();
			dialog.close();
			view.fixture.detectChanges();

			expect(mockClose.calls).toHaveLength(0);
		});
	});
});
