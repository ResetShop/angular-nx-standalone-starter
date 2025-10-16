import testController from './test.controller';

describe('Test Controller', () => {
  it('should return success response with message and timestamp', async () => {
    const res = await testController.request('/');

    expect(res.status).toBe(200);

    const data = await res.json();

    expect(data).toHaveProperty('message', 'Test endpoint is working!');
    expect(data).toHaveProperty('status', 'success');
    expect(data).toHaveProperty('timestamp');
    expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
  });

  it('should return a valid ISO timestamp', async () => {
    const res = await testController.request('/');
    const data = await res.json();

    const timestamp = new Date(data.timestamp);
    expect(timestamp.toString()).not.toBe('Invalid Date');
  });

  it('should return JSON content type', async () => {
    const res = await testController.request('/');

    expect(res.headers.get('content-type')).toContain('application/json');
  });
});
