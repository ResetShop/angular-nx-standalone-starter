import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { provideRouter, Router } from '@angular/router'
import { clearAllMocks, fn, type MockFn } from '@resetshop/util/test-utils'
import { render, screen, within } from '@testing-library/angular'
import userEvent from '@testing-library/user-event'
import type { NgpMenuPlacement } from 'ng-primitives/menu'
import { type MenuItemsInput } from '../menu/menu-groups'
import { UserMenu, type UserMenuItem } from './user-menu'

@Component({ template: '' })
class BlankPage {}

describe('UserMenu', () => {
	let logOut: MockFn
	let items: UserMenuItem[][]

	beforeEach(() => {
		clearAllMocks()
		logOut = fn()
		items = [
			[
				{ label: 'Account', route: '/account' },
				{ label: 'Settings', route: '/settings' },
			],
			[{ label: 'Log out', onSelect: logOut }],
		]
	})

	async function renderMenu(
		overrides: { collapsed?: boolean; items?: MenuItemsInput<UserMenuItem>; placement?: NgpMenuPlacement } = {},
	) {
		return render(UserMenu, {
			inputs: { name: 'Ada Lovelace', email: 'ada@example.com', initials: 'AL', items, ...overrides },
			providers: [provideRouter([{ path: '**', component: BlankPage }])],
		})
	}

	function trigger(): HTMLElement {
		return screen.getByRole('button', { name: 'Ada Lovelace' })
	}

	async function openMenu(user: ReturnType<typeof userEvent.setup>): Promise<HTMLElement> {
		await user.click(trigger())
		TestBed.tick()
		return screen.getByRole('menu')
	}

	// Closes the menu so the overlay portal is torn down before the next test; TestBed.tick() flushes
	// the signal-driven close under zoneless + happy-dom.
	async function closeMenu(user: ReturnType<typeof userEvent.setup>): Promise<void> {
		await user.keyboard('{Escape}')
		TestBed.tick()
	}

	describe('trigger', () => {
		it('shows the avatar, name and email when expanded', async () => {
			await renderMenu()

			expect(within(trigger()).getByText('AL')).toBeInTheDocument()
			expect(within(trigger()).getByText('Ada Lovelace')).toBeInTheDocument()
			expect(within(trigger()).getByText('ada@example.com')).toBeInTheDocument()
		})

		it('shows only the avatar when collapsed, while still being named after the user', async () => {
			await renderMenu({ collapsed: true })

			expect(within(trigger()).getByText('AL')).toBeInTheDocument()
			expect(within(trigger()).queryByText('Ada Lovelace')).not.toBeInTheDocument()
			expect(within(trigger()).queryByText('ada@example.com')).not.toBeInTheDocument()
		})

		it('announces itself as opening a menu', async () => {
			await renderMenu()

			// ARIA defines aria-haspopup="true" as equivalent to "menu"; the menu primitive sets "true".
			expect(trigger()).toHaveAttribute('aria-haspopup', 'true')
			expect(trigger()).toHaveAttribute('aria-expanded', 'false')
		})

		it('opens the menu to the right of the trigger by default', async () => {
			await renderMenu()

			expect(trigger()).toHaveAttribute('data-placement', 'right-end')
		})

		it('opens the menu where the caller asks', async () => {
			await renderMenu({ placement: 'top' })

			expect(trigger()).toHaveAttribute('data-placement', 'top')
		})
	})

	describe('menu', () => {
		it('repeats the user’s name and email in a header that is not a menu item', async () => {
			const user = userEvent.setup()
			await renderMenu({ collapsed: true })

			const menu = await openMenu(user)

			expect(within(menu).getByText('Ada Lovelace')).toBeInTheDocument()
			expect(within(menu).getByText('ada@example.com')).toBeInTheDocument()
			expect(within(menu).queryByRole('menuitem', { name: /Ada Lovelace/ })).not.toBeInTheDocument()

			await closeMenu(user)
		})

		it('lists every item as a menu item, in order', async () => {
			const user = userEvent.setup()
			await renderMenu()

			const menu = await openMenu(user)

			expect(
				within(menu)
					.getAllByRole('menuitem')
					.map((item) => item.textContent?.trim()),
			).toEqual(['Account', 'Settings', 'Log out'])

			await closeMenu(user)
		})

		it('separates the header from the items and each group from the next', async () => {
			const user = userEvent.setup()
			await renderMenu()

			const menu = await openMenu(user)

			expect(within(menu).getAllByRole('separator')).toHaveLength(2)

			await closeMenu(user)
		})

		it('renders no separator for an empty group', async () => {
			const user = userEvent.setup()
			await renderMenu({ items: [[{ label: 'Account', route: '/account' }], []] })

			const menu = await openMenu(user)

			expect(within(menu).getAllByRole('separator')).toHaveLength(1)

			await closeMenu(user)
		})

		it('accepts a flat list of items as a single group', async () => {
			const user = userEvent.setup()
			await renderMenu({ items: items.flat() })

			const menu = await openMenu(user)

			expect(within(menu).getAllByRole('menuitem')).toHaveLength(3)
			expect(within(menu).getAllByRole('separator')).toHaveLength(1)

			await closeMenu(user)
		})
	})

	describe('link items', () => {
		it('link to their route, so they can be opened in a new tab or copied', async () => {
			const user = userEvent.setup()
			await renderMenu()

			await openMenu(user)

			expect(screen.getByRole('menuitem', { name: 'Account' })).toHaveAttribute('href', '/account')
			expect(screen.getByRole('menuitem', { name: 'Settings' })).toHaveAttribute('href', '/settings')

			await closeMenu(user)
		})

		it('navigate to their route and close the menu', async () => {
			const user = userEvent.setup()
			const { fixture } = await renderMenu()

			await openMenu(user)
			await user.click(screen.getByRole('menuitem', { name: 'Settings' }))
			await fixture.whenStable()
			TestBed.tick()

			expect(TestBed.inject(Router).url).toBe('/settings')
			expect(screen.queryByRole('menu')).not.toBeInTheDocument()
			expect(logOut.calls).toHaveLength(0)
		})

		it('drop their URL and are announced as unavailable when disabled', async () => {
			const user = userEvent.setup()
			await renderMenu({ items: [{ label: 'Billing', route: '/billing', disabled: true }] })

			await openMenu(user)
			const billing = screen.getByRole('menuitem', { name: 'Billing' })

			expect(billing).not.toHaveAttribute('href')
			expect(billing).toHaveAttribute('aria-disabled', 'true')

			await closeMenu(user)
		})
	})

	describe('action items', () => {
		it('are buttons rather than links', async () => {
			const user = userEvent.setup()
			await renderMenu()

			await openMenu(user)
			const logOutItem = screen.getByRole('menuitem', { name: 'Log out' })

			expect(logOutItem).toHaveAttribute('type', 'button')
			expect(logOutItem).not.toHaveAttribute('href')

			await closeMenu(user)
		})

		it('run their action, without navigating, and close the menu', async () => {
			const user = userEvent.setup()
			await renderMenu()

			await openMenu(user)
			await user.click(screen.getByRole('menuitem', { name: 'Log out' }))
			TestBed.tick()

			expect(logOut.calls).toHaveLength(1)
			expect(TestBed.inject(Router).url).toBe('/')
			expect(screen.queryByRole('menu')).not.toBeInTheDocument()
		})

		it('cannot be run when disabled', async () => {
			const user = userEvent.setup()
			await renderMenu({ items: [{ label: 'Log out', onSelect: logOut, disabled: true }] })

			await openMenu(user)
			const logOutItem = screen.getByRole('menuitem', { name: 'Log out' })
			await user.click(logOutItem)

			expect(logOutItem).toBeDisabled()
			expect(logOut.calls).toHaveLength(0)

			await closeMenu(user)
		})

		it('render destructive actions in the destructive color', async () => {
			const user = userEvent.setup()
			await renderMenu({ items: [{ label: 'Delete account', onSelect: fn(), variant: 'destructive' }] })

			await openMenu(user)

			expect(screen.getByRole('menuitem', { name: 'Delete account' })).toHaveClass('text-destructive')

			await closeMenu(user)
		})
	})

	it('closes on Escape and returns focus to the trigger', async () => {
		const user = userEvent.setup()
		await renderMenu()

		await openMenu(user)
		expect(trigger()).toHaveAttribute('aria-expanded', 'true')

		await closeMenu(user)

		expect(screen.queryByRole('menu')).not.toBeInTheDocument()
		expect(trigger()).toHaveFocus()
	})
})
