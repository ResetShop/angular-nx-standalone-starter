import { clearAllMocks, fn } from '@test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EmailService } from './email.service';
import type { IEmailRepository, SendEmailParams } from './interfaces';

describe('EmailService', () => {
	const mockSend = fn<[SendEmailParams], Promise<void>>();
	const consoleErrorSpy = fn();
	const originalConsoleError = console.error;

	const mockEmailRepository: IEmailRepository = {
		send: mockSend,
	};

	let emailService: EmailService;

	const emailParams: SendEmailParams = {
		to: 'recipient@test.com',
		subject: 'Test Subject',
		html: '<p>Test HTML content</p>',
		text: 'Test text content',
	};

	beforeEach(() => {
		clearAllMocks();

		emailService = new EmailService({
			emailRepository: mockEmailRepository,
		});

		console.error = consoleErrorSpy as typeof console.error;
	});

	afterEach(() => {
		console.error = originalConsoleError;
	});

	describe('validation', () => {
		it('should throw when recipient email is invalid', async () => {
			await expect(emailService.sendEmail({ ...emailParams, to: 'not-an-email' })).rejects.toThrow(
				'Invalid recipient email address',
			);

			expect(mockSend.calls).toHaveLength(0);
		});

		it('should throw when recipient email is empty', async () => {
			await expect(emailService.sendEmail({ ...emailParams, to: '' })).rejects.toThrow();

			expect(mockSend.calls).toHaveLength(0);
		});

		it('should throw when subject is empty', async () => {
			await expect(emailService.sendEmail({ ...emailParams, subject: '' })).rejects.toThrow('Subject is required');

			expect(mockSend.calls).toHaveLength(0);
		});

		it('should throw when html content is empty', async () => {
			await expect(emailService.sendEmail({ ...emailParams, html: '' })).rejects.toThrow('HTML content is required');

			expect(mockSend.calls).toHaveLength(0);
		});

		it('should throw when text content is empty', async () => {
			await expect(emailService.sendEmail({ ...emailParams, text: '' })).rejects.toThrow('Text content is required');

			expect(mockSend.calls).toHaveLength(0);
		});
	});

	describe('sendEmail', () => {
		it('should delegate to emailRepository.send', async () => {
			mockSend.mockResolvedValue(undefined);

			await emailService.sendEmail(emailParams);

			expect(mockSend.calls).toEqual([[emailParams]]);
		});

		it('should resolve when email is sent successfully', async () => {
			mockSend.mockResolvedValue(undefined);

			await expect(emailService.sendEmail(emailParams)).resolves.toBeUndefined();
		});

		it('should re-throw the original error from repository', async () => {
			const error = new Error('SMTP error');
			mockSend.mockRejectedValue(error);

			await expect(emailService.sendEmail(emailParams)).rejects.toThrow(error);
		});

		it('should log structured JSON error before re-throwing', async () => {
			mockSend.mockRejectedValue(new Error('SMTP connection failed'));

			try {
				await emailService.sendEmail(emailParams);
			} catch {
				// expected
			}

			expect(consoleErrorSpy.calls).toHaveLength(1);

			const loggedData = JSON.parse(consoleErrorSpy.calls[0][0] as string);

			expect(loggedData).toMatchObject({
				event: 'email_send_failed',
				recipient: 'recipient@test.com',
				subject: 'Test Subject',
				error: 'SMTP connection failed',
			});

			expect(loggedData.timestamp).toBeDefined();
			expect(new Date(loggedData.timestamp).toString()).not.toBe('Invalid Date');
		});

		it('should re-throw the original error even when JSON.stringify fails', async () => {
			const originalError = new Error('SMTP connection refused');
			const originalStringify = JSON.stringify;

			mockSend.mockImplementation(() => {
				JSON.stringify = () => {
					throw new TypeError('Circular');
				};
				return Promise.reject(originalError);
			});

			try {
				await expect(emailService.sendEmail(emailParams)).rejects.toThrow(originalError);
				expect(consoleErrorSpy.calls[0]).toEqual(['email_send_failed', 'recipient@test.com', 'Test Subject']);
			} finally {
				JSON.stringify = originalStringify;
			}
		});

		it('should handle non-Error objects in catch block', async () => {
			mockSend.mockRejectedValue('String error');

			await expect(emailService.sendEmail(emailParams)).rejects.toBe('String error');

			const loggedData = JSON.parse(consoleErrorSpy.calls[0][0] as string);
			expect(loggedData.error).toBe('String error');
		});
	});
});
