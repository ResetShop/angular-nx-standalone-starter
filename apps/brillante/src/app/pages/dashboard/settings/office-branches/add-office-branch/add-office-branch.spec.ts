import { TestBed } from '@angular/core/testing'
import { provideSignalFormsConfig } from '@angular/forms/signals'
import { ActivatedRoute, provideRouter, Router } from '@angular/router'
import { provideSliceTranslationMock } from '@mocks/slice-translation.mock'
import { settingsEn } from '@providers/i18n/translations/slices/settings.translations'
import { InMemoryOfficeBranchApi, provideOfficeBranchMock } from '@providers/office-branch/office-branch.mock'
import {
	advanceTimersByTimeAsync,
	clearAllMocks,
	spyOn,
	useFakeTimers,
	useRealTimers,
} from '@resetshop/util/test-utils'
import { UIStore } from '@store/ui/ui.store'
import { fireEvent, render, screen } from '@testing-library/angular'
import AddOfficeBranch from './add-office-branch'

describe('AddOfficeBranch', () => {
	let api: InMemoryOfficeBranchApi

	beforeEach(() => {
		useFakeTimers()
		clearAllMocks()
		spyOn(console, 'error')
		localStorage.clear()
		api = new InMemoryOfficeBranchApi()
	})

	afterEach(() => {
		useRealTimers()
		localStorage.clear()
	})

	async function renderPage() {
		const view = await render(AddOfficeBranch, {
			providers: [
				provideRouter([]),
				provideOfficeBranchMock(api),
				provideSliceTranslationMock(settingsEn),
				...provideSignalFormsConfig({}),
			],
		})
		TestBed.tick()
		await advanceTimersByTimeAsync(1000)
		view.fixture.detectChanges()
		return view
	}

	function fillForm(view: { fixture: { detectChanges(): void } }, name = 'Sur', address = 'Mitre 300'): void {
		fireEvent.input(screen.getByRole('textbox', { name: /name/i }), { target: { value: name } })
		fireEvent.input(screen.getByRole('textbox', { name: /address/i }), { target: { value: address } })
		view.fixture.detectChanges()
	}

	function savedBranches() {
		let branches: { id: number; name: string; address: string }[] = []
		api.getAll().subscribe((result) => (branches = result))
		return branches
	}

	it('should render the form with the create button disabled', async () => {
		await renderPage()

		expect(screen.getByRole('heading', { level: 1, name: 'Add branch' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Create branch' })).toBeDisabled()
		expect(screen.getByRole('link', { name: 'Cancel' })).toBeInTheDocument()
	})

	it.each([
		['name is empty', /name/i, ''],
		['address is empty', /address/i, ''],
		['name is too long', /name/i, 'N'.repeat(101)],
		['address is too long', /address/i, 'A'.repeat(201)],
	])('should keep create disabled when the %s', async (_case, field, value) => {
		const view = await renderPage()

		fillForm(view)
		fireEvent.input(screen.getByRole('textbox', { name: field }), { target: { value } })
		view.fixture.detectChanges()

		expect(screen.getByRole('button', { name: 'Create branch' })).toBeDisabled()
	})

	it('should create the branch with trimmed values', async () => {
		const view = await renderPage()

		fillForm(view, '  Sur ', ' Mitre 300 ')
		fireEvent.click(screen.getByRole('button', { name: 'Create branch' }))
		view.fixture.detectChanges()

		expect(savedBranches()).toEqual([{ id: 1, name: 'Sur', address: 'Mitre 300' }])
	})

	it('should announce the creation and go back to the list', async () => {
		const view = await renderPage()
		const navigate = spyOn(TestBed.inject(Router), 'navigate')

		fillForm(view)
		fireEvent.click(screen.getByRole('button', { name: 'Create branch' }))
		TestBed.tick()

		expect(
			TestBed.inject(UIStore)
				.notifications()
				.map((item) => item.message),
		).toEqual(['Branch created successfully.'])
		expect(navigate.calls).toHaveLength(1)
		expect(navigate.calls[0][0]).toEqual(['..'])
		expect(navigate.calls[0][1]).toEqual({ relativeTo: TestBed.inject(ActivatedRoute) })
	})

	it('should announce the failure and stay on the form when creation fails', async () => {
		api.setError('create', new Error('boom'))
		const view = await renderPage()
		const navigate = spyOn(TestBed.inject(Router), 'navigate')

		fillForm(view)
		fireEvent.click(screen.getByRole('button', { name: 'Create branch' }))
		TestBed.tick()

		expect(
			TestBed.inject(UIStore)
				.notifications()
				.map((item) => item.message),
		).toEqual(['Failed to create branch'])
		expect(navigate.calls).toHaveLength(0)
		expect(screen.getByRole('button', { name: 'Create branch' })).toBeEnabled()
	})
})
