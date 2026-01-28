import { Translation } from '@providers/i18n/translation';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { Pagination } from './pagination';

const TRANSLATIONS: Record<string, string> = {
	'PAGINATION.LABEL': 'Pagination',
	'PAGINATION.SHOWING_RESULTS': 'Showing {from} to {to} of {total} results',
	'PAGINATION.PREVIOUS': 'Previous',
	'PAGINATION.NEXT': 'Next',
	'PAGINATION.PAGE_OF': 'Page {page} of {total}',
	'PAGINATION.GO_TO_PREVIOUS': 'Go to previous page',
	'PAGINATION.GO_TO_NEXT': 'Go to next page',
};

const mockTranslation = {
	instant: (key: string) => TRANSLATIONS[key] ?? key,
};

describe('Pagination', () => {
	it('should render pagination navigation', async () => {
		await render(Pagination, {
			inputs: { currentPage: 1, totalPages: 5, totalItems: 50, pageSize: 10 },
			providers: [{ provide: Translation, useValue: mockTranslation }],
		});

		expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument();
	});

	it('should display item count', async () => {
		await render(Pagination, {
			inputs: { currentPage: 1, totalPages: 5, totalItems: 50, pageSize: 10 },
			providers: [{ provide: Translation, useValue: mockTranslation }],
		});

		expect(screen.getByText(/showing 1 to 10 of 50 results/i)).toBeInTheDocument();
	});

	it('should display correct item count for middle page', async () => {
		await render(Pagination, {
			inputs: { currentPage: 3, totalPages: 5, totalItems: 50, pageSize: 10 },
			providers: [{ provide: Translation, useValue: mockTranslation }],
		});

		expect(screen.getByText(/showing 21 to 30 of 50 results/i)).toBeInTheDocument();
	});

	it('should display correct item count for last page with partial items', async () => {
		await render(Pagination, {
			inputs: { currentPage: 3, totalPages: 3, totalItems: 25, pageSize: 10 },
			providers: [{ provide: Translation, useValue: mockTranslation }],
		});

		expect(screen.getByText(/showing 21 to 25 of 25 results/i)).toBeInTheDocument();
	});

	it('should display page indicator', async () => {
		await render(Pagination, {
			inputs: { currentPage: 2, totalPages: 5, totalItems: 50, pageSize: 10 },
			providers: [{ provide: Translation, useValue: mockTranslation }],
		});

		expect(screen.getByText(/page 2 of 5/i)).toBeInTheDocument();
	});

	it('should disable previous button on first page', async () => {
		await render(Pagination, {
			inputs: { currentPage: 1, totalPages: 5, totalItems: 50, pageSize: 10 },
			providers: [{ provide: Translation, useValue: mockTranslation }],
		});

		const prevButton = screen.getByRole('button', { name: /go to previous page/i });
		expect(prevButton).toHaveAttribute('aria-disabled', 'true');
	});

	it('should disable next button on last page', async () => {
		await render(Pagination, {
			inputs: { currentPage: 5, totalPages: 5, totalItems: 50, pageSize: 10 },
			providers: [{ provide: Translation, useValue: mockTranslation }],
		});

		const nextButton = screen.getByRole('button', { name: /go to next page/i });
		expect(nextButton).toHaveAttribute('aria-disabled', 'true');
	});

	it('should emit pageChange with next page on next click', async () => {
		const user = userEvent.setup();
		const pageChangeSpy = vi.fn();

		await render(Pagination, {
			inputs: { currentPage: 2, totalPages: 5, totalItems: 50, pageSize: 10 },
			on: { pageChange: pageChangeSpy },
			providers: [{ provide: Translation, useValue: mockTranslation }],
		});

		const nextButton = screen.getByRole('button', { name: /go to next page/i });
		await user.click(nextButton);

		expect(pageChangeSpy).toHaveBeenCalledWith(3);
	});

	it('should emit pageChange with previous page on previous click', async () => {
		const user = userEvent.setup();
		const pageChangeSpy = vi.fn();

		await render(Pagination, {
			inputs: { currentPage: 3, totalPages: 5, totalItems: 50, pageSize: 10 },
			on: { pageChange: pageChangeSpy },
			providers: [{ provide: Translation, useValue: mockTranslation }],
		});

		const prevButton = screen.getByRole('button', { name: /go to previous page/i });
		await user.click(prevButton);

		expect(pageChangeSpy).toHaveBeenCalledWith(2);
	});

	it('should enable both buttons on middle page', async () => {
		await render(Pagination, {
			inputs: { currentPage: 3, totalPages: 5, totalItems: 50, pageSize: 10 },
			providers: [{ provide: Translation, useValue: mockTranslation }],
		});

		expect(screen.getByRole('button', { name: /go to previous page/i })).toHaveAttribute('aria-disabled', 'false');
		expect(screen.getByRole('button', { name: /go to next page/i })).toHaveAttribute('aria-disabled', 'false');
	});

	it('should show 0 to 0 when no items', async () => {
		await render(Pagination, {
			inputs: { currentPage: 1, totalPages: 1, totalItems: 0, pageSize: 10 },
			providers: [{ provide: Translation, useValue: mockTranslation }],
		});

		expect(screen.getByText(/showing 0 to 0 of 0 results/i)).toBeInTheDocument();
	});

	it('should not emit pageChange when clicking disabled previous button', async () => {
		const user = userEvent.setup();
		const pageChangeSpy = vi.fn();

		await render(Pagination, {
			inputs: { currentPage: 1, totalPages: 5, totalItems: 50, pageSize: 10 },
			on: { pageChange: pageChangeSpy },
			providers: [{ provide: Translation, useValue: mockTranslation }],
		});

		const prevButton = screen.getByRole('button', { name: /go to previous page/i });
		await user.click(prevButton);

		expect(pageChangeSpy).not.toHaveBeenCalled();
	});

	it('should not emit pageChange when clicking disabled next button', async () => {
		const user = userEvent.setup();
		const pageChangeSpy = vi.fn();

		await render(Pagination, {
			inputs: { currentPage: 5, totalPages: 5, totalItems: 50, pageSize: 10 },
			on: { pageChange: pageChangeSpy },
			providers: [{ provide: Translation, useValue: mockTranslation }],
		});

		const nextButton = screen.getByRole('button', { name: /go to next page/i });
		await user.click(nextButton);

		expect(pageChangeSpy).not.toHaveBeenCalled();
	});

	it('should disable both buttons when there is only one page', async () => {
		await render(Pagination, {
			inputs: { currentPage: 1, totalPages: 1, totalItems: 5, pageSize: 10 },
			providers: [{ provide: Translation, useValue: mockTranslation }],
		});

		expect(screen.getByRole('button', { name: /go to previous page/i })).toHaveAttribute('aria-disabled', 'true');
		expect(screen.getByRole('button', { name: /go to next page/i })).toHaveAttribute('aria-disabled', 'true');
	});
});
