import { logger } from '@utils/logger'
import { randomInt } from 'crypto'
import { z } from 'zod'
import { EN_PASSWORD_WORDS } from './wordlists/en'
import { ES_PASSWORD_WORDS } from './wordlists/es'

/**
 * Generate a cryptographically secure passphrase in the format: word.word.word
 *
 * Reads APP_LANGUAGE env var to select the word list (defaults to 'en').
 * Uses crypto.randomInt for uniform random word selection from a diceware word list.
 * With the default 7,776-word lists, 3 words provide ~38.8 bits of entropy —
 * suitable for temporary passwords that must be changed on first login.
 *
 * Word lists are embedded as TypeScript constants — no filesystem access at runtime.
 *
 * @returns Dot-separated passphrase (e.g., "indigo.rabbit.troop")
 */
export function generatePassword(wordCount = 3): string {
	const wordCountSchema = z.number().int().positive()
	const parsed = wordCountSchema.safeParse(wordCount)
	if (!parsed.success) {
		logger.warn('generatePassword', `Invalid wordCount (${wordCount}), using default: ${parsed.error.message}`)
	}
	const effectiveWordCount = parsed.success ? wordCount : 3

	const wordLists: Record<string, readonly string[]> = {
		en: EN_PASSWORD_WORDS,
		es: ES_PASSWORD_WORDS,
	}

	const language = process.env['APP_LANGUAGE'] || 'en'
	const words = wordLists[language]
	if (!words) {
		throw new Error(`No word list available for language: ${language}. Supported: ${Object.keys(wordLists).join(', ')}`)
	}

	return Array.from({ length: effectiveWordCount }, () => words[randomInt(words.length)]).join('.')
}
