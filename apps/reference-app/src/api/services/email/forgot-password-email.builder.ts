import type { EmailContent, EmailLanguage } from './email-builder.utils'
import { escapeHtml, resolveEmailLanguage } from './email-builder.utils'

export interface ForgotPasswordEmailParams {
	firstName: string
	/** Absolute reset-link URL containing the raw token; rendered as the email's CTA. */
	resetUrl: string
}

// File-local bilingual email translations. The "1 hour" expiry text mirrors PASSWORD_RESET_TOKEN_EXPIRY.
const EMAIL_TRANSLATIONS = Object.freeze({
	en: {
		subject: 'Reset your password',
		greeting: 'Hello',
		intro: 'We received a request to reset your password. Click the button below to choose a new one.',
		cta: 'Reset password',
		linkFallback: 'Or paste this link into your browser:',
		expiryNote: 'This link expires in 1 hour and can be used only once.',
		ignore:
			'If you did not request a password reset, you can safely ignore this email — your password will not change.',
		footer: 'This is an automated message. Please do not reply to this email.',
		signOff: 'Best regards,',
		team: 'The Team',
	},
	es: {
		subject: 'Restablece tu contraseña',
		greeting: 'Hola',
		intro:
			'Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para elegir una nueva.',
		cta: 'Restablecer contraseña',
		linkFallback: 'O pega este enlace en tu navegador:',
		expiryNote: 'Este enlace caduca en 1 hora y solo se puede usar una vez.',
		ignore:
			'Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura — tu contraseña no cambiará.',
		footer: 'Este es un mensaje automatizado. Por favor, no respondas a este correo electrónico.',
		signOff: 'Saludos cordiales,',
		team: 'El Equipo',
	},
} as const)

/**
 * Build the self-service password-reset email (contains the reset link). Returns subject, HTML, and
 * plain text. The link carries a single-use, time-limited token; the email never contains a password.
 *
 * @param params Recipient first name and the absolute reset URL
 * @param lang Optional language override. Falls back to APP_LANGUAGE env var, then 'en'.
 */
export function buildForgotPasswordEmail(params: ForgotPasswordEmailParams, lang?: string): EmailContent {
	const resolvedLang = resolveEmailLanguage(lang ?? process.env['APP_LANGUAGE'])
	const t = EMAIL_TRANSLATIONS[resolvedLang]

	return {
		subject: t.subject,
		text: buildTextContent(params, t),
		html: buildHtmlContent(params, t, resolvedLang),
	}
}

function buildTextContent(
	{ firstName, resetUrl }: ForgotPasswordEmailParams,
	t: (typeof EMAIL_TRANSLATIONS)[EmailLanguage],
): string {
	return `${t.greeting} ${firstName},

${t.intro}

${t.linkFallback}
${resetUrl}

${t.expiryNote}

${t.ignore}

${t.footer}

${t.signOff}
${t.team}`
}

function buildHtmlContent(
	{ firstName, resetUrl }: ForgotPasswordEmailParams,
	t: (typeof EMAIL_TRANSLATIONS)[EmailLanguage],
	lang: EmailLanguage,
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
        <p style="margin: 0;">${t.expiryNote}</p>
    </div>

    <p>${t.ignore}</p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="color: #666; font-size: 12px;">${t.footer}</p>

    <p>${t.signOff}<br>${t.team}</p>
</body>
</html>`
}
