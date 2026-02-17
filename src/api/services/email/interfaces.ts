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
