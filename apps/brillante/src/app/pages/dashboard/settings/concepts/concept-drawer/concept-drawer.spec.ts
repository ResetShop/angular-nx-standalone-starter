import { TestBed } from '@angular/core/testing'
import { provideSignalFormsConfig } from '@angular/forms/signals'
import type { TransactionConceptDto } from '@contracts/cash/cash-concept.types'
import type { DurationString } from '@contracts/common/duration.schemas'
import { flattenManagedConcepts, mapConceptTree } from '@domain/cash-concept/cash-concept.mapper'
import { createMockConceptTree } from '@mocks/cash-concept-dto.mock'
import { provideSliceTranslationMock } from '@mocks/slice-translation.mock'
import { InMemoryCashConceptApi, provideCashConceptMock } from '@providers/cash-concept/cash-concept.mock'
import { settingsEn } from '@providers/i18n/translations/slices/settings.translations'
import { DRAWER_SPINNER_MIN_DISPLAY } from '@resetshop/ui/drawer/drawer-loading'
import { parseDurationToMs } from '@resetshop/util'
import {
	advanceTimersByTime,
	advanceTimersByTimeAsync,
	clearAllMocks,
	spyOn,
	useFakeTimers,
	useRealTimers,
} from '@resetshop/util/test-utils'
import { UIStore } from '@store/ui/ui.store'
import { fireEvent, render, screen } from '@testing-library/angular'
import userEvent from '@testing-library/user-event'
import { DRAWER_CLOSE_AFTER_SUCCESS_DELAY } from '../../settings.constants'
import { ConceptDrawer } from './concept-drawer'

