import { buildMirrorRemoteUrls, parseForkInitArgs, UPSTREAM_REPO_URL } from './fork-init.helpers.mjs'

describe('parseForkInitArgs', () => {
	it('parses --repo=<org>/<name> into org and name', () => {
		expect(parseForkInitArgs(['--repo=my-org/my-app'])).toEqual({
			org: 'my-org',
			name: 'my-app',
			appName: undefined,
		})
	})

	it('parses the space-separated --repo <org>/<name> form', () => {
		expect(parseForkInitArgs(['--repo', 'my-org/my-app'])).toEqual({
			org: 'my-org',
			name: 'my-app',
			appName: undefined,
		})
	})

	it('parses the optional --app-name value', () => {
		expect(parseForkInitArgs(['--repo=my-org/my-app', '--app-name=My App'])).toEqual({
			org: 'my-org',
			name: 'my-app',
			appName: 'My App',
		})
	})

	it('accepts dots, hyphens, and underscores in org and name', () => {
		expect(parseForkInitArgs(['--repo=Reset.Shop_1/client-app.v2'])).toEqual({
			org: 'Reset.Shop_1',
			name: 'client-app.v2',
			appName: undefined,
		})
	})

	it('throws when --repo is missing', () => {
		expect(() => parseForkInitArgs([])).toThrow('Missing required --repo=<org>/<name> argument')
	})

	it('throws when --repo has no value', () => {
		expect(() => parseForkInitArgs(['--repo'])).toThrow('Missing required --repo=<org>/<name> argument')
	})

	it('throws when --repo has no slash', () => {
		expect(() => parseForkInitArgs(['--repo=just-a-name'])).toThrow('Malformed --repo value "just-a-name"')
	})

	it('throws when the org segment is empty', () => {
		expect(() => parseForkInitArgs(['--repo=/my-app'])).toThrow('Malformed --repo value "/my-app"')
	})

	it('throws when the name segment is empty', () => {
		expect(() => parseForkInitArgs(['--repo=my-org/'])).toThrow('Malformed --repo value "my-org/"')
	})

	it('throws when --repo has more than one slash', () => {
		expect(() => parseForkInitArgs(['--repo=my-org/team/my-app'])).toThrow(
			'Malformed --repo value "my-org/team/my-app"',
		)
	})

	it('reports --repo as missing when its value is another flag', () => {
		expect(() => parseForkInitArgs(['--repo', '--app-name=My App'])).toThrow(
			'Missing required --repo=<org>/<name> argument',
		)
	})

	it('throws when --app-name contains a double quote', () => {
		expect(() => parseForkInitArgs(['--repo=my-org/my-app', '--app-name=Client "Big" App'])).toThrow(
			'Malformed --app-name value',
		)
	})

	it('throws when --app-name contains shell metacharacters', () => {
		expect(() => parseForkInitArgs(['--repo=my-org/my-app', '--app-name=App & More'])).toThrow(
			'Malformed --app-name value',
		)
		expect(() => parseForkInitArgs(['--repo=my-org/my-app', '--app-name=100% App'])).toThrow(
			'Malformed --app-name value',
		)
	})

	it('throws when --app-name is empty', () => {
		expect(() => parseForkInitArgs(['--repo=my-org/my-app', '--app-name='])).toThrow('Malformed --app-name value')
	})
})

describe('buildMirrorRemoteUrls', () => {
	it('builds the private mirror URL from org and name', () => {
		expect(buildMirrorRemoteUrls('my-org', 'my-app').mirrorRepoUrl).toBe('https://github.com/my-org/my-app.git')
	})

	it('always points upstream at the canonical public starter', () => {
		expect(buildMirrorRemoteUrls('my-org', 'my-app').upstreamRepoUrl).toBe(UPSTREAM_REPO_URL)
		expect(UPSTREAM_REPO_URL).toBe('https://github.com/ResetShop/angular-nx-standalone-starter.git')
	})
})
