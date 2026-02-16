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

		it('should handle non-Error objects in catch block', async () => {
			mockSend.mockRejectedValue('String error');

			await expect(emailService.sendEmail(emailParams)).rejects.toBe('String error');

			const loggedData = JSON.parse(consoleErrorSpy.calls[0][0] as string);
			expect(loggedData.error).toBe('String error');
		});
	});
});
