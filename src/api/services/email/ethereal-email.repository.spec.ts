import { clearAllMocks, fn } from '@test-utils';
import type { Transporter } from 'nodemailer';
import * as nodemailer from 'nodemailer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EtherealEmailRepository } from './ethereal-email.repository';
import type { SendEmailParams } from './interfaces';

// eslint-disable-next-line no-restricted-syntax -- Repository is the DI boundary; must mock external transport module
vi.mock('nodemailer');

describe('EtherealEmailRepository', () => {
	const mockSendMail = fn<[Record<string, string>], Promise<{ messageId: string }>>();
	const consoleLogSpy = fn();
	const originalConsoleLog = console.log;

	const testAccount = {
		user: 'ethereal-user@ethereal.email',
		pass: 'ethereal-pass',
		smtp: {
			host: 'smtp.ethereal.email',
			port: 587,
			secure: false,
		},
	};

	const emailParams: SendEmailParams = {
		to: 'recipient@test.com',
		subject: 'Test Subject',
		html: '<p>Test HTML</p>',
		text: 'Test text',
	};

	beforeEach(() => {
		clearAllMocks();
		vi.mocked(nodemailer.createTestAccount).mockClear();
		vi.mocked(nodemailer.createTransport).mockClear();
		vi.mocked(nodemailer.getTestMessageUrl).mockClear();

		vi.mocked(nodemailer.createTestAccount).mockResolvedValue(testAccount as never);
		vi.mocked(nodemailer.createTransport).mockReturnValue({
			sendMail: mockSendMail,
		} as unknown as Transporter);

		console.log = consoleLogSpy as typeof console.log;
	});

	afterEach(() => {
		console.log = originalConsoleLog;
	});

	describe('initialization', () => {
		it('should create test account and transporter', async () => {
			mockSendMail.mockResolvedValue({ messageId: '123' });
			vi.mocked(nodemailer.getTestMessageUrl).mockReturnValue(false);

			const repository = new EtherealEmailRepository();
			await repository.send(emailParams);

			expect(vi.mocked(nodemailer.createTestAccount).mock.calls).toHaveLength(1);
			expect(vi.mocked(nodemailer.createTransport).mock.calls).toEqual([
				[
					{
						host: 'smtp.ethereal.email',
						port: 587,
						secure: false,
						auth: {
							user: 'ethereal-user@ethereal.email',
							pass: 'ethereal-pass',
						},
					},
				],
			]);
		});

		it('should reuse transporter on subsequent send calls', async () => {
			mockSendMail.mockResolvedValue({ messageId: '123' });
			vi.mocked(nodemailer.getTestMessageUrl).mockReturnValue(false);

			const repository = new EtherealEmailRepository();
			await repository.send(emailParams);
			await repository.send(emailParams);

			expect(vi.mocked(nodemailer.createTestAccount).mock.calls).toHaveLength(1);
			expect(vi.mocked(nodemailer.createTransport).mock.calls).toHaveLength(1);
			expect(mockSendMail.calls).toHaveLength(2);
		});
	});

	describe('preview URL logging', () => {
		it('should log preview URL when available', async () => {
			const previewUrl = 'https://ethereal.email/message/abc123';
			mockSendMail.mockResolvedValue({ messageId: '123' });
			vi.mocked(nodemailer.getTestMessageUrl).mockReturnValue(previewUrl);

			const repository = new EtherealEmailRepository();
			await repository.send(emailParams);

			expect(consoleLogSpy.calls).toHaveLength(1);

			const loggedData = JSON.parse(consoleLogSpy.calls[0][0] as string);
			expect(loggedData).toEqual({
				event: 'ethereal_email_preview',
				previewUrl,
				recipient: 'recipient@test.com',
				subject: 'Test Subject',
			});
		});

		it('should not log when preview URL is not available', async () => {
			mockSendMail.mockResolvedValue({ messageId: '123' });
			vi.mocked(nodemailer.getTestMessageUrl).mockReturnValue(false);

			const repository = new EtherealEmailRepository();
			await repository.send(emailParams);

			expect(consoleLogSpy.calls).toHaveLength(0);
		});
	});

	describe('error propagation', () => {
		it('should propagate errors from createTestAccount', async () => {
			vi.mocked(nodemailer.createTestAccount).mockRejectedValue(new Error('Network error'));

			const repository = new EtherealEmailRepository();

			await expect(repository.send(emailParams)).rejects.toThrow('Network error');
		});

		it('should propagate errors from transporter.sendMail', async () => {
			mockSendMail.mockRejectedValue(new Error('Send failed'));
			vi.mocked(nodemailer.getTestMessageUrl).mockReturnValue(false);

			const repository = new EtherealEmailRepository();

			await expect(repository.send(emailParams)).rejects.toThrow('Send failed');
		});
	});
});
