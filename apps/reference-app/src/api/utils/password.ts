import { logger } from '@resetshop/util'
import { randomInt } from 'crypto'
import { readFile } from 'fs/promises'
import { resolve } from 'path'
import { z } from 'zod'

const wordListCache = new Map<string, readonly string[]>()
const wordCountSchema = z.number().int().positive()

async function readWordListFile(filename: string): Promise<string> {
	/**
	 * Candidate directories for wordlist files, checked in order.
	 * - Production: copied to dist/reference-app/server/wordlists/ via copy-server-assets Nx target
	 * - Development: source tree location
	 */
	const candidateDirs = [resolve(import.meta.dirname, 'wordlists'), resolve(process.cwd(), 'src/api/utils/wordlists')]
	const triedPaths: string[] = []

	for (const dir of candidateDirs) {
		const candidate = resolve(dir, filename)
		try {
			return await readFile(candidate, 'utf-8')
		} catch (error: unknown) {
			if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
				triedPaths.push(candidate)
			} else {
				throw error
			}
		}
	}
	throw new Error(`Word list file not found: ${filename} (tried: ${triedPaths.join(', ')})`)
}

// TODO (#159): Validate language against an allowlist to prevent path traversal
async function getWordList(language: string): Promise<readonly string[]> {
	const cached = wordListCache.get(language)
	if (cached) {
		return cached
	}

	const content = await readWordListFile(`${language}-password-seed.txt`)
	const lines = content.split('\n')
	const words = Object.freeze(
		lines
			.slice(1)
			.map((word) => word.trim())
			.filter(Boolean),
	)

	if (words.length === 0) {
		throw new Error(`Word list is empty for language: ${language}`)
	}

	wordListCache.set(language, words)

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
	const words = await getWordList(language)

	return Array.from({ length: effectiveWordCount }, () => words[randomInt(words.length)]).join('.')
}
