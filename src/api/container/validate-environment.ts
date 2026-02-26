/**
 * Validates required environment variables at container setup time.
 * Fails fast if critical configuration is missing or invalid.
 */
export function validateEnvironment(): void {
	const pasetoKey = process.env['PASETO_SECRET_KEY'];
	if (!pasetoKey) {
		throw new Error('PASETO_SECRET_KEY environment variable is required');
	}
	if (!/^[0-9a-fA-F]{64,}$/.test(pasetoKey)) {
		throw new Error(
			'PASETO_SECRET_KEY must be at least 32 bytes (64 hex characters). ' + 'Generate with: openssl rand -hex 32',
		);
	}

	const emailProvider = process.env['EMAIL_PROVIDER'];
	const validEmailProviders = ['nodemailer', 'ethereal'];
	if (emailProvider && !validEmailProviders.includes(emailProvider)) {
		throw new Error(`Invalid EMAIL_PROVIDER: "${emailProvider}". Valid values: ${validEmailProviders.join(', ')}`);
	}
}
