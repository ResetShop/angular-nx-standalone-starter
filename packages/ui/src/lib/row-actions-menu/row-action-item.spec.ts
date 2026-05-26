import { provideIcons } from '@ng-icons/core'
import { featherEdit3 } from '@ng-icons/feather-icons'
import { clearAllMocks, fn } from '@resetshop/util/test-utils'
import { render, screen } from '@testing-library/angular'
import userEvent from '@testing-library/user-event'
import { NgpMenu, NgpMenuTrigger } from 'ng-primitives/menu'
import { RowActionItem, type RowAction } from './row-action-item'

// NgpMenuItem requires both the NgpRovingFocusGroup token (from NgpMenu) and the NgpOverlay
// context that only NgpMenuTrigger provides. Rendering `<div ngpMenu>` standalone throws at
// injection time, so each test mounts the item via a trigger and clicks the trigger open
// before asserting on the menuitem. This mirrors the host setup the item runs in production.
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

describe('RowActionItem', () => {
	beforeEach(() => clearAllMocks())

	// The ng-primitives overlay portal mounts into document.body, outside the Angular test
	// fixture's view tree. Testing Library's auto-cleanup tears down the fixture but does not
	// reach the portal, so a test that opens the menu leaks a `<div ngpmenu>` node and breaks
	// the next test with "Found multiple elements" errors.
	afterEach(() => {
		// eslint-disable-next-line testing-library/no-node-access
		document.querySelectorAll('[ngpmenu]').forEach((el) => el.remove())
	})

	it('renders the action label as the menuitem accessible name', async () => {
		await renderItemOpen({ label: 'Edit', onSelect: fn() })

		expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument()
	})

	it('invokes the action onSelect callback on click', async () => {
		const selectSpy = fn()
		await renderItemOpen({ label: 'Edit', onSelect: selectSpy })

		await userEvent.setup().click(screen.getByRole('menuitem', { name: 'Edit' }))

		expect(selectSpy.calls).toHaveLength(1)
	})

	it('applies text-destructive styling when variant is "destructive"', async () => {
		await renderItemOpen({ label: 'Delete', onSelect: fn(), variant: 'destructive' })

		const item = screen.getByRole('menuitem', { name: 'Delete' })
		expect(item).toHaveClass('text-destructive')
		expect(item).not.toHaveClass('text-gray-900')
	})

	it('applies gray styling when variant is "default" or unset', async () => {
		await renderItemOpen({ label: 'Edit', onSelect: fn() })

		const item = screen.getByRole('menuitem', { name: 'Edit' })
		expect(item).toHaveClass('text-gray-900')
		expect(item).not.toHaveClass('text-destructive')
	})

	it('marks the button as disabled and suppresses the onSelect callback when disabled', async () => {
		const selectSpy = fn()
		await renderItemOpen({ label: 'Archived', onSelect: selectSpy, disabled: true })

		const item = screen.getByRole('menuitem', { name: 'Archived' })
		expect(item).toBeDisabled()

		await userEvent.setup().click(item)
		expect(selectSpy.calls).toHaveLength(0)
	})

	it('renders an ng-icon when icon is provided', async () => {
		await renderItemOpen({ label: 'Edit', onSelect: fn(), icon: 'featherEdit3' })

		// <ng-icon> has no implicit ARIA role; assert on the menuitem's DOM substructure. The
		// rendered `name` attribute is a bound input not reflected back to the host element, so
		// the presence-of-an-icon-child is the meaningful assertion for the @if branch.
		const item = screen.getByRole('menuitem', { name: 'Edit' })
		// eslint-disable-next-line testing-library/no-node-access
		expect(item.querySelector('ng-icon')).not.toBeNull()
	})

	it('does not render an ng-icon when icon is not provided', async () => {
		await renderItemOpen({ label: 'Edit', onSelect: fn() })

		const item = screen.getByRole('menuitem', { name: 'Edit' })
		// eslint-disable-next-line testing-library/no-node-access
		expect(item.querySelector('ng-icon')).toBeNull()
	})
})
