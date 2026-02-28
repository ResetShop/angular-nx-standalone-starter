import { paginatedResponseSchema, paginationParamsSchema } from '@contracts/common/pagination.schemas';
import { permissionDataSchema } from '@contracts/role/role.schemas';
import { createRoute, z } from '@hono/zod-openapi';
import { requirePermission } from '../../../middlewares/verify-permissions.middleware';
import { PASETO_COOKIE_SCHEME, commonSecuredResponses } from '../../../openapi-config';
import { ADMIN_PERMISSION_PERMISSIONS } from '../role/permissions.constants';

const searchQuerySchema = paginationParamsSchema.extend({
	search: z.string().optional(),
});

export const listPermissionsRoute = createRoute({
	method: 'get',
	path: '/',
	tags: ['Permissions'],
	summary: 'List all permissions',
	description: 'List all system permissions with pagination and optional search.',
	security: [{ [PASETO_COOKIE_SCHEME]: [] }],
	middleware: [requirePermission(ADMIN_PERMISSION_PERMISSIONS.READ)] as const,
	request: {
		query: searchQuerySchema,
	},
	responses: {
		200: {
			description: 'Paginated list of permissions',
			content: { 'application/json': { schema: paginatedResponseSchema(permissionDataSchema) } },
		},
		...commonSecuredResponses,
	},
});
