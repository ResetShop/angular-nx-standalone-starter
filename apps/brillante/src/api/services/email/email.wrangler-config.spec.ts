/**
 * @vitest-environment node
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { parseEmailEnv } from '../../config/email.env'

// The Email Service binding and the variables that select it live in wrangler.jsonc, outside the
// TypeScript program. If the binding were renamed or the provider switched back without a sender, the
// Worker would only fail when the first email is sent.
describe('wrangler.jsonc email configuration', () => {
	const configPath = resolve(import.meta.dirname, '../../../../../../wrangler.jsonc')
	const parsed = ts.parseConfigFileTextToJson(configPath, readFileSync(configPath, 'utf8'))
	const config = parsed.config as {
		send_email?: { name: string }[]
		vars?: Record<string, string>
	}

	it('declares the EMAIL binding the email repository reads', () => {
		expect(config.send_email?.map((binding) => binding.name)).toEqual(['EMAIL'])
	})

	it('selects the Cloudflare provider with a sender, which the email env accepts', () => {
		const vars = config.vars ?? {}

		expect(vars['EMAIL_PROVIDER']).toBe('cloudflare')
		expect(() =>
			parseEmailEnv({
				EMAIL_PROVIDER: vars['EMAIL_PROVIDER'],
				EMAIL_FROM: vars['EMAIL_FROM'],
				EMAIL_FROM_NAME: vars['EMAIL_FROM_NAME'],
			}),
		).not.toThrow()
	})
})
