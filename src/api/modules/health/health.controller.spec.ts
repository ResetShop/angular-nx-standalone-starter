import testController from './health.controller';

describe('Test Controller', () => {
	const route = '/v1';

	it('should return success response with message and timestamp', async () => {
		const res = await testController.request(route);
		expect(res.status).toBe(200);

		const data = await res.json();

		expect(data).toHaveProperty('message', 'Server is running!');
		expect(data).toHaveProperty('status', 'success');
		expect(data).toHaveProperty('timestamp');
		expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
	});

	it('should return a valid ISO timestamp', async () => {
		const res = await testController.request(route);
		const data = await res.json();

		const timestamp = new Date(data.timestamp);
		expect(timestamp.toString()).not.toBe('Invalid Date');
	});

	it('should return JSON content type', async () => {
		const res = await testController.request(route);

		expect(res.headers.get('content-type')).toContain('application/json');
	});
});
