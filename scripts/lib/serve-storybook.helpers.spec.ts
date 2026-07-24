import { join, resolve } from 'node:path'

import { getContentType, resolveRequestedFilePath } from './serve-storybook.helpers.mjs'

describe('getContentType', () => {
	it('maps known extensions to their MIME type', () => {
		expect(getContentType('index.html')).toBe('text/html; charset=utf-8')
		expect(getContentType('main.js')).toBe('text/javascript; charset=utf-8')
		expect(getContentType('styles.css')).toBe('text/css; charset=utf-8')
		expect(getContentType('data.json')).toBe('application/json; charset=utf-8')
		expect(getContentType('icon.svg')).toBe('image/svg+xml')
		expect(getContentType('font.woff2')).toBe('font/woff2')
	})

	it('is case-insensitive on the extension', () => {
		expect(getContentType('LOGO.PNG')).toBe('image/png')
	})

	it('falls back to application/octet-stream for unknown or missing extensions', () => {
		expect(getContentType('archive.xyz')).toBe('application/octet-stream')
		expect(getContentType('LICENSE')).toBe('application/octet-stream')
	})
})

describe('resolveRequestedFilePath', () => {
	const root = resolve('/srv/storybook')

	it('resolves a directory-root request to index.html', () => {
		expect(resolveRequestedFilePath(root, '/')).toBe(join(root, 'index.html'))
		expect(resolveRequestedFilePath(root, '')).toBe(join(root, 'index.html'))
	})

	it('resolves a normal in-root nested path', () => {
		expect(resolveRequestedFilePath(root, '/assets/main.js')).toBe(join(root, 'assets', 'main.js'))
	})

	it('strips a query string before resolving (Storybook deep-link params)', () => {
		expect(resolveRequestedFilePath(root, '/iframe.html?id=button--primary')).toBe(join(root, 'iframe.html'))
		expect(resolveRequestedFilePath(root, '/?path=/story/button--primary')).toBe(join(root, 'index.html'))
	})

	it('decodes percent-encoded paths', () => {
		expect(resolveRequestedFilePath(root, '/assets/my%20file.png')).toBe(join(root, 'assets', 'my file.png'))
	})

	it('rejects path-traversal attempts by returning null', () => {
		expect(resolveRequestedFilePath(root, '/../secret')).toBeNull()
		expect(resolveRequestedFilePath(root, '/../../etc/passwd')).toBeNull()
		expect(resolveRequestedFilePath(root, '/assets/../../secret')).toBeNull()
	})

	it('rejects encoded traversal and malformed encoding', () => {
		expect(resolveRequestedFilePath(root, '/..%2f..%2fetc%2fpasswd')).toBeNull()
		expect(resolveRequestedFilePath(root, '/%ZZ')).toBeNull()
	})

	it('allows a traversal that stays within root after normalization', () => {
		expect(resolveRequestedFilePath(root, '/assets/../index.html')).toBe(join(root, 'index.html'))
	})
})
