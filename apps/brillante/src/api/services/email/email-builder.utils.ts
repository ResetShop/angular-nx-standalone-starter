/** Shared building blocks for transactional email builders (welcome, password reset, …). */

/** The three rendered representations every email builder returns. */
export interface EmailContent {
	subject: string
	html: string
	text: string
}

/** Languages supported by the bilingual email templates. */
export type EmailLanguage = 'en' | 'es'

/** Resolves an arbitrary language hint to a supported template language, defaulting to English. */
export function resolveEmailLanguage(lang: string | undefined): EmailLanguage {
	return lang === 'es' ? 'es' : 'en'
}

/** Escapes HTML-significant characters in user-provided values before interpolation into an HTML email. */
export function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
}

/** Renders a duration string (e.g. '1d', '15m') as human-readable bilingual copy ('1 day', '15 minutos'). */
export function formatExpiryDuration(duration: string, lang: EmailLanguage): string {
	const match = /^(\d+)([smhd])$/.exec(duration)
	if (!match) return duration

	const amount = Number(match[1])
	const unit = match[2] as 's' | 'm' | 'h' | 'd'
	const words = {
		en: { s: 'second', m: 'minute', h: 'hour', d: 'day' },
		es: { s: 'segundo', m: 'minuto', h: 'hora', d: 'día' },
	} as const

	return `${amount} ${words[lang][unit]}${amount === 1 ? '' : 's'}`
}
