import { clearAllMocks } from '@resetshop/util/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { seedHttpEnv } from '../config/http.env'
import { appOrigin, buildAppUrl } from './app-url'

describe('app url helpers', () => {
	beforeEach(() => {
		clearAllMocks()
	})

	it('uses the first configured origin, trimmed and without a trailing slash', () => {
		seedHttpEnv({ CORS_ORIGIN: ' https://app.test/ , https://other.test' })

		expect(appOrigin()).toBe('https://app.test')
	})

	it('builds the link to a page of the app', () => {
		seedHttpEnv({ CORS_ORIGIN: 'https://app.test' })

		expect(buildAppUrl('/auth/login')).toBe('https://app.test/auth/login')
	})
})
