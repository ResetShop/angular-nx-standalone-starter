import type { z } from 'zod';
import type { errorResponseSchema, successMessageSchema } from './error.schemas';

/**
 * Standard error response type for API errors.
 */
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

/**
 * Standard success message response type.
 */
export type SuccessMessage = z.infer<typeof successMessageSchema>;
