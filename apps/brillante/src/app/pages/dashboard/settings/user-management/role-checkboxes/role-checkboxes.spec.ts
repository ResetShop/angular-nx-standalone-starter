import { signal } from '@angular/core'
import { UserRole } from '@contracts/permission/permission.constants'
import { provideSliceTranslationMock } from '@mocks/slice-translation.mock'
import { createMockUser } from '@mocks/user.mock'
import { settingsEn } from '@providers/i18n/translations/slices/settings.translations'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { AuthStore } from '@store/auth/auth.store'
import { render, screen } from '@testing-library/angular'
import userEvent from '@testing-library/user-event'
import { USER_ROLE_OPTIONS } from '../user-role-options'
import { RoleCheckboxes } from './role-checkboxes'

describe('RoleCheckboxes', () => {
	beforeEach(() => clearAllMocks())

	async function renderComponent(value: number[] = [], roleIds: number[] = [UserRole.ADMIN]) {
		const currentUser = signal(createMockUser({ hasRole: (id: number) => roleIds.includes(id) }))
		return render(RoleCheckboxes, {
			inputs: { value },
			providers: [provideSliceTranslationMock(settingsEn), { provide: AuthStore, useValue: { currentUser } }],
		})
	}

	it('should offer one translated checkbox per assignable role', async () => {
		await renderComponent()

		expect(screen.getAllByRole('checkbox')).toHaveLength(USER_ROLE_OPTIONS.length)
		expect(screen.getByRole('checkbox', { name: 'Administrator' })).toBeInTheDocument()
		expect(screen.getByRole('checkbox', { name: 'Counter clerk' })).toBeInTheDocument()
		expect(screen.getByRole('checkbox', { name: 'Accountant' })).toBeInTheDocument()
	})

	it('should not offer the administrator and owner roles to a counter clerk', async () => {
		await renderComponent([], [UserRole.COUNTER_CLERK])

		expect(screen.queryByRole('checkbox', { name: 'Administrator' })).not.toBeInTheDocument()
		expect(screen.queryByRole('checkbox', { name: 'Owner' })).not.toBeInTheDocument()
		expect(screen.getByRole('checkbox', { name: 'Employee' })).toBeInTheDocument()
	})

	it('should keep showing a privileged role the edited user already holds', async () => {
		await renderComponent([UserRole.OWNER], [UserRole.COUNTER_CLERK])

		expect(screen.getByRole('checkbox', { name: 'Owner' })).toBeChecked()
	})

	it('should offer the owner role to an owner', async () => {
		await renderComponent([], [UserRole.OWNER])

		expect(screen.getByRole('checkbox', { name: 'Administrator' })).toBeInTheDocument()
	})

	it('should check the roles in the current value', async () => {
		await renderComponent([2, 6])

		expect(screen.getByRole('checkbox', { name: 'Owner' })).toBeChecked()
		expect(screen.getByRole('checkbox', { name: 'Employee' })).toBeChecked()
		expect(screen.getByRole('checkbox', { name: 'Administrator' })).not.toBeChecked()
	})

	it('should add a role to the value when its checkbox is checked', async () => {
		const user = userEvent.setup()
		const { fixture } = await renderComponent([2])

		await user.click(screen.getByRole('checkbox', { name: 'Employee' }))

		expect(fixture.componentInstance.value()).toEqual([2, 6])
		expect(screen.getByRole('checkbox', { name: 'Employee' })).toBeChecked()
	})

	it('should remove a role from the value when its checkbox is unchecked', async () => {
		const user = userEvent.setup()
		const { fixture } = await renderComponent([2, 6])

		await user.click(screen.getByRole('checkbox', { name: 'Owner' }))

		expect(fixture.componentInstance.value()).toEqual([6])
		expect(screen.getByRole('checkbox', { name: 'Owner' })).not.toBeChecked()
	})
})
