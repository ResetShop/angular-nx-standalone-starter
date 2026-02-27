export const EMAIL_PROVIDERS = Object.freeze({
	NODEMAILER: 'nodemailer',
	ETHEREAL: 'ethereal',
} as const);

export type EmailProvider = (typeof EMAIL_PROVIDERS)[keyof typeof EMAIL_PROVIDERS];

export function isEmailProvider(value: string): value is EmailProvider {
	return Object.values(EMAIL_PROVIDERS).includes(value as EmailProvider);
}

export interface SendEmailParams {
	to: string;
	subject: string;
	html: string;
	text: string;
}

/**
 * Repository interface for email delivery.
 * Implementations handle transport-specific concerns (SMTP, Ethereal, etc.).
 *
 * @throws Error on transport failure (connection refused, authentication, timeout)
 * @throws Error if recipients are rejected by the SMTP server
 */
export interface IEmailRepository {
	send(params: SendEmailParams): Promise<void>;
}

export interface IEmailService {
	send(params: SendEmailParams): Promise<void>;
}
