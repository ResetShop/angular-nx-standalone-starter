import { Component } from '@angular/core'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { render, screen } from '@testing-library/angular'
import { TranslatePipe } from './translate.pipe'
import { provideTranslationMock } from './translation.mock'

@Component({
	standalone: true,
	imports: [TranslatePipe],
	template: `
		<span data-testid="translated">{{ 'AUTH.ERRORS.GENERIC' | translate }}</span>
	`,
})
class TestHostComponent {}

describe('TranslatePipe', () => {
	beforeEach(() => {
		clearAllMocks()
	})

	it('should render the translated value for a known key', async () => {
		await render(TestHostComponent, {
			providers: [provideTranslationMock()],
		})

		expect(screen.getByTestId('translated').textContent?.trim()).toBe('AUTH.ERRORS.GENERIC')
	})
})