describe('ConceptDrawer', () => {
	let api: InMemoryCashConceptApi

	const tree = [
		createMockConceptTree({ id: 1, description: 'Sales' }, [{ id: 11, description: 'Phones' }]),
		createMockConceptTree({ id: 2, description: 'Supplies', transactionType: { id: 0, description: 'Egreso' } }, []),
	]
	const rows = flattenManagedConcepts(mapConceptTree(tree))
	const salesRow = rows[0]
	const phonesRow = rows[1]

	beforeEach(() => {
		useFakeTimers()
		clearAllMocks()
		spyOn(console, 'error')
		api = new InMemoryCashConceptApi()
		api.seed(tree)
	})

	afterEach(() => {
		useRealTimers()
	})

	async function renderDrawer() {
		const view = await render(ConceptDrawer, {
			providers: [
				provideCashConceptMock(api),
				provideSliceTranslationMock(settingsEn),
				...provideSignalFormsConfig({}),
			],
		})
		TestBed.tick()
		return view
	}

	async function settle(
		view: { fixture: { detectChanges(): void } },
		time: DurationString = DRAWER_SPINNER_MIN_DISPLAY,
	) {
		await advanceTimersByTimeAsync(parseDurationToMs(time))
		view.fixture.detectChanges()
	}

	function savedTree(): TransactionConceptDto[] {
		let concepts: TransactionConceptDto[] = []
		api.getAll().subscribe((result) => (concepts = result))
		return concepts
	}

	function findSaved(description: string): TransactionConceptDto | undefined {
		return savedTree().find((concept) => concept.description === description)
	}

	async function chooseOption(label: string) {
		const user = userEvent.setup({ advanceTimers: (ms) => advanceTimersByTime(ms) })
		await user.click(screen.getByRole('combobox'))
		await user.click(screen.getByText(label))
	}

	function typeDescription(view: { fixture: { detectChanges(): void } }, value: string): void {
		fireEvent.input(screen.getByRole('textbox', { name: /description/i }), { target: { value } })
		view.fixture.detectChanges()
	}

	describe('creating a concept', () => {
		async function openCreateConcept() {
			const view = await renderDrawer()
			view.fixture.componentInstance.openCreateConcept()
			await settle(view)
			return view
		}

		it('should offer the type and no parent selector', async () => {
			await openCreateConcept()

			expect(screen.getByRole('dialog', { name: 'New concept' })).toBeInTheDocument()
			expect(screen.getByRole('combobox')).toHaveTextContent('Income')
			expect(screen.queryByText('Select a concept')).not.toBeInTheDocument()
			expect(screen.queryByRole('checkbox', { name: /assignable/i })).not.toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled()
		})

		it('should create an income concept by default', async () => {
			const view = await openCreateConcept()

			typeDescription(view, 'Rentals')
			fireEvent.click(screen.getByRole('button', { name: 'Create' }))
			view.fixture.detectChanges()

			expect(findSaved('Rentals')).toMatchObject({ transactionType: { id: 1 }, parent: null, userAssignable: true })
		})

		it('should create an expense concept when the expense type is chosen', async () => {
			const view = await openCreateConcept()

			typeDescription(view, 'Rent')
			await chooseOption('Expense')
			view.fixture.detectChanges()
			fireEvent.click(screen.getByRole('button', { name: 'Create' }))
			view.fixture.detectChanges()

			expect(findSaved('Rent')).toMatchObject({ transactionType: { id: 0 } })
		})

		it('should keep create disabled for a too long description', async () => {
			const view = await openCreateConcept()

			typeDescription(view, 'A'.repeat(101))

			expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled()
		})

		it('should show the error and stay open when creation fails', async () => {
			api.setError('create', new Error('boom'))
			const view = await openCreateConcept()

			typeDescription(view, 'Rentals')
			fireEvent.click(screen.getByRole('button', { name: 'Create' }))
			view.fixture.detectChanges()

			expect(screen.getByRole('alert')).toHaveTextContent('Failed to create the concept')
			expect(screen.getByRole('dialog', { name: 'New concept' })).toBeInTheDocument()
		})

		it('should announce a successful creation once the drawer closed', async () => {
			const view = await openCreateConcept()

			typeDescription(view, 'Rentals')
			fireEvent.click(screen.getByRole('button', { name: 'Create' }))
			TestBed.tick()
			await settle(view, DRAWER_CLOSE_AFTER_SUCCESS_DELAY)
			fireEvent.transitionEnd(screen.getByRole('dialog'))
			view.fixture.detectChanges()

			expect(
				TestBed.inject(UIStore)
					.notifications()
					.map((item) => item.message),
			).toContain('Concept created successfully.')
		})
	})

	describe('creating a subconcept', () => {
		async function openCreateSubconcept(parentId?: number) {
			const view = await renderDrawer()
			view.fixture.componentInstance.openCreateSubconcept(parentId)
			await settle(view)
			return view
		}

		it('should preselect the given parent and show its type read-only', async () => {
			await openCreateSubconcept(2)

			expect(screen.getByRole('dialog', { name: 'New subconcept' })).toBeInTheDocument()
			expect(screen.getByRole('combobox')).toHaveTextContent('Supplies')
			expect(screen.getByTestId('concept-type-readonly')).toHaveTextContent('Expense')
			expect(screen.getByRole('checkbox', { name: /assignable/i })).toBeInTheDocument()
		})

		it('should require a parent before creating', async () => {
			const view = await openCreateSubconcept()

			typeDescription(view, 'Tablets')

			expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled()

			await chooseOption('Sales')
			view.fixture.detectChanges()

			expect(screen.getByRole('button', { name: 'Create' })).toBeEnabled()
		})

		it('should create the subconcept under the parent with the flags of the form', async () => {
			const view = await openCreateSubconcept(1)

			typeDescription(view, 'Tablets')
			fireEvent.click(screen.getByRole('checkbox', { name: /modifiable/i }))
			view.fixture.detectChanges()
			fireEvent.click(screen.getByRole('button', { name: 'Create' }))
			view.fixture.detectChanges()

			expect(findSaved('Tablets')).toMatchObject({
				parent: { id: 1 },
				transactionType: { id: 1 },
				modifiable: false,
				userAssignable: true,
			})
		})
	})

	describe('editing', () => {
		async function openEdit(row: typeof salesRow) {
			const view = await renderDrawer()
			view.fixture.componentInstance.openEdit(row)
			await settle(view)
			return view
		}

		it('should load the concept and show its type read-only', async () => {
			await openEdit(salesRow)

			expect(screen.getByRole('dialog', { name: 'Edit concept' })).toBeInTheDocument()
			expect(screen.getByRole('textbox', { name: /description/i })).toHaveValue('Sales')
			expect(screen.getByTestId('concept-type-readonly')).toHaveTextContent('Income')
			expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
		})

		it('should not offer the assignable flag for a top level concept', async () => {
			await openEdit(salesRow)

			expect(screen.queryByRole('checkbox', { name: /assignable/i })).not.toBeInTheDocument()
		})

		it('should offer the assignable flag for a subconcept', async () => {
			await openEdit(phonesRow)

			expect(screen.getByRole('checkbox', { name: /assignable/i })).toBeChecked()
		})

		it('should keep save disabled until something changes', async () => {
			const view = await openEdit(phonesRow)
			expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()

			typeDescription(view, 'Smartphones')

			expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
		})

		it('should save the edited description', async () => {
			const view = await openEdit(salesRow)

			typeDescription(view, 'Revenue')
			fireEvent.click(screen.getByRole('button', { name: 'Save' }))
			view.fixture.detectChanges()

			expect(savedTree().find((concept) => concept.id === 1)?.description).toBe('Revenue')
		})

		it('should show the error and stay open when the update fails', async () => {
			api.setError('update', new Error('boom'))
			const view = await openEdit(salesRow)

			typeDescription(view, 'Revenue')
			fireEvent.click(screen.getByRole('button', { name: 'Save' }))
			view.fixture.detectChanges()

			expect(screen.getByRole('alert')).toHaveTextContent('Failed to update the concept')
			expect(screen.getByRole('dialog', { name: 'Edit concept' })).toBeInTheDocument()
		})
	})

	it('should ask for confirmation before discarding a dirty form', async () => {
		const view = await renderDrawer()
		view.fixture.componentInstance.openCreateConcept()
		await settle(view)

		typeDescription(view, 'Rentals')
		fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
		view.fixture.detectChanges()

		expect(screen.getByText('You have unsaved changes. Are you sure you want to discard them?')).toBeInTheDocument()
	})
})
