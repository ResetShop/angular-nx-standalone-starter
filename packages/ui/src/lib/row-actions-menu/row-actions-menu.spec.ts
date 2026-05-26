import { clearAllMocks, fn } from '@resetshop/util/test-utils'
import { render, screen } from '@testing-library/angular'
import userEvent from '@testing-library/user-event'
import { RowActionsMenu, type RowAction } from './row-actions-menu'

describe('RowActionsMenu', () => {
	beforeEach(() => clearAllMocks())

	// The `ng-primitives` menu attaches its content to an overlay portal in `document.body`,
	// outside the Angular test fixture's view tree. Testing Library's auto-cleanup destroys the
	// fixture but does not reach the portal, so a test that ends with the menu open leaks a
	// `<div ngpmenu>` into `document.body` and breaks subsequent tests with "Found multiple
	// elements" errors. Removing those leftover portal nodes directly is the cleanest workaround
	// — calling Escape via userEvent in afterEach is unreliable under the zoneless test config.
	afterEach(() => {
		// eslint-disable-next-line testing-library/no-node-access
		document.querySelectorAll('[ngpmenu]').forEach((el) => el.remove())
	})

	it('renders nothing when actions is empty', async () => {
		await render(RowActionsMenu, {
			inputs: { actions: [] },
		})

		// Empty-actions guard: the trigger button is not rendered, the menu template never instantiates.
		expect(screen.queryByRole('button')).toBeNull()
	})

	it('renders the trigger button with the default accessible name', async () => {
		await render(RowActionsMenu, {
			inputs: { actions: [{ label: 'Edit', onSelect: fn() }] },
		})

		expect(screen.getByRole('button', { name: 'Actions' })).toBeInTheDocument()
	})

	it('renders the trigger button with a custom accessible name via triggerLabel input', async () => {
		await render(RowActionsMenu, {
			inputs: {
				actions: [{ label: 'Edit', onSelect: fn() }],
				triggerLabel: 'Row actions',
			},
		})

		expect(screen.getByRole('button', { name: 'Row actions' })).toBeInTheDocument()
	})

	it('opens the menu on trigger click and reveals every action as a menuitem', async () => {
		const user = userEvent.setup()
		const actions: RowAction[] = [
			{ label: 'Edit', onSelect: fn() },
			{ label: 'Reset password', onSelect: fn() },
			{ label: 'Delete', onSelect: fn(), variant: 'destructive' },
		]
		await render(RowActionsMenu, { inputs: { actions } })

		await user.click(screen.getByRole('button', { name: 'Actions' }))

		expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument()
		expect(screen.getByRole('menuitem', { name: 'Reset password' })).toBeInTheDocument()
		expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument()
	})

	it('invokes the action onSelect callback when its menuitem is clicked', async () => {
		const user = userEvent.setup()
		const editSpy = fn()
		const deleteSpy = fn()
		await render(RowActionsMenu, {
			inputs: {
				actions: [
					{ label: 'Edit', onSelect: editSpy },
					{ label: 'Delete', onSelect: deleteSpy, variant: 'destructive' },
				],
			},
		})

		await user.click(screen.getByRole('button', { name: 'Actions' }))
		await user.click(screen.getByRole('menuitem', { name: 'Delete' }))

		expect(deleteSpy.calls).toHaveLength(1)
		expect(editSpy.calls).toHaveLength(0)
	})

	// Note: close-on-select and close-on-Escape are guaranteed by `ng-primitives` and intentionally
	// not re-tested here. The zoneless + happy-dom test environment does not propagate the overlay's
	// signal-driven DOM updates from those events synchronously; flushing them would require either
	// dropping zoneless (which would diverge from the rest of the suite) or asserting against fake
	// timers (overkill for library-owned behavior). The afterEach hook below removes any leftover
	// menu portal so test isolation is preserved.

	it('applies text-destructive to items with variant="destructive"', async () => {
		const user = userEvent.setup()
		await render(RowActionsMenu, {
			inputs: {
				actions: [
					{ label: 'Edit', onSelect: fn() },
					{ label: 'Delete', onSelect: fn(), variant: 'destructive' },
				],
			},
		})

		await user.click(screen.getByRole('button', { name: 'Actions' }))

		expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveClass('text-destructive')
		expect(screen.getByRole('menuitem', { name: 'Edit' })).not.toHaveClass('text-destructive')
	})

	it('marks disabled items as disabled and does not invoke their callback on click', async () => {
		const user = userEvent.setup()
		const archivedSpy = fn()
		await render(RowActionsMenu, {
			inputs: {
				actions: [{ label: 'Archived', onSelect: archivedSpy, disabled: true }],
			},
		})

		await user.click(screen.getByRole('button', { name: 'Actions' }))
		const item = screen.getByRole('menuitem', { name: 'Archived' })
		expect(item).toBeDisabled()

		await user.click(item)
		expect(archivedSpy.calls).toHaveLength(0)
	})

	it('keeps the data-touch-target attribute on the trigger for mobile hit area', async () => {
		await render(RowActionsMenu, {
			inputs: { actions: [{ label: 'Edit', onSelect: fn() }] },
		})

		expect(screen.getByRole('button', { name: 'Actions' })).toHaveAttribute('data-touch-target')
	})
})
