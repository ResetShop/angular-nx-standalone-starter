import nodemailer, { type Transporter } from 'nodemailer';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { EmailService } from './email.service';
import type { SendEmailParams } from './interfaces';

// Mock nodemailer module
vi.mock('nodemailer');

describe('EmailService', () => {
	let mockTransporter: {
		sendMail: Mock;
	};
	let consoleErrorSpy: Mock;

	const defaultEnv = {
		SMTP_HOST: 'smtp.test.com',
		SMTP_PORT: '587',
		SMTP_SECURE: 'false',
		SMTP_USER: 'test@example.com',
		SMTP_PASS: 'testpass',
		SMTP_FROM: 'noreply@test.com',
	};

	beforeEach(() => {
		// Setup environment variables
		Object.entries(defaultEnv).forEach(([key, value]) => {
			process.env[key] = value;
		});

		// Create mock transporter
		mockTransporter = {
			sendMail: vi.fn(),
		};

		// Mock createTransport to return our mock transporter
		vi.mocked(nodemailer.createTransport).mockReturnValue(mockTransporter as unknown as Transporter);

		// Spy on console.error
		consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.clearAllMocks();
		// Clean up environment variables
		Object.keys(defaultEnv).forEach((key) => {
			delete process.env[key];
		});
	});

	describe('constructor', () => {
		it('should create transporter with correct configuration', () => {
			new EmailService();

			expect(nodemailer.createTransport).toHaveBeenCalledWith({
				host: 'smtp.test.com',
				port: 587,
				secure: false,
				auth: {
					user: 'test@example.com',
					pass: 'testpass',
				},
			});
		});

		it('should use default port 587 when SMTP_PORT not set', () => {
			delete process.env['SMTP_PORT'];

			new EmailService();

			expect(nodemailer.createTransport).toHaveBeenCalledWith(
				expect.objectContaining({
					port: 587,
				}),
			);
		});

		it('should use default from address when SMTP_FROM not set', () => {
			delete process.env['SMTP_FROM'];

			const service = new EmailService();

			// Test by sending an email and checking the from address
			const params: SendEmailParams = {
				to: 'recipient@test.com',
				subject: 'Test',
				html: '<p>Test</p>',
				text: 'Test',
			};

			service.sendEmail(params);

			expect(mockTransporter.sendMail).toHaveBeenCalledWith(
				expect.objectContaining({
					from: 'noreply@example.com',
				}),
			);
		});

		it('should set secure to true when SMTP_SECURE is "true"', () => {
			process.env['SMTP_SECURE'] = 'true';

			new EmailService();

			expect(nodemailer.createTransport).toHaveBeenCalledWith(
				expect.objectContaining({
					secure: true,
				}),
			);
		});

		it('should throw when SMTP_HOST is missing', () => {
			delete process.env['SMTP_HOST'];

			expect(() => new EmailService()).toThrow(
				'SMTP configuration incomplete. Required: SMTP_HOST, SMTP_USER, SMTP_PASS',
			);
		});

		it('should throw when SMTP_USER is missing', () => {
			delete process.env['SMTP_USER'];

			expect(() => new EmailService()).toThrow(
				'SMTP configuration incomplete. Required: SMTP_HOST, SMTP_USER, SMTP_PASS',
			);
		});

		it('should throw when SMTP_PASS is missing', () => {
			delete process.env['SMTP_PASS'];

			expect(() => new EmailService()).toThrow(
				'SMTP configuration incomplete. Required: SMTP_HOST, SMTP_USER, SMTP_PASS',
			);
		});
	});

	describe('sendEmail', () => {
		let emailService: EmailService;
		let emailParams: SendEmailParams;

		beforeEach(() => {
			emailService = new EmailService();
			emailParams = {
				to: 'recipient@test.com',
				subject: 'Test Subject',
				html: '<p>Test HTML content</p>',
				text: 'Test text content',
			};
		});

		it('should return true when email is sent successfully', async () => {
			mockTransporter.sendMail.mockResolvedValue({ messageId: '123' });

			const result = await emailService.sendEmail(emailParams);

			expect(result).toBe(true);
		});

		it('should call sendMail with correct parameters', async () => {
			mockTransporter.sendMail.mockResolvedValue({ messageId: '123' });

			await emailService.sendEmail(emailParams);

			expect(mockTransporter.sendMail).toHaveBeenCalledWith({
				from: 'noreply@test.com',
				to: 'recipient@test.com',
				subject: 'Test Subject',
				html: '<p>Test HTML content</p>',
				text: 'Test text content',
			});
		});

		it('should return false when sendMail throws error', async () => {
			mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

			const result = await emailService.sendEmail(emailParams);

			expect(result).toBe(false);
		});

		it('should log structured JSON error when sendMail fails', async () => {
			const smtpError = new Error('SMTP connection failed');
			mockTransporter.sendMail.mockRejectedValue(smtpError);

			await emailService.sendEmail(emailParams);

			expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

			const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);

			expect(loggedData).toMatchObject({
				event: 'email_send_failed',
				recipient: 'recipient@test.com',
				subject: 'Test Subject',
				error: 'SMTP connection failed',
			});

			expect(loggedData.timestamp).toBeDefined();
			expect(new Date(loggedData.timestamp).toString()).not.toBe('Invalid Date');
		});

		it('should handle non-Error objects in catch block', async () => {
			mockTransporter.sendMail.mockRejectedValue('String error');

			const result = await emailService.sendEmail(emailParams);

			expect(result).toBe(false);

			const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
			expect(loggedData.error).toBe('String error');
		});

		it('should not throw when sendMail fails', async () => {
			mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

			await expect(emailService.sendEmail(emailParams)).resolves.not.toThrow();
		});
	});
});
