import { clearAllMocks, type MockFn, spyOn } from '@resetshop/util/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { generatePassword } from './password'

describe('generatePassword', () => {
	const originalAppLanguage = process.env['APP_LANGUAGE']
	let consoleWarnSpy: MockFn

	beforeEach(() => {
		clearAllMocks()
		delete process.env['APP_LANGUAGE']
		consoleWarnSpy = spyOn(console, 'warn')
	})

	afterEach(() => {
		if (originalAppLanguage !== undefined) {
			process.env['APP_LANGUAGE'] = originalAppLanguage
		} else {
			delete process.env['APP_LANGUAGE']
		}
	})

	describe('format', () => {
		it('should return three words separated by dots', async () => {
			const password = await generatePassword()
			const parts = password.split('.')

			expect(parts).toHaveLength(3)
		})

		it('should contain only lowercase letters and dots', async () => {
			const password = await generatePassword()

			expect(password).toMatch(/^[\p{Ll}]+\.[\p{Ll}]+\.[\p{Ll}]+$/u)
		})

		it('should produce non-empty words', async () => {
			const password = await generatePassword()
			const parts = password.split('.')

			for (const word of parts) {
				expect(word.length).toBeGreaterThan(0)
			}
		})
	})

	describe('wordCount validation', () => {
		it('should fall back to default for zero and log error', async () => {
			const password = await generatePassword(0)

			expect(password.split('.')).toHaveLength(3)
			expect(consoleWarnSpy.calls).toHaveLength(1)
			expect(consoleWarnSpy.calls[0][0]).toContain('[generatePassword]')
		})

		it('should fall back to default for negative values and log error', async () => {
			const password = await generatePassword(-1)

			expect(password.split('.')).toHaveLength(3)
			expect(consoleWarnSpy.calls).toHaveLength(1)
		})

		it('should fall back to default for non-integer values and log error', async () => {
			const password = await generatePassword(2.5)

			expect(password.split('.')).toHaveLength(3)
			expect(consoleWarnSpy.calls).toHaveLength(1)
		})

		it('should accept a custom word count', async () => {
			const password = await generatePassword(5)
			const parts = password.split('.')

			expect(parts).toHaveLength(5)
		})
	})

	describe('language selection', () => {
		it('should produce only ASCII words for English', async () => {
			const passwords = await Promise.all(Array.from({ length: 20 }, () => generatePassword()))
			const words = passwords.flatMap((p) => p.split('.'))

			for (const word of words) {
				expect(word).toMatch(/^[a-z]+$/)
			}
		})

		it('should produce Spanish words when APP_LANGUAGE is es', async () => {
			process.env['APP_LANGUAGE'] = 'es'

			const passwords = await Promise.all(Array.from({ length: 20 }, () => generatePassword()))
			const words = passwords.flatMap((p) => p.split('.'))
			const hasAccentedWord = words.some((word) => /[^a-z]/.test(word))

			expect(hasAccentedWord).toBe(true)
		})

		it('should throw when word list file does not exist for language', async () => {
			process.env['APP_LANGUAGE'] = 'xx'

			await expect(generatePassword()).rejects.toThrow()
		})
	})
})
