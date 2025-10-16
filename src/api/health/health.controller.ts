import { Hono } from 'hono';

// TODO: Remove this controller file
const app = new Hono();

/**
 * Test endpoint
 * GET /api/test
 */
app.get('/v1/health', async (c) => {
  return c.json({
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    status: 'success',
  });
});

export default app;
