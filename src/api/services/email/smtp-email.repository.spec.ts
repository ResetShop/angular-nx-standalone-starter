import { fn } from '@test-utils';
import type { Transporter } from 'nodemailer';
import * as nodemailer from 'nodemailer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SendEmailParams } from './interfaces';
import { SmtpEmailRepository } from './smtp-email.repository';

// eslint-disable-next-line no-restricted-syntax -- Repository is the DI boundary; must mock external transport module
vi.mock('nodemailer');

describe('SmtpEmailRepository', () => {
	const mockSendMail = fn<[Record<string, string>], Promise<{ messageId: string }>>();

	const defaultEnv = {
		SMTP_HOST: 'smtp.test.com',
		SMTP_PORT: '587',
		SMTP_SECURE: 'false',
		SMTP_USER: 'test@example.com',
		SMTP_PASS: 'testpass',
		SMTP_FROM: 'noreply@test.com',
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockSendMail.mockClear();

		Object.entries(defaultEnv).forEach(([key, value]) => {
			process.env[key] = value;
		});

		vi.mocked(nodemailer.createTransport).mockReturnValue({
			sendMail: mockSendMail,
		} as unknown as Transporter);
	});

	afterEach(() => {
		Object.keys(defaultEnv).forEach((key) => {
			delete process.env[key];
		});
	});

	describe('constructor', () => {
		it('should create transporter with correct configuration', () => {
			new SmtpEmailRepository();

			expect(vi.mocked(nodemailer.createTransport).mock.calls).toEqual([
				[
					{
						host: 'smtp.test.com',
						port: 587,
						secure: false,
						auth: {
							user: 'test@example.com',
							pass: 'testpass',
						},
					},
				],
			]);
		});

		it('should use default port 587 when SMTP_PORT not set', () => {
			delete process.env['SMTP_PORT'];

			new SmtpEmailRepository();

			const callArgs = vi.mocked(nodemailer.createTransport).mock.calls[0][0] as Record<string, unknown>;
			expect(callArgs['port']).toBe(587);
		});

		it('should use default from address when SMTP_FROM not set', async () => {
			delete process.env['SMTP_FROM'];
			mockSendMail.mockResolvedValue({ messageId: '123' });

			const repository = new SmtpEmailRepository();

			const params: SendEmailParams = {
				to: 'recipient@test.com',
				subject: 'Test',
				html: '<p>Test</p>',
				text: 'Test',
			};

			await repository.send(params);

			expect(mockSendMail.calls[0][0]).toMatchObject({
				from: 'noreply@example.com',
			});
		});

		it('should set secure to true when SMTP_SECURE is "true"', () => {
			process.env['SMTP_SECURE'] = 'true';

			new SmtpEmailRepository();

			const callArgs = vi.mocked(nodemailer.createTransport).mock.calls[0][0] as Record<string, unknown>;
			expect(callArgs['secure']).toBe(true);
		});

		it('should throw when SMTP_HOST is missing', () => {
			delete process.env['SMTP_HOST'];

			expect(() => new SmtpEmailRepository()).toThrow(
				'SMTP configuration incomplete. Required: SMTP_HOST, SMTP_USER, SMTP_PASS',
			);
		});

		it('should throw when SMTP_USER is missing', () => {
			delete process.env['SMTP_USER'];

			expect(() => new SmtpEmailRepository()).toThrow(
				'SMTP configuration incomplete. Required: SMTP_HOST, SMTP_USER, SMTP_PASS',
			);
		});

		it('should throw when SMTP_PASS is missing', () => {
			delete process.env['SMTP_PASS'];

			expect(() => new SmtpEmailRepository()).toThrow(
				'SMTP configuration incomplete. Required: SMTP_HOST, SMTP_USER, SMTP_PASS',
			);
		});
	});

	describe('send', () => {
		it('should call transporter.sendMail with correct parameters', async () => {
			mockSendMail.mockResolvedValue({ messageId: '123' });

			const repository = new SmtpEmailRepository();
			const params: SendEmailParams = {
				to: 'recipient@test.com',
				subject: 'Test Subject',
				html: '<p>Test HTML</p>',
				text: 'Test text',
			};

			await repository.send(params);

			expect(mockSendMail.calls).toEqual([
				[
					{
						from: 'noreply@test.com',
						to: 'recipient@test.com',
						subject: 'Test Subject',
						html: '<p>Test HTML</p>',
						text: 'Test text',
					},
				],
			]);
		});

		it('should propagate errors from transporter', async () => {
			mockSendMail.mockRejectedValue(new Error('SMTP error'));

			const repository = new SmtpEmailRepository();
			const params: SendEmailParams = {
				to: 'recipient@test.com',
				subject: 'Test',
				html: '<p>Test</p>',
				text: 'Test',
			};

			await expect(repository.send(params)).rejects.toThrow('SMTP error');
		});
	});
});
