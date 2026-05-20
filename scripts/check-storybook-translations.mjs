#!/usr/bin/env node
/**
 * Automated check that confirms every Storybook story renders without translation errors.
 *
 * Why this exists: `Translation` is `@Injectable({ providedIn: 'root' })` and its
 * `TRANSLATION_LOADER` default factory throws. If a story bundle doesn't have a
 * working mock wired in, the component silently fails to render — no compile error,
 * no test failure, just a blank canvas. This script catches that regression by
 * loading each story's iframe in a real browser and asserting the page console is
 * free of the throwing message.
 *
 * Usage:
 *   npm run storybook:build         # produce dist/storybook/app
 *   node scripts/check-storybook-translations.mjs
 */
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '..')
const storybookDir = join(repoRoot, 'dist/storybook/app')

if (!existsSync(storybookDir)) {
	console.error(`Storybook build not found at ${storybookDir}. Run "npm run storybook:build" first.`)
	process.exit(1)
}

const indexPath = join(storybookDir, 'index.json')
if (!existsSync(indexPath)) {
	console.error(`Storybook index.json not found at ${indexPath}. Did the build complete?`)
	process.exit(1)
}
const index = JSON.parse(readFileSync(indexPath, 'utf-8'))
const allEntries = Object.values(index.entries ?? {}).filter((e) => e.type === 'story')

// Stories whose components touch Translation. Keep this list aligned with the
// `provideTranslation` import grep across `*.stories.ts`.
const TRANSLATION_STORY_TITLES = new Set([
	'Components/DataTable',
	'Components/Pagination',
	'Components/Select',
	'Components/Combobox',
	'Components/FormField',
	'Pages/Auth/Login',
	'Pages/Auth/Reset Password',
	'Pages/Dashboard/Roles/RoleCard',
	'Pages/Dashboard/Users/UserCard',
])
const stories = allEntries.filter((e) => TRANSLATION_STORY_TITLES.has(e.title))

if (stories.length === 0) {
	console.error('No translation-using stories found in the built index. Aborting.')
	process.exit(1)
}

console.log(`Checking ${stories.length} translation-using stories…`)

const MIME = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'application/javascript; charset=utf-8',
	'.mjs': 'application/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.map': 'application/json; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
}

const server = createServer((req, res) => {
	const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0])
	let filePath = join(storybookDir, urlPath === '/' ? '/index.html' : urlPath)
	if (existsSync(filePath) && statSync(filePath).isDirectory()) {
		filePath = join(filePath, 'index.html')
	}
	if (!existsSync(filePath)) {
		res.statusCode = 404
		res.end('Not found')
		return
	}
	const ext = filePath.slice(filePath.lastIndexOf('.'))
	res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream')
	createReadStream(filePath).pipe(res)
})

await new Promise((r) => server.listen(0, '127.0.0.1', r))
const port = server.address().port
const baseUrl = `http://127.0.0.1:${port}`
console.log(`Serving ${storybookDir} on ${baseUrl}`)

const { chromium } = await import('@playwright/test')
const browser = await chromium.launch()
const context = await browser.newContext()

const failures = []
const errorPatterns = [
	/TRANSLATION_LOADER/i,
	/Failed to load.*translations/i,
	/Translations for language.*are not loaded/i,
]

for (const story of stories) {
	const page = await context.newPage()
	const consoleErrors = []
	page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`))
	page.on('console', (msg) => {
		if (msg.type() === 'error') consoleErrors.push(`console.error: ${msg.text()}`)
	})

	const url = `${baseUrl}/iframe.html?id=${encodeURIComponent(story.id)}&viewMode=story`
	try {
		await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 })
		await page.waitForTimeout(500) // let async effects settle
	} catch (err) {
		failures.push({ id: story.id, reason: `navigation failed: ${err.message}` })
		await page.close()
		continue
	}

	const translationErrors = consoleErrors.filter((msg) => errorPatterns.some((re) => re.test(msg)))
	if (translationErrors.length > 0) {
		failures.push({ id: story.id, reason: translationErrors.join(' | ') })
	} else {
		console.log(`  ✓ ${story.id}`)
	}
	await page.close()
}

await browser.close()
server.close()

if (failures.length > 0) {
	console.error(`\n✗ ${failures.length} story/stories have translation errors:`)
	for (const f of failures) console.error(`  - ${f.id}: ${f.reason}`)
	process.exit(1)
}

console.log(`\n✓ All ${stories.length} translation-using stories rendered without translation errors.`)
