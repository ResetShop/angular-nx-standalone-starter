/**
 * End-to-end smoke test for the Brillante Worker, run against a live `wrangler dev` (or a deployed
 * Worker). It exercises the behaviours that only show up on the Workers runtime: per-request
 * database clients, deferred post-response work, rate limit bindings and static asset routing.
 *
 * Usage: SMOKE_ADMIN_EMAIL=... SMOKE_ADMIN_PASSWORD=... npm run smoke:brillante:worker
 *
 * Optional: SMOKE_BASE_URL (default http://localhost:8787); SMOKE_SECOND_EMAIL + SMOKE_SECOND_PASSWORD
 * (a login-capable user without admin rights, enables the concurrency-isolation check);
 * SMOKE_DATABASE_URL (enables the check that forgot-password really stored a reset token);
 * SMOKE_CHECK_SCHEDULED=1 (triggers the Cron handler through wrangler's local endpoint).
 */
import pg from 'pg'

const baseUrl = process.env.SMOKE_BASE_URL ?? 'http://localhost:8787'
const adminEmail = process.env.SMOKE_ADMIN_EMAIL
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD
const secondEmail = process.env.SMOKE_SECOND_EMAIL
const secondPassword = process.env.SMOKE_SECOND_PASSWORD
const databaseUrl = process.env.SMOKE_DATABASE_URL

if (!adminEmail || !adminPassword) {
	console.error('SMOKE_ADMIN_EMAIL and SMOKE_ADMIN_PASSWORD are required')
	process.exit(2)
}

let failures = 0

