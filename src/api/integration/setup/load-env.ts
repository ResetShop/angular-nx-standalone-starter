import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Parses a .env file and sets any missing keys on process.env.
 * Silently skips if the file is not found.
 */
export function loadEnvFile(): void {
	try {
		const envPath = resolve(process.cwd(), '.env');
		const envContent = readFileSync(envPath, 'utf-8');
		for (const line of envContent.split('\n')) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) continue;
			const eqIndex = trimmed.indexOf('=');
			if (eqIndex === -1) continue;
			const key = trimmed.slice(0, eqIndex).trim();
			const value = trimmed.slice(eqIndex + 1).trim();
			if (!process.env[key]) {
				process.env[key] = value;
			}
		}
	} catch {
		// .env not found — rely on existing env vars
	}
}
