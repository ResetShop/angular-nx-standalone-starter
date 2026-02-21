import { randomInt } from 'crypto';
import { access, readFile } from 'fs/promises';
import { resolve } from 'path';
import { z } from 'zod';

const wordListCache = new Map<string, readonly string[]>();

async function resolveWordListPath(filename: string): Promise<string> {
	/**
	 * Candidate directories for wordlist files, checked in order.
	 * - Production: copied to dist/app/server/wordlists/ via copy-server-assets Nx target
	 * - Development: source tree location
	 */
	const candidateDirs = [resolve(import.meta.dirname, 'wordlists'), resolve(process.cwd(), 'src/api/utils/wordlists')];

	for (const dir of candidateDirs) {
		const candidate = resolve(dir, filename);
		try {
			await access(candidate);
			return candidate;
		} catch (error: unknown) {
			// TODO(#66): Replace with structured logging service
			const message = error instanceof Error ? error.message : String(error);
			console.error(`Wordlist not found at ${candidate}:`, message);
		}
	}
	throw new Error(`Word list file not found: ${filename}`);
}

// TODO (#159): Validate language against an allowlist to prevent path traversal
async function getWordList(language: string): Promise<readonly string[]> {
	const cached = wordListCache.get(language);
	if (cached) {
		return cached;
	}

	const filePath = await resolveWordListPath(`${language}-password-seed.txt`);
	const content = await readFile(filePath, 'utf-8');
	const lines = content.split('\n');
	const words = Object.freeze(
		lines
			.slice(1)
			.map((word) => word.trim())
			.filter(Boolean),
	);

	if (words.length === 0) {
		throw new Error(`Word list is empty for language: ${language}`);
	}

	wordListCache.set(language, words);

	return words;
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
	const wordCountSchema = z.number().int().positive();
	wordCountSchema.parse(wordCount);

	const language = process.env['APP_LANGUAGE'] || 'en';
	const words = await getWordList(language);

	return Array.from({ length: wordCount }, () => words[randomInt(words.length)]).join('.');
}
