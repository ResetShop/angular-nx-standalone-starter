import { TestBed } from '@angular/core/testing'
import { provideSignalFormsConfig } from '@angular/forms/signals'
import type { TransactionConceptDto } from '@contracts/cash/cash-concept.types'
import { createMockConceptTree } from '@mocks/cash-concept-dto.mock'
import { provideSliceTranslationMock } from '@mocks/slice-translation.mock'
import { InMemoryCashConceptApi, provideCashConceptMock } from '@providers/cash-concept/cash-concept.mock'
import { settingsEn } from '@providers/i18n/translations/slices/settings.translations'
import {
	advanceTimersByTime,
	advanceTimersByTimeAsync,
	clearAllMocks,
	spyOn,
	useFakeTimers,
	useRealTimers,
} from '@resetshop/util/test-utils'
import { UIStore } from '@store/ui/ui.store'
import { fireEvent, render, screen, within } from '@testing-library/angular'
import userEvent from '@testing-library/user-event'
import Concepts from './concepts'

describe('Concepts', () => {
	let api: InMemoryCashConceptApi

	const tree = [
		createMockConceptTree({ id: 1, description: 'Sales' }, [
			{ id: 11, description: 'Phones' },
			{ id: 12, description: 'Locked', modifiable: false },
			{ id: 13, description: 'Hidden', userAssignable: false },
		]),
		createMockConceptTree({ id: 2, description: 'Supplies', transactionType: { id: 0, description: 'Egreso' } }, [
			{ id: 21, description: 'Paper', enabled: false },
		]),
		createMockConceptTree({ id: 3, description: 'Register', userAssignable: false }, []),
	]

	beforeEach(() => {
		useFakeTimers()
		clearAllMocks()
		spyOn(console, 'error')
		api = new InMemoryCashConceptApi()
		api.seed(tree)
	})

	afterEach(() => {
		useRealTimers()
		screen.queryAllByTestId('row-actions-menu').forEach((menu) => menu.remove())
	})

	async function renderPage() {
		const view = await render(Concepts, {
			providers: [
				provideCashConceptMock(api),
				provideSliceTranslationMock(settingsEn),
				...provideSignalFormsConfig({}),
			],
		})
		TestBed.tick()
		await advanceTimersByTimeAsync(1000)
		view.fixture.detectChanges()
		return view
	}

	async function openRowMenu(name: RegExp): Promise<void> {
		fireEvent.click(within(screen.getByRole('row', { name })).getByRole('button', { name: 'Actions' }))
		TestBed.tick()
		await advanceTimersByTimeAsync(50)
	}

	function cellTexts(name: RegExp): (string | undefined)[] {
		return within(screen.getByRole('row', { name }))
			.getAllByRole('cell')
			.map((cell) => cell.textContent?.trim())
	}

	function savedConcept(id: number): TransactionConceptDto | undefined {
		let concepts: TransactionConceptDto[] = []
		api.getAll().subscribe((result) => (concepts = result))
		return concepts.find((concept) => concept.id === id)
	}

	it('should list the assignable concepts followed by their assignable subconcepts', async () => {
		await renderPage()

		const descriptions = screen
			.getAllByRole('row')
			.slice(1)
			.map((row) => within(row).getAllByRole('cell')[0].textContent?.trim())
		expect(descriptions).toEqual(['Sales', 'Phones', 'Locked', 'Supplies', 'Paper'])
	})

	it('should show the type, parent, modifiable flag and status of each concept', async () => {
		await renderPage()

		expect(cellTexts(/^Phones/)).toEqual(['Phones', 'Income', 'Sales', 'Yes', 'Enabled', ''])
		expect(cellTexts(/^Locked/)).toEqual(['Locked', 'Income', 'Sales', 'No', 'Enabled', ''])
		expect(cellTexts(/^Paper/)).toEqual(['Paper', 'Expense', 'Supplies', 'Yes', 'Disabled', ''])
		expect(cellTexts(/^Sales/)).toEqual(['Sales', 'Income', '—', 'Yes', 'Enabled', ''])
	})

	it('should narrow the list to the selected transaction type', async () => {
		const view = await renderPage()
		const user = userEvent.setup({ advanceTimers: (ms) => advanceTimersByTime(ms) })

		await user.click(screen.getAllByRole('combobox')[0])
		await user.click(within(screen.getByTestId('select-dropdown')).getByText('Expense'))
		TestBed.tick()
		view.fixture.detectChanges()

		expect(screen.queryByRole('row', { name: /Phones/ })).not.toBeInTheDocument()
		expect(screen.getByRole('row', { name: /Paper/ })).toBeInTheDocument()
	})

	it('should show the read error when the concepts cannot be loaded', async () => {
		api.setError('getAll', new Error('boom'))

		await renderPage()

		expect(screen.getByRole('alert')).toHaveTextContent('Failed to load cash concepts')
	})

	it('should open the drawer to create a concept', async () => {
		const view = await renderPage()

		fireEvent.click(screen.getByRole('button', { name: 'New concept' }))
		view.fixture.detectChanges()

		expect(screen.getByRole('dialog', { name: 'New concept' })).toBeInTheDocument()
	})

	it('should open the drawer to create a subconcept', async () => {
		const view = await renderPage()

		fireEvent.click(screen.getByRole('button', { name: 'New subconcept' }))
		view.fixture.detectChanges()

		expect(screen.getByRole('dialog', { name: 'New subconcept' })).toBeInTheDocument()
	})

	it('should offer adding a subconcept to a top level concept, with the concept preselected', async () => {
		const view = await renderPage()

		await openRowMenu(/^Sales/)
		fireEvent.click(screen.getByRole('menuitem', { name: 'Add subconcept' }))
		view.fixture.detectChanges()
		await advanceTimersByTimeAsync(500)
		view.fixture.detectChanges()

		expect(screen.getByRole('dialog', { name: 'New subconcept' })).toBeInTheDocument()
		expect(within(screen.getByRole('dialog', { name: 'New subconcept' })).getByRole('combobox')).toHaveTextContent(
			'Sales',
		)
	})

	it('should not offer adding a subconcept to a subconcept', async () => {
		await renderPage()

		await openRowMenu(/^Phones/)

		expect(screen.queryByRole('menuitem', { name: 'Add subconcept' })).not.toBeInTheDocument()
		expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument()
	})

	it('should offer no actions for a subconcept that is not modifiable', async () => {
		await renderPage()

		expect(
			within(screen.getByRole('row', { name: /^Locked/ })).queryByRole('button', { name: 'Actions' }),
		).not.toBeInTheDocument()
	})

	it('should open the edit drawer with the chosen concept', async () => {
		const view = await renderPage()

		await openRowMenu(/^Phones/)
		fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }))
		view.fixture.detectChanges()
		await advanceTimersByTimeAsync(500)
		view.fixture.detectChanges()

		expect(screen.getByRole('dialog', { name: 'Edit concept' })).toBeInTheDocument()
		expect(screen.getByRole('textbox', { name: /description/i })).toHaveValue('Phones')
	})

	it('should disable an enabled concept and announce it', async () => {
		const view = await renderPage()

		await openRowMenu(/^Sales/)
		fireEvent.click(screen.getByRole('menuitem', { name: 'Disable' }))
		TestBed.tick()
		view.fixture.detectChanges()

		expect(savedConcept(1)?.enabled).toBe(false)
		expect(
			TestBed.inject(UIStore)
				.notifications()
				.map((item) => item.message),
		).toEqual(['Concept disabled successfully.'])
	})

	it('should enable a disabled concept and announce it', async () => {
		api.seed([
			createMockConceptTree(
				{ id: 2, description: 'Supplies', enabled: false, transactionType: { id: 0, description: 'Egreso' } },
				[],
			),
		])
		const view = await renderPage()

		await openRowMenu(/^Supplies/)
		fireEvent.click(screen.getByRole('menuitem', { name: 'Enable' }))
		TestBed.tick()
		view.fixture.detectChanges()

		expect(savedConcept(2)?.enabled).toBe(true)
		expect(
			TestBed.inject(UIStore)
				.notifications()
				.map((item) => item.message),
		).toEqual(['Concept enabled successfully.'])
	})

	it('should announce the failure when the status cannot be changed', async () => {
		api.setError('disable', new Error('boom'))
		const view = await renderPage()

		await openRowMenu(/^Sales/)
		fireEvent.click(screen.getByRole('menuitem', { name: 'Disable' }))
		TestBed.tick()
		view.fixture.detectChanges()

		expect(
			TestBed.inject(UIStore)
				.notifications()
				.map((item) => item.message),
		).toEqual(['Failed to change the status of the concept'])
		expect(savedConcept(1)?.enabled).toBe(true)
	})
})
