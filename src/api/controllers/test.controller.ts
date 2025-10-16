import { Hono } from 'hono';

// TODO: Remove this controller file
const app = new Hono();

/**
 * Test endpoint
 * GET /api/test
 */
app.get('/', (c) => {
  return c.json({
    message: 'Test endpoint is working!',
    timestamp: new Date().toISOString(),
    status: 'success',
  });
});

export default app;
