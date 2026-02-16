import { fn, type MockFn } from '@test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailService } from './email.service';
import type { IEmailRepository, SendEmailParams } from './interfaces';

describe('EmailService', () => {
	const mockSend = fn<[SendEmailParams], Promise<void>>();

	const mockEmailRepository: IEmailRepository = {
		send: mockSend,
	};

	let emailService: EmailService;
	let consoleErrorSpy: MockFn;

	const emailParams: SendEmailParams = {
		to: 'recipient@test.com',
		subject: 'Test Subject',
		html: '<p>Test HTML content</p>',
		text: 'Test text content',
	};

	beforeEach(() => {
		mockSend.mockClear();

		emailService = new EmailService({
			emailRepository: mockEmailRepository,
		});

		consoleErrorSpy = fn();
		vi.spyOn(console, 'error').mockImplementation(consoleErrorSpy);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('sendEmail', () => {
		it('should delegate to emailRepository.send', async () => {
			mockSend.mockResolvedValue(undefined);

			await emailService.sendEmail(emailParams);

			expect(mockSend.calls).toEqual([[emailParams]]);
		});

		it('should return true when email is sent successfully', async () => {
			mockSend.mockResolvedValue(undefined);

			const result = await emailService.sendEmail(emailParams);

			expect(result).toBe(true);
		});

		it('should return false when repository throws', async () => {
			mockSend.mockRejectedValue(new Error('SMTP error'));

			const result = await emailService.sendEmail(emailParams);

			expect(result).toBe(false);
		});

		it('should log structured JSON error when repository throws', async () => {
			mockSend.mockRejectedValue(new Error('SMTP connection failed'));

			await emailService.sendEmail(emailParams);

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

			const result = await emailService.sendEmail(emailParams);

			expect(result).toBe(false);

			const loggedData = JSON.parse(consoleErrorSpy.calls[0][0] as string);
			expect(loggedData.error).toBe('String error');
		});

		it('should not throw when repository throws', async () => {
			mockSend.mockRejectedValue(new Error('SMTP error'));

			await expect(emailService.sendEmail(emailParams)).resolves.not.toThrow();
		});
	});
});
