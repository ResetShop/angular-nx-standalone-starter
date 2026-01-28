import { paginationParamsSchema } from '@contracts/common/pagination.schemas';
import type { PaginatedResponse } from '@contracts/common/pagination.types';
import type { PermissionData } from '@contracts/roles/roles.types';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { container } from '../../container';
import { requirePermission } from '../../middlewares/verify-permissions.middleware';
import { ADMIN_PERMISSION_PERMISSIONS } from '../role/permissions.constants';

const app = new Hono();

/**
 * GET /api/permissions
 * List all system permissions with pagination
 */
app.get(
	'/',
	requirePermission(ADMIN_PERMISSION_PERMISSIONS.READ),
	zValidator('query', paginationParamsSchema),
	async (c) => {
		const { permissionService } = container.cradle;
		const { offset, limit } = c.req.valid('query');
		const permissions = await permissionService.list({ offset, limit });
		return c.json<PaginatedResponse<PermissionData>>(permissions);
	},
);

export default app;
