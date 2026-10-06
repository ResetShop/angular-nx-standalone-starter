import type { Context, MiddlewareHandler } from 'hono'
import { AsyncLocalStorage } from 'node:async_hooks'

/** An address as the Email Service binding takes it: a plain address, or an address with a display name. */
export type EmailAddress = string | { readonly email: string; readonly name?: string }

/** The message the Email Service binding sends. */
export interface SendEmailMessage {
	readonly to: string
	readonly from: EmailAddress
	readonly subject: string
	readonly html: string
	readonly text: string
}

/**
 * The part of the Cloudflare Email Service `send_email` binding this app uses. Errors are thrown as
 * `Error` objects with a `code` property (for example `E_SENDER_NOT_VERIFIED`).
 */
export interface SendEmailBinding {
	send(message: SendEmailMessage): Promise<{ readonly messageId: string }>
}

export interface EmailBindings {
	EMAIL?: SendEmailBinding
}

const bindingStorage = new AsyncLocalStorage<SendEmailBinding>()

/**
 * Makes the `EMAIL` binding of the current request available to the email repository. The repository lives in
 * the DI container, which is shared by every request, while the binding arrives with each request's `env`.
 * Deferred work (the password reset email is sent after the response) keeps the context it was registered in.
 */
export function requestEmailMiddleware(): MiddlewareHandler<{ Bindings: EmailBindings }> {
	return (c: Context<{ Bindings: EmailBindings }>, next) => {
		const binding = c.env?.EMAIL
		return binding ? bindingStorage.run(binding, next) : next()
	}
}

export function requireEmailBinding(): SendEmailBinding {
	const binding = bindingStorage.getStore()
	if (!binding) {
		throw new Error(
			'The EMAIL binding is not available: declare "send_email" in wrangler.jsonc and send within a request',
		)
	}
	return binding
}