function report(ok, name, detail = '') {
	if (!ok) failures += 1
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`)
}

/** A random documentation-range address, so each simulated client has its own throttle counters. */
const randomClientIp = () => `203.0.113.${Math.floor(Math.random() * 250) + 1}`

/**
 * Minimal cookie jar (name -> value, plus the raw Set-Cookie lines for attribute checks) for one
 * simulated client. Cloudflare's edge sets `cf-connecting-ip`; locally the script supplies it.
 */
function createSession() {
	const clientIp = randomClientIp()
	const cookies = new Map()
	const rawSetCookies = []

	async function call(path, init = {}) {
		const cookieHeader = [...cookies].map(([name, value]) => `${name}=${value}`).join('; ')
		const response = await fetch(`${baseUrl}${path}`, {
			redirect: 'manual',
			...init,
			headers: { 'cf-connecting-ip': clientIp, ...(cookieHeader ? { cookie: cookieHeader } : {}), ...init.headers },
		})
		for (const line of response.headers.getSetCookie()) {
			rawSetCookies.push(line)
			const [pair] = line.split(';')
			const separator = pair.indexOf('=')
			cookies.set(pair.slice(0, separator), pair.slice(separator + 1))
		}
		return response
	}

	return { call, rawSetCookies, cookies }
}

const json = (body, headers = {}) => ({
	method: 'POST',
	headers: { 'content-type': 'application/json', ...headers },
	body: JSON.stringify(body),
})

async function login(session, email, password, headers) {
	return session.call('/api/auth/login', json({ email, password }, headers))
}

async function checkStaticAssets() {
	const home = await fetch(`${baseUrl}/`)
	report(home.status === 200 && (await home.text()).includes('<app-root'), 'SPA index is served as a static asset')
	const deepLink = await fetch(`${baseUrl}/dashboard/some/deep/link`)
	report(deepLink.status === 200, 'unknown non-API path falls back to the SPA', `status ${deepLink.status}`)
	// The auth guard runs before routing, so a path the API does not define answers 401 without a
	// token. What matters is that /api/* is answered by the Worker and never by the SPA fallback.
	const unknownApi = await fetch(`${baseUrl}/api/does-not-exist`)
	const contentType = unknownApi.headers.get('content-type') ?? ''
	report(
		unknownApi.status === 401 && !contentType.includes('text/html'),
		'/api/* is answered by the Worker, not the SPA fallback',
		`status ${unknownApi.status}`,
	)
}

async function checkAuthFlow(admin) {
	const health = await fetch(`${baseUrl}/api/health/v1`)
	report(health.status === 200, 'health check reaches the database through the binding')

	const wrong = await login(createSession(), adminEmail, 'definitely-not-the-password-1')
	report(wrong.status === 401, 'wrong password is rejected', `status ${wrong.status}`)

	const ok = await login(admin, adminEmail, adminPassword)
	report(ok.status === 200, 'admin login succeeds', `status ${ok.status}`)
	const flags = admin.rawSetCookies.map((line) => line.toLowerCase())
	report(
		['access_token', 'refresh_token'].every((name) =>
			flags.some((l) => l.startsWith(`${name}=`) && l.includes('httponly')),
		),
		'access and refresh tokens are HttpOnly cookies',
	)

	const me = await admin.call('/api/auth/me')
	report(me.status === 200 && (await me.json()).email === adminEmail, '/me returns the logged-in user')

	const users = await admin.call('/api/users?limit=5')
	report(users.status === 200, 'admin can list users', `status ${users.status}`)
	const anonymous = await fetch(`${baseUrl}/api/users`)
	report(anonymous.status === 401, 'protected route without a cookie is 401', `status ${anonymous.status}`)

	const refresh = await admin.call('/api/auth/refresh', { method: 'POST' })
	const meAfterRefresh = await admin.call('/api/auth/me')
	report(
		refresh.status === 200 && meAfterRefresh.status === 200,
		'refresh rotates the session',
		`status ${refresh.status}`,
	)
}

/** Returns the database clock, so a later query can find rows created after this moment. */
async function queryDatabase(sql, parameters = []) {
	const client = new pg.Client({ connectionString: databaseUrl })
	await client.connect()
	try {
		return (await client.query(sql, parameters)).rows
	} finally {
		await client.end()
	}
}

async function checkDeferredWork() {
	if (!databaseUrl) {
		console.log('SKIP  deferred work check (set SMOKE_DATABASE_URL)')
	}
	const [{ now: startedAt }] = databaseUrl ? await queryDatabase('select now() as now') : [{}]
	const response = await fetch(`${baseUrl}/api/auth/forgot-password`, json({ email: adminEmail }))
	report(response.status === 200, 'forgot-password answers the neutral 200', `status ${response.status}`)
	if (!databaseUrl) return

	// The token is written after the response was sent, so give the deferred work time to finish.
	await new Promise((resolve) => setTimeout(resolve, 1500))
	const [{ n }] = await queryDatabase('select count(*)::int as n from password_reset_token where created_at >= $1', [
		startedAt,
	])
	report(n === 1, 'forgot-password work after the response stored a reset token', `${n} token(s) created`)
}

async function checkConcurrencyIsolation(admin) {
	if (!secondEmail || !secondPassword) {
		console.log('SKIP  concurrency isolation check (set SMOKE_SECOND_EMAIL and SMOKE_SECOND_PASSWORD)')
		return
	}
	const second = createSession()
	await login(second, secondEmail, secondPassword)
	const requests = Array.from({ length: 40 }, (_, index) => {
		const [session, expected] = index % 2 === 0 ? [admin, adminEmail] : [second, secondEmail]
		return session.call('/api/auth/me').then(async (response) => ({ expected, got: (await response.json()).email }))
	})
	const results = await Promise.all(requests)
	const mismatches = results.filter((result) => result.expected !== result.got)
	const firstMismatch = mismatches[0] ? `, first: expected ${mismatches[0].expected}, got ${mismatches[0].got}` : ''
	report(
		mismatches.length === 0,
		'40 parallel requests from two users never see each other',
		`${mismatches.length} mismatches${firstMismatch}`,
	)
}

async function checkRateLimit() {
	const ip = randomClientIp()
	const statuses = []
	let retryAfter = null
	for (let attempt = 0; attempt < 8; attempt += 1) {
		const response = await fetch(
			`${baseUrl}/api/auth/login`,
			json({ email: 'nobody@smoke.test', password: 'wrong-password-123' }, { 'cf-connecting-ip': ip }),
		)
		statuses.push(response.status)
		retryAfter ??= response.headers.get('retry-after')
	}
	report(
		statuses.slice(0, 5).every((s) => s === 401),
		'first 5 attempts per IP reach the handler',
		statuses.join(' '),
	)
	report(
		statuses.slice(5).every((s) => s === 429),
		'attempts beyond the limit are throttled with 429',
		statuses.join(' '),
	)
	report(retryAfter === '60', 'throttled response carries Retry-After matching the window', `Retry-After ${retryAfter}`)
}

async function checkScheduled() {
	if (process.env.SMOKE_CHECK_SCHEDULED !== '1') {
		console.log('SKIP  scheduled handler check (set SMOKE_CHECK_SCHEDULED=1, local wrangler dev only)')
		return
	}
	const response = await fetch(
		`${baseUrl}/cdn-cgi/local/explorer/api/local/scheduled?worker=brillante`,
		json({ cron: '17 3 * * *' }),
	)
	const body = await response.json().catch(() => ({}))
	report(
		response.status === 200 && body.success === true,
		'Cron handler runs the token cleanup',
		`status ${response.status}`,
	)
}

const admin = createSession()
await checkStaticAssets()
await checkAuthFlow(admin)
await checkDeferredWork()
await checkConcurrencyIsolation(admin)
await checkRateLimit()
await checkScheduled()

console.log(failures === 0 ? '\nAll smoke checks passed' : `\n${failures} smoke check(s) FAILED`)
process.exit(failures === 0 ? 0 : 1)
