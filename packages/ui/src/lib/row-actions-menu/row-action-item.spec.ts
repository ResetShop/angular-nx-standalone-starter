import { TestBed } from '@angular/core/testing'
import { provideIcons } from '@ng-icons/core'
import { featherEdit3 } from '@ng-icons/feather-icons'
import { clearAllMocks, fn } from '@resetshop/util/test-utils'
import { render, screen } from '@testing-library/angular'
import userEvent from '@testing-library/user-event'
import { NgpMenu, NgpMenuTrigger } from 'ng-primitives/menu'
import { RowActionItem, type RowAction } from './row-action-item'

// NgpMenuItem requires injection tokens provided by NgpMenuTrigger + NgpMenu; rendering the
// item standalone throws at injection time.
async function renderItemOpen(action: RowAction): Promise<void> {
	await render(
		`<button [ngpMenuTrigger]="menu" type="button">Open</button>
		 <ng-template #menu>
		   <div ngpMenu role="menu">
		     <app-row-action-item [action]="action" />
		   </div>
		 </ng-template>`,
		{
			imports: [RowActionItem, NgpMenu, NgpMenuTrigger],
			providers: [provideIcons({ featherEdit3 })],
			componentProperties: { action },
		},
	)
	await userEvent.setup().click(screen.getByRole('button', { name: 'Open' }))
}

// Closes the open menu so the library tears down its overlay portal before the next test;
// TestBed.tick() flushes the signal-driven close under zoneless + happy-dom.
async function closeMenu(): Promise<void> {
	await userEvent.setup().keyboard('{Escape}')
	TestBed.tick()
}

describe('RowActionItem', () => {
	beforeEach(() => clearAllMocks())

	it('renders the action label as the menuitem accessible name', async () => {
		await renderItemOpen({ label: 'Edit', onSelect: fn() })

		expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument()

		await closeMenu()
	})

	it('invokes the action onSelect callback on click', async () => {
		const selectSpy = fn()
		await renderItemOpen({ label: 'Edit', onSelect: selectSpy })

		await userEvent.setup().click(screen.getByRole('menuitem', { name: 'Edit' }))

		expect(selectSpy.calls).toHaveLength(1)

		await closeMenu()
	})

	it('applies text-destructive styling when variant is "destructive"', async () => {
		await renderItemOpen({ label: 'Delete', onSelect: fn(), variant: 'destructive' })

		const item = screen.getByRole('menuitem', { name: 'Delete' })
		expect(item).toHaveClass('text-destructive')
		expect(item).not.toHaveClass('text-gray-900')

		await closeMenu()
	})

	it('applies gray styling when variant is "default" or unset', async () => {
		await renderItemOpen({ label: 'Edit', onSelect: fn() })

		const item = screen.getByRole('menuitem', { name: 'Edit' })
		expect(item).toHaveClass('text-gray-900')
		expect(item).not.toHaveClass('text-destructive')

		await closeMenu()
	})

	it('marks the button as disabled and suppresses the onSelect callback when disabled', async () => {
		const selectSpy = fn()
		await renderItemOpen({ label: 'Archived', onSelect: selectSpy, disabled: true })

		const item = screen.getByRole('menuitem', { name: 'Archived' })
		expect(item).toBeDisabled()

		await userEvent.setup().click(item)
		expect(selectSpy.calls).toHaveLength(0)

		await closeMenu()
	})

	it('renders the action icon when icon is provided', async () => {
		await renderItemOpen({ label: 'Edit', onSelect: fn(), icon: 'featherEdit3' })

		expect(screen.getByTestId('action-icon')).toBeInTheDocument()

		await closeMenu()
	})

	it('does not render the action icon when icon is not provided', async () => {
		await renderItemOpen({ label: 'Edit', onSelect: fn() })

		expect(screen.queryByTestId('action-icon')).toBeNull()

		await closeMenu()
	})
})
