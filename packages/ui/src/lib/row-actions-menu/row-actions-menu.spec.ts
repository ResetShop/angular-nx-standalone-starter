import { clearAllMocks } from '@resetshop/util/test-utils'
import { render, screen } from '@testing-library/angular'
import { RowActionsMenu } from './row-actions-menu'

describe('RowActionsMenu', () => {
	beforeEach(() => clearAllMocks())

	it('renders without throwing', async () => {
		await render(`<app-row-actions-menu></app-row-actions-menu>`, {
			imports: [RowActionsMenu],
		})

		// Scaffold renders no visible content yet — full assertions added in subsequent commits.
		expect(screen.queryByRole('button')).toBeNull()
	})
})
