import { appEnv } from '../../config/app.env'
import { ONBOARDING_RESET_TOKEN_EXPIRY } from '../../constants/auth.constants'
import type { EmailContent, EmailLanguage } from './email-builder.utils'
import { escapeHtml, resolveEmailLanguage } from './email-builder.utils'

export interface OnboardingEmailParams {
	firstName: string
	/** Absolute link that lets the user choose a password; it carries the raw single-use token. */
	resetUrl: string
}

// File-local bilingual copy. The {duration} placeholder in expiryNote is resolved at build time from
// ONBOARDING_RESET_TOKEN_EXPIRY, so the email body can never drift from the constant.
const EMAIL_TRANSLATIONS = Object.freeze({
	en: {
		subject: 'Set your password for the new Brillante system',
		greeting: 'Hello',
		intro:
			'Your Brillante account has been moved to the new management system, and it no longer uses Auth0. Choose a password to sign in with your email address.',
		cta: 'Choose my password',
		linkFallback: 'Or paste this link into your browser:',
		expiryNote: 'This link expires in {duration} and can be used only once.',
		expired: 'If it expires before you use it, ask an administrator to send you a new one.',
		footer: 'This is an automated message. Please do not reply to this email.',
		signOff: 'Best regards,',
		team: 'The Brillante team',
	},
	es: {
		subject: 'Elegí tu contraseña para el nuevo sistema de Brillante',
		greeting: 'Hola',
		intro:
			'Tu cuenta de Brillante pasó al nuevo sistema de gestión, que ya no usa Auth0. Elegí una contraseña para ingresar con tu correo electrónico.',
		cta: 'Elegir mi contraseña',
		linkFallback: 'O pegá este enlace en tu navegador:',
		expiryNote: 'Este enlace caduca en {duration} y solo se puede usar una vez.',
		expired: 'Si caduca antes de que lo uses, pedile a un administrador que te envíe uno nuevo.',
		footer: 'Este es un mensaje automatizado. Por favor, no respondas a este correo electrónico.',
		signOff: 'Saludos,',
		team: 'El equipo de Brillante',
	},
} as const)

const DURATION_WORDS = Object.freeze({
	en: { s: 'second', m: 'minute', h: 'hour', d: 'day' },
	es: { s: 'segundo', m: 'minuto', h: 'hora', d: 'día' },
} as const)

// Render a duration string (e.g. '1d', '15m') as human-readable copy ('1 day', '15 minutos').
function formatExpiryDuration(duration: string, lang: EmailLanguage): string {
	const match = /^(\d+)([smhd])$/.exec(duration)
	if (!match) return duration

	const amount = Number(match[1])
	const word = DURATION_WORDS[lang][match[2] as 's' | 'm' | 'h' | 'd']
	return `${amount} ${word}${amount === 1 ? '' : 's'}`
}

/**
 * Build the email that invites a migrated user to choose a password. It carries a single-use link valid for
 * `ONBOARDING_RESET_TOKEN_EXPIRY`; it never contains a password.
 *
 * @param params Recipient first name and the absolute reset URL
 * @param lang Optional language override. Falls back to the APP_LANGUAGE env var, then 'en'.
 */
export function buildOnboardingEmail(params: OnboardingEmailParams, lang?: string): EmailContent {
	const resolvedLang = resolveEmailLanguage(lang ?? appEnv.APP_LANGUAGE)
	const t = EMAIL_TRANSLATIONS[resolvedLang]
	const expiryNote = t.expiryNote.replace(
		'{duration}',
		formatExpiryDuration(ONBOARDING_RESET_TOKEN_EXPIRY, resolvedLang),
	)

	return {
		subject: t.subject,
		text: `${t.greeting} ${params.firstName},\n\n${t.intro}\n\n${t.linkFallback}\n${params.resetUrl}\n\n${expiryNote} ${t.expired}\n\n${t.footer}\n\n${t.signOff}\n${t.team}`,
		html: buildHtml(params, t, resolvedLang, expiryNote),
	}
}

function buildHtml(
	{ firstName, resetUrl }: OnboardingEmailParams,
	t: (typeof EMAIL_TRANSLATIONS)[EmailLanguage],
	lang: EmailLanguage,
	expiryNote: string,
): string {
	const safeFirstName = escapeHtml(firstName)
	const safeResetUrl = escapeHtml(resetUrl)

	return `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2c3e50;">${t.greeting} ${safeFirstName},</h1>

    <p>${t.intro}</p>

    <p style="text-align: center; margin: 28px 0;">
        <a href="${safeResetUrl}" style="background-color: #3498db; color: #ffffff; padding: 12px 24px; border-radius: 4px; text-decoration: none; display: inline-block;">${t.cta}</a>
    </p>

    <p style="color: #666; font-size: 13px;">${t.linkFallback}<br><a href="${safeResetUrl}">${safeResetUrl}</a></p>

    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
        <p style="margin: 0;">${expiryNote} ${t.expired}</p>
    </div>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="color: #666; font-size: 12px;">${t.footer}</p>

    <p>${t.signOff}<br>${t.team}</p>
</body>
</html>`
}
