import { Request, Response, Router } from 'express';

// TODO: Remove this controller file
const router = Router();

/**
 * Test endpoint
 * GET /api/test
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Test endpoint is working!',
    timestamp: new Date().toISOString(),
    status: 'success',
  });
});

export default router;
