import { clearAllMocks, fn } from '@test-utils';
import type { Transporter } from 'nodemailer';
import * as nodemailer from 'nodemailer';
import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SendEmailParams } from './interfaces';
import { NodemailerRepository } from './nodemailer.repository';

// eslint-disable-next-line no-restricted-syntax -- Repository is the DI boundary; must mock external transport module
vi.mock('nodemailer');

const mockCreateTransport = nodemailer.createTransport as unknown as Mock;

describe('NodemailerRepository', () => {
	const mockSendMail = fn<[Record<string, string>], Promise<{ messageId: string; rejected: string[] }>>();
	const consoleErrorSpy = fn();
	const originalConsoleError = console.error;

	const defaultEnv = {
		SMTP_HOST: 'smtp.test.com',
		SMTP_PORT: '587',
		SMTP_SECURE: 'false',
		SMTP_USER: 'test@example.com',
		SMTP_PASS: 'testpass',
		SMTP_FROM: 'noreply@test.com',
	};

	beforeEach(() => {
		clearAllMocks();
		mockCreateTransport.mockClear();

		Object.entries(defaultEnv).forEach(([key, value]) => {
			process.env[key] = value;
		});

		mockCreateTransport.mockReturnValue({
			sendMail: mockSendMail,
		} as unknown as Transporter);

		console.error = consoleErrorSpy as typeof console.error;
	});

	afterEach(() => {
		console.error = originalConsoleError;

		Object.keys(defaultEnv).forEach((key) => {
			delete process.env[key];
		});
	});

	describe('constructor', () => {
		it('should create transporter with correct configuration', () => {
			new NodemailerRepository();

			expect(mockCreateTransport.mock.calls).toEqual([
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

			new NodemailerRepository();

			const callArgs = mockCreateTransport.mock.calls[0][0] as Record<string, unknown>;
			expect(callArgs['port']).toBe(587);
		});

		it('should use default from address when SMTP_FROM not set', async () => {
			delete process.env['SMTP_FROM'];
			mockSendMail.mockResolvedValue({ messageId: '123', rejected: [] });

			const repository = new NodemailerRepository();

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

			new NodemailerRepository();

			const callArgs = mockCreateTransport.mock.calls[0][0] as Record<string, unknown>;
			expect(callArgs['secure']).toBe(true);
		});

		it('should throw when SMTP_HOST is missing', () => {
			delete process.env['SMTP_HOST'];

			expect(() => new NodemailerRepository()).toThrow(
				'SMTP configuration incomplete. Required: SMTP_HOST, SMTP_USER, SMTP_PASS',
			);
		});

		it('should throw when SMTP_USER is missing', () => {
			delete process.env['SMTP_USER'];

			expect(() => new NodemailerRepository()).toThrow(
				'SMTP configuration incomplete. Required: SMTP_HOST, SMTP_USER, SMTP_PASS',
			);
		});

		it('should throw when SMTP_PASS is missing', () => {
			delete process.env['SMTP_PASS'];

			expect(() => new NodemailerRepository()).toThrow(
				'SMTP configuration incomplete. Required: SMTP_HOST, SMTP_USER, SMTP_PASS',
			);
		});

		it('should throw when SMTP_PORT is not a valid number', () => {
			process.env['SMTP_PORT'] = 'abc';

			expect(() => new NodemailerRepository()).toThrow(
				'Invalid SMTP_PORT: "abc". Must be a number between 1 and 65535',
			);
		});

		it('should throw when SMTP_PORT is out of range', () => {
			process.env['SMTP_PORT'] = '99999';

			expect(() => new NodemailerRepository()).toThrow(
				'Invalid SMTP_PORT: "99999". Must be a number between 1 and 65535',
			);
		});

		it('should throw when SMTP_PORT is zero', () => {
			process.env['SMTP_PORT'] = '0';

			expect(() => new NodemailerRepository()).toThrow('Invalid SMTP_PORT: "0". Must be a number between 1 and 65535');
		});
	});

	describe('send', () => {
		it('should call transporter.sendMail with correct parameters', async () => {
			mockSendMail.mockResolvedValue({ messageId: '123', rejected: [] });

			const repository = new NodemailerRepository();
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

		it('should throw when recipients are rejected by SMTP server', async () => {
			mockSendMail.mockResolvedValue({
				messageId: '123',
				rejected: ['bad@example.com'],
			});

			const repository = new NodemailerRepository();
			const params: SendEmailParams = {
				to: 'bad@example.com',
				subject: 'Test',
				html: '<p>Test</p>',
				text: 'Test',
			};

			await expect(repository.send(params)).rejects.toThrow('Recipients rejected by SMTP server: bad@example.com');

			const loggedData = JSON.parse(consoleErrorSpy.calls[0][0] as string);
			expect(loggedData).toEqual({
				event: 'email_recipients_rejected',
				rejected: ['bad@example.com'],
				recipient: 'bad@example.com',
				subject: 'Test',
			});
		});

		it('should propagate errors from transporter', async () => {
			mockSendMail.mockRejectedValue(new Error('SMTP error'));

			const repository = new NodemailerRepository();
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
