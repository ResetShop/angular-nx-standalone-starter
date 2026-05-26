import { TestBed } from '@angular/core/testing'
import { clearAllMocks, fn } from '@resetshop/util/test-utils'
import { render, screen } from '@testing-library/angular'
import userEvent from '@testing-library/user-event'
import { type RowAction } from './row-action-item'
import { RowActionsMenu } from './row-actions-menu'

// Closes any open ng-primitives menu so its overlay portal is removed before the next test.
// Without this, the portal node leaks into document.body (outside Testing Library's cleanup
// scope) and the next test sees a stale `<div ngpmenu>`. Escape triggers the library's close;
// TestBed.tick() flushes the signal-driven DOM update under zoneless + happy-dom.
async function closeMenu(user: ReturnType<typeof userEvent.setup>): Promise<void> {
	await user.keyboard('{Escape}')
	TestBed.tick()
}

describe('RowActionsMenu', () => {
	beforeEach(() => clearAllMocks())

	it('renders nothing when actions is empty', async () => {
		await render(RowActionsMenu, {
			inputs: { actions: [] },
		})

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

		await closeMenu(user)
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

		await closeMenu(user)
	})

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

		await closeMenu(user)
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

		await closeMenu(user)
	})

	it('keeps the data-touch-target attribute on the trigger for mobile hit area', async () => {
		await render(RowActionsMenu, {
			inputs: { actions: [{ label: 'Edit', onSelect: fn() }] },
		})

		expect(screen.getByRole('button', { name: 'Actions' })).toHaveAttribute('data-touch-target')
	})
})
