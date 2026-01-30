import { randomBytes } from 'crypto';

const DEFAULT_PASSWORD_LENGTH = 16;

/**
 * Generate a cryptographically secure random password
 * Uses Node.js crypto.randomBytes for secure generation
 * Encodes as base64url (A-Z, a-z, 0-9, -, _) for broad compatibility
 *
 * @param length Password length (default: 16 characters, ~96 bits of entropy)
 * @returns Random password string containing only base64url characters
 */
export function generatePassword(length: number = DEFAULT_PASSWORD_LENGTH): string {
	const byteLength = Math.ceil((length * 3) / 4);
	const buffer = randomBytes(byteLength);

	return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '').slice(0, length);
}
