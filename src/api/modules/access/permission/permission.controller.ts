import type { PaginatedResponse } from '@contracts/common/pagination.types';
import type { PermissionData } from '@contracts/role/role.types';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { QUERY_DEFAULTS } from '../../../constants/query.constants';
import { container } from '../../../container';
import { requirePermission } from '../../../middlewares/verify-permissions.middleware';
import { ADMIN_PERMISSION_PERMISSIONS } from '../role/permissions.constants';

const app = new Hono();

/**
 * GET /api/access/permissions
 * List all system permissions with pagination and optional search
 */
app.get(
	'/',
	requirePermission(ADMIN_PERMISSION_PERMISSIONS.READ),
	zValidator(
		'query',
		z.object({
			offset: z.coerce.number().int().min(QUERY_DEFAULTS.OFFSET).optional(),
			limit: z.coerce.number().int().min(QUERY_DEFAULTS.MIN_LIMIT).max(QUERY_DEFAULTS.MAX_LIMIT).optional(),
			search: z.string().trim().min(QUERY_DEFAULTS.SEARCH_MIN_LENGTH).max(QUERY_DEFAULTS.SEARCH_MAX_LENGTH).optional(),
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
