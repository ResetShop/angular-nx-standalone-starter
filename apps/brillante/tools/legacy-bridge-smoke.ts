/**
 * Checks that the real legacy API accepts a token from `signLegacyToken`. Run it once the real secret is available:
 *
 *   LEGACY_JWT_SECRET=<the legacy SECRET> npm run smoke:brillante:legacy-bridge
 *
 * It signs a token for user id 1 and calls the protected `GET /users` of the legacy API, printing only the status
 * codes (the response holds personal data and is never printed). A token under a wrong secret must be refused, so a
 * 401 for it is expected and a 200 for it means the legacy API is not checking tokens at all.
 */
import { signLegacyToken } from '../src/api/modules/auth/legacy-token'

const secret = process.env['LEGACY_JWT_SECRET']
if (!secret) {
	console.error('LEGACY_JWT_SECRET is not set: nothing to check.')
	process.exit(1)
}

const base = process.env['LEGACY_API_URL'] ?? 'https://brillante-production.herokuapp.com'

async function statusFor(token: string): Promise<number> {
	const response = await fetch(`${base}/users`, { headers: { Authorization: `Bearer ${token}` } })
	return response.status
}

const accepted = await statusFor(signLegacyToken(1, secret, '5m').token)
const refused = await statusFor(signLegacyToken(1, `${secret}-wrong`, '5m').token)
console.log(`Token under the real secret: ${accepted} (expected 200)`)
console.log(`Token under a wrong secret: ${refused} (expected 401)`)
process.exit(accepted === 200 && refused === 401 ? 0 : 1)
