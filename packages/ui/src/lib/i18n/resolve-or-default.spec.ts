import { clearAllMocks } from '@resetshop/util/test-utils'
import { resolveOrDefault } from './resolve-or-default'

describe('resolveOrDefault', () => {
	beforeEach(() => {
		clearAllMocks()
	})

	it('returns the fallback when resolved equals the key (translation not loaded)', () => {
		expect(resolveOrDefault('SOME.KEY', 'SOME.KEY', 'Default text')).toBe('Default text')
	})

	it('returns the resolved value when it differs from the key (translation loaded)', () => {
		expect(resolveOrDefault('Translated text', 'SOME.KEY', 'Default text')).toBe('Translated text')
	})

	it('returns the resolved value when it is an empty string (valid translation result)', () => {
		expect(resolveOrDefault('', 'SOME.KEY', 'Default text')).toBe('')
	})

	it('returns the fallback for a dot-notation key when the translation is not loaded', () => {
		expect(resolveOrDefault('VALIDATION.REQUIRED', 'VALIDATION.REQUIRED', 'This field is required')).toBe(
			'This field is required',
		)
	})
})
