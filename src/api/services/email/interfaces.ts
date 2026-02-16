export interface SendEmailParams {
	to: string;
	subject: string;
	html: string;
	text: string;
}

export interface IEmailRepository {
	send(params: SendEmailParams): Promise<void>;
}

export interface IEmailService {
	sendEmail(params: SendEmailParams): Promise<void>;
}
