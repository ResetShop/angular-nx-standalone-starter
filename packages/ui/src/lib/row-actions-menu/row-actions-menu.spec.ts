import { clearAllMocks } from '@resetshop/util/test-utils'
import { render, screen } from '@testing-library/angular'
import { RowActionsMenu } from './row-actions-menu'

describe('RowActionsMenu', () => {
	beforeEach(() => clearAllMocks())

	it('renders nothing when actions is empty', async () => {
		await render(RowActionsMenu, {
			inputs: { actions: [] },
		})

		// Empty-actions guard: the trigger button is not rendered, the menu template never instantiates.
		expect(screen.queryByRole('button')).toBeNull()
	})
})
