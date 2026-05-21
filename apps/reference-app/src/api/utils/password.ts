import { logger } from '@resetshop/util'
import { randomInt } from 'crypto'
import { z } from 'zod'
import enWordlistRaw from './wordlists/en-password-seed.txt?raw'
import esWordlistRaw from './wordlists/es-password-seed.txt?raw'

const wordCountSchema = z.number().int().positive()

/**
 * Parses a diceware wordlist file. The first line is a header count;
 * subsequent lines are one word per line. Returns a frozen array.
 */
function parseWordlist(content: string): readonly string[] {
	return Object.freeze(
		content
			.split('\n')
			.slice(1)
			.map((word) => word.trim())
			.filter(Boolean),
	)
}

const WORDLISTS: Readonly<Record<string, readonly string[]>> = Object.freeze({
	en: parseWordlist(enWordlistRaw),
	es: parseWordlist(esWordlistRaw),
})

function getWordList(language: string): readonly string[] {
	// Allowlist check via Object.hasOwn — guards against inherited members (e.g. `language`
	// set to '__proto__' or 'constructor') returning truthy non-array values that would
	// pass a plain `if (!words)` check and crash later in randomInt(words.length).
	if (!Object.hasOwn(WORDLISTS, language)) {
		throw new Error(`Word list not found for language: ${language}`)
	}
	const words = WORDLISTS[language]
	if (words.length === 0) {
		throw new Error(`Word list is empty for language: ${language}`)
	}
	return words
}

/**
 * Generate a cryptographically secure passphrase in the format: word.word.word
 *
 * Reads APP_LANGUAGE env var to select the word list (defaults to 'en').
 * Uses crypto.randomInt for uniform random word selection from a diceware word list.
 * With the default 7,776-word lists, 3 words provide ~38.8 bits of entropy —
 * suitable for temporary passwords that must be changed on first login.
 *
 * @returns Dot-separated passphrase (e.g., "indigo.rabbit.troop")
 */
export async function generatePassword(wordCount = 3): Promise<string> {
	const parsed = wordCountSchema.safeParse(wordCount)
	if (!parsed.success) {
		logger.warn('generatePassword', `Invalid wordCount (${wordCount}), using default: ${parsed.error.message}`)
	}
	const effectiveWordCount = parsed.success ? wordCount : 3

	const language = process.env['APP_LANGUAGE'] || 'en'
	const words = getWordList(language)

	return Array.from({ length: effectiveWordCount }, () => words[randomInt(words.length)]).join('.')
}
