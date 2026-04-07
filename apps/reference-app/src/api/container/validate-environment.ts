import { EMAIL_PROVIDERS, isEmailProvider } from '../services/email/interfaces'

/**
 * Validates required environment variables at container setup time.
 * Fails fast if critical configuration is missing or invalid.
 */
export function validateEnvironment(): void {
	const pasetoKey = process.env['PASETO_SECRET_KEY']
	if (!pasetoKey) {
		throw new Error('PASETO_SECRET_KEY environment variable is required')
	}
	if (!/^[0-9a-fA-F]{64,}$/.test(pasetoKey)) {
		throw new Error(
			'PASETO_SECRET_KEY must be at least 32 bytes (64 hex characters). ' + 'Generate with: openssl rand -hex 32',
		)
	}

	const pasetoIssuer = process.env['PASETO_ISSUER']
	if (!pasetoIssuer) {
		throw new Error('PASETO_ISSUER environment variable is required')
	}

	const emailProvider = process.env['EMAIL_PROVIDER']
	if (emailProvider && !isEmailProvider(emailProvider)) {
		throw new Error(
			`Invalid EMAIL_PROVIDER: "${emailProvider}". Valid values: ${Object.values(EMAIL_PROVIDERS).join(', ')}`,
		)
	}
}
