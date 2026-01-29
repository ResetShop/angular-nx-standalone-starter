import type { PaginatedResponse } from '@contracts/common/pagination.types';
import type { PermissionData } from '@contracts/roles/roles.types';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { PAGINATION_DEFAULTS } from '../../constants/pagination.constants';
import { container } from '../../container';
import { requirePermission } from '../../middlewares/verify-permissions.middleware';
import { ADMIN_PERMISSION_PERMISSIONS } from '../role/permissions.constants';

const app = new Hono();

/**
 * GET /api/permissions
 * List all system permissions with pagination and optional search
 */
app.get(
	'/',
	requirePermission(ADMIN_PERMISSION_PERMISSIONS.READ),
	zValidator(
		'query',
		z.object({
			offset: z.coerce.number().int().min(PAGINATION_DEFAULTS.OFFSET).optional(),
			limit: z.coerce.number().int().min(PAGINATION_DEFAULTS.MIN_LIMIT).max(PAGINATION_DEFAULTS.MAX_LIMIT).optional(),
			search: z.string().trim().min(1).max(100).optional(),
		}),
	),
	async (c) => {
		const { permissionService } = container.cradle;
		const { offset, limit, search } = c.req.valid('query');
		const permissions = await permissionService.list({ offset, limit, search });
		return c.json<PaginatedResponse<PermissionData>>(permissions);
	},
);

export default app;
