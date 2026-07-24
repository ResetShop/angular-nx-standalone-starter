#!/usr/bin/env node
/**
 * Static file server for the built Storybook bundle (`dist/storybook/app`).
 *
 * Storybook's `build-storybook` target emits a fully static site. Railway (and
 * similar platforms) deploy services with a start command rather than offering
 * zero-config static hosting, so the bundle needs a small server bound to the
 * platform-injected `$PORT` on `0.0.0.0`. This uses only Node built-ins —
 * nothing from `node_modules` — so it is immune to production dependency
 * pruning on the deploy image.
 *
 * Usage: `npm run storybook:serve` (after `npm run storybook:build`).
 */

import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { join, resolve } from 'node:path'

import { getContentType, resolveRequestedFilePath } from './lib/serve-storybook.helpers.mjs'

const REPO_ROOT = resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'))
const STORYBOOK_DIR = join(REPO_ROOT, 'dist', 'storybook', 'app')
const PORT = Number(process.env.PORT) || 4400
const HOST = '0.0.0.0'

function sendFile(res, filePath) {
	res.writeHead(200, { 'Content-Type': getContentType(filePath) })
	createReadStream(filePath).pipe(res)
}

const server = createServer((req, res) => {
	const resolved = resolveRequestedFilePath(STORYBOOK_DIR, req.url ?? '/')
	if (resolved && existsSync(resolved) && statSync(resolved).isFile()) {
		sendFile(res, resolved)
		return
	}

	// SPA-style fallback: any in-root path that doesn't resolve to a real file
	// (including a rejected traversal) is served the entry document instead.
	const indexPath = join(STORYBOOK_DIR, 'index.html')
	if (existsSync(indexPath)) {
		sendFile(res, indexPath)
		return
	}

	res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
	res.end('Storybook build not found. Run `npm run storybook:build` first.')
})

server.listen(PORT, HOST, () => {
	console.log(`Serving Storybook from ${STORYBOOK_DIR} at http://${HOST}:${PORT}`)
})
