# Backend API Endpoints for User Management

## Overview

Based on the `user-mgmt-test` branch diff against `main`, the following **11 new endpoints** are required to support the user management feature. Auth endpoints (login, refresh, me, logout) already exist.

---

## Endpoints Summary

| Domain      | Count  | Endpoints                    |
| ----------- | ------ | ---------------------------- |
| Permissions | 1      | List all permissions         |
| Roles       | 5      | CRUD + permission assignment |
| Users       | 5      | CRUD + role assignment       |
| **Total**   | **11** |                              |

---

## Issue 1: Permissions API

### GET /api/permissions

**Description:** List all system permissions with pagination.

**Authorization:** Requires `admin:permission:read` permission.

**Query Parameters:** Uses `PaginationParams` from `src/api/interfaces.ts`

```typescript
{
  offset?: number;  // default: 0, min: 0
  limit?: number;   // default: 10, min: 1, max: 500
  search?: string;  // optional
}
```

**Response (200):** Uses `PaginatedResponse<PermissionData>` from `src/api/interfaces.ts`

```typescript
{
	data: Array<{
		id: number;
		resource: string;
		action: string;
		description: string | null;
	}>;
	total: number;
	offset: number;
	limit: number;
}
```

**Notes:**

- Permissions are system-defined (seeded), not user-created
- Group by resource on frontend, not backend

---

## Issue 2: Roles API

### GET /api/roles

**Description:** List roles with pagination and search.

**Authorization:** Requires `admin:role:read` permission.

**Query Parameters:** Uses `PaginationParams` from `src/api/interfaces.ts`

```typescript
{
  offset?: number;  // default: 0, min: 0
  limit?: number;   // default: 10, min: 1, max: 500
  search?: string;  // searches name, code, description
}
```

**Response (200):** Uses `PaginatedResponse<RoleData>` from `src/api/interfaces.ts`

```typescript
{
	data: Array<{
		id: number;
		name: string;
		code: string;
		description: string | null;
		createdAt: string; // ISO8601
		updatedAt: string; // ISO8601
	}>;
	total: number;
	offset: number;
	limit: number;
}
```

---

### GET /api/roles/:id

**Description:** Get role details with assigned permissions.

**Authorization:** Requires `admin:role:read` permission.

**Response (200):**

```typescript
{
	id: number;
	name: string;
	code: string;
	description: string | null;
	createdAt: string;
	updatedAt: string;
	permissions: Array<{
		id: number;
		resource: string;
		action: string;
		description: string | null;
	}>;
}
```

**Error Responses:**

- 404: Role not found

---

### POST /api/roles

**Description:** Create a new role with optional permissions.

**Authorization:** Requires `admin:role:create` permission.

**Request Body:**

```typescript
{
  name: string;           // required, min 1, max 100
  code: string;           // required, regex: /^[A-Z_]+$/, immutable after creation
  description?: string;   // optional, max 500
  permissionIds?: number[]; // optional, default: []
}
```

**Response (201):** Same as GET /api/roles/:id

**Error Responses:**

- 400: Validation error or invalid permission IDs
- 409: Role code or name already exists

---

### PATCH /api/roles/:id

**Description:** Update role details and/or permissions.

**Authorization:** Requires `admin:role:update` permission.

**Request Body:**

```typescript
{
  name?: string;          // min 1, max 100
  description?: string;   // max 500
  permissionIds?: number[]; // replaces all permissions
}
```

**Response (200):** Same as GET /api/roles/:id

**Error Responses:**

- 400: Validation error or invalid permission IDs
- 403: Self-lockout prevention (admin removing own admin permissions)
- 404: Role not found
- 409: Role name already exists

**Notes:**

- Code is immutable (cannot be updated)
- When `permissionIds` is provided, it's a full replacement (not additive)

---

### DELETE /api/roles/:id

**Description:** Delete a role.

**Authorization:** Requires `admin:role:delete` permission.

**Response (200):**

```typescript
{
	message: 'Role deleted successfully';
}
```

**Error Responses:**

- 403: System role (non-removable)
- 404: Role not found

**Notes:**

- System roles (e.g., ADMIN) cannot be deleted
- Consider: Should this fail if users are assigned to the role?

---

## Issue 3: Users API

### GET /api/users

**Description:** List users with pagination and search.

**Authorization:** Requires `admin:user:read` permission.

**Query Parameters:** Uses `PaginationParams` from `src/api/interfaces.ts`

```typescript
{
  offset?: number;  // default: 0, min: 0
  limit?: number;   // default: 10, min: 1, max: 500
  search?: string;  // searches email, firstName, lastName
}
```

**Response (200):** Uses `PaginatedResponse<ManagedUserData>` from `src/api/interfaces.ts`

```typescript
{
	data: Array<{
		id: number;
		email: string;
		firstName: string;
		lastName: string;
		isActive: boolean;
		createdAt: string; // ISO8601
		updatedAt: string; // ISO8601
		roles: Array<{
			id: number;
			name: string;
			code: string;
		}>;
	}>;
	total: number;
	offset: number;
	limit: number;
}
```

---

### GET /api/users/:id

**Description:** Get user details with assigned roles.

**Authorization:** Requires `admin:user:read` permission.

**Response (200):** Same as single user object from list.

**Error Responses:**

- 404: User not found

---

### POST /api/users

**Description:** Create a new user with assigned roles.

**Authorization:** Requires `admin:user:create` permission.

**Request Body:**

```typescript
{
  email: string;        // required, valid email format, unique
  password: string;     // required, min 8 characters
  firstName: string;    // required, min 1, max 100
  lastName: string;     // required, min 1, max 100
  roleIds: number[];    // required, min 1 item
}
```

**Response (201):** Same as GET /api/users/:id

**Error Responses:**

- 400: Validation error or invalid role IDs
- 409: Email already exists

**Notes:**

- Password should be hashed (bcrypt/argon2)
- New users are active by default (`isActive: true`)

---

### PATCH /api/users/:id

**Description:** Update user details, roles, or status.

**Authorization:** Requires `admin:user:update` permission.

**Request Body:**

```typescript
{
  email?: string;       // valid email format
  firstName?: string;   // min 1, max 100
  lastName?: string;    // min 1, max 100
  roleIds?: number[];   // replaces all roles
  isActive?: boolean;   // toggle active/disabled status
}
```

**Response (200):** Same as GET /api/users/:id

**Error Responses:**

- 400: Validation error or invalid role IDs
- 403: Self-lockout prevention (admin disabling own account or removing own admin role)
- 404: User not found
- 409: Email already exists

**Notes:**

- Password update should be a separate endpoint (requires current password verification)
- When `roleIds` is provided, it's a full replacement
- Status toggle (`isActive`) is handled by this same endpoint

---

### DELETE /api/users/:id

**Description:** Delete a user (soft delete recommended).

**Authorization:** Requires `admin:user:delete` permission.

**Response (200):**

```typescript
{
	message: 'User deleted successfully';
}
```

**Error Responses:**

- 403: Cannot delete own account
- 404: User not found

**Notes:**

- Soft delete recommended (set `deletedAt` timestamp, exclude from queries)
- Consider: Revoke all tokens on delete

---

## Implementation Considerations

### 1. Hono Controller Pattern

Controllers are Hono app instances using `@hono/zod-validator` for request validation.

**File structure:**

```
src/api/modules/<domain>/
├── <domain>.controller.ts    # Hono routes
├── <domain>.service.ts       # Business logic
├── <domain>.repository.ts    # Database access
└── permissions.constants.ts  # Permission definitions
```

**Controller pattern:**

```typescript
// src/api/modules/role/role.controller.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requirePermission } from '@/api/middlewares/verify-permissions.middleware';
import { ADMIN_ROLE_PERMISSIONS } from './permissions.constants';
import { listRolesQuerySchema, createRoleRequestSchema } from '@contracts/roles/roles.schemas';

const app = new Hono();

app.get('/', requirePermission(ADMIN_ROLE_PERMISSIONS.READ), zValidator('query', listRolesQuerySchema), async (c) => {
	const params = c.req.valid('query');
	const { roleService } = container.cradle;
	const roles = await roleService.list(params);
	return c.json<PaginatedResponse<RoleData>>(roles);
});

app.post(
	'/',
	requirePermission(ADMIN_ROLE_PERMISSIONS.CREATE),
	zValidator('json', createRoleRequestSchema),
	async (c) => {
		const body = c.req.valid('json');
		const { roleService } = container.cradle;
		const role = await roleService.create(body);
		return c.json<RoleDetailResponse>(role, 201);
	},
);

export default app;
```

### 2. Authorization Pattern

All endpoints require Bearer token + permission check using existing middleware.

**Permission format:** `module:resource:action` (e.g., `admin:user:read`)

**Middleware:** `src/api/middlewares/verify-permissions.middleware.ts`

```typescript
import { permission, type PermissionName } from '@/api/modules/user/permission-types';

// Permission constants per domain
export const ADMIN_ROLE_PERMISSIONS = {
	READ: permission('admin:role:read'),
	CREATE: permission('admin:role:create'),
	UPDATE: permission('admin:role:update'),
	DELETE: permission('admin:role:delete'),
} as const;
```

### 3. Pagination (Standardized)

**All endpoints use offset-based pagination** with existing types:

- `PaginationParams` from `src/api/interfaces.ts`
- `PaginatedResponse<T>` from `src/api/interfaces.ts`
- `PAGINATION_DEFAULTS` from `src/api/constants/pagination.constants.ts`

```typescript
// src/api/interfaces.ts
export interface PaginationParams {
	offset?: number;
	limit?: number;
	search?: string;
}

export interface PaginatedResponse<T> {
	data: T[];
	total: number;
	offset: number;
	limit: number;
}

// src/api/constants/pagination.constants.ts
export const PAGINATION_DEFAULTS = {
	MIN_LIMIT: 1,
	LIMIT: 10,
	MAX_LIMIT: 500,
	OFFSET: 0,
} as const;
```

### 4. Self-Lockout Prevention

Admin users must not be able to:

- Disable their own account
- Remove their own admin role
- Remove admin permissions from their role

### 5. Validation

| Field            | Constraints                    |
| ---------------- | ------------------------------ |
| Email            | Valid email format, unique     |
| Password         | Min 8 characters               |
| Role code        | Regex `/^[A-Z_]+$/`, immutable |
| Names            | 1-100 characters               |
| Description      | Max 500 characters             |
| Pagination limit | Max 100                        |

### 6. Zod Schema Validation (Request & Response)

All endpoints must use Zod schemas for **both input validation and output typing**. This ensures:

- Runtime validation of incoming requests
- Runtime validation of outgoing responses (catches serialization bugs)
- Type inference for TypeScript (single source of truth)
- Consistent error messages

**Contract file structure per domain:**

```
src/contracts/<domain>/
├── <domain>.schemas.ts   # Zod schemas (request + response)
└── <domain>.types.ts     # Type exports via z.infer<>
```

**Required schemas per endpoint:**

| Endpoint              | Request Schema               | Response Schema                 |
| --------------------- | ---------------------------- | ------------------------------- |
| GET /api/permissions  | `listPermissionsQuerySchema` | `listPermissionsResponseSchema` |
| GET /api/roles        | `listRolesQuerySchema`       | `listRolesResponseSchema`       |
| GET /api/roles/:id    | -                            | `roleDetailResponseSchema`      |
| POST /api/roles       | `createRoleRequestSchema`    | `roleDetailResponseSchema`      |
| PATCH /api/roles/:id  | `updateRoleRequestSchema`    | `roleDetailResponseSchema`      |
| DELETE /api/roles/:id | -                            | `deleteResponseSchema`          |
| GET /api/users        | `listUsersQuerySchema`       | `listUsersResponseSchema`       |
| GET /api/users/:id    | -                            | `managedUserResponseSchema`     |
| POST /api/users       | `createUserRequestSchema`    | `managedUserResponseSchema`     |
| PATCH /api/users/:id  | `updateUserRequestSchema`    | `managedUserResponseSchema`     |
| DELETE /api/users/:id | -                            | `deleteResponseSchema`          |

**Example schema pattern:**

```typescript
// src/contracts/users/users.schemas.ts
import { z } from 'zod';

// Request schemas
export const createUserRequestSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
	firstName: z.string().min(1).max(100),
	lastName: z.string().min(1).max(100),
	roleIds: z.array(z.number()).min(1),
});

// Response schemas
export const managedUserSchema = z.object({
	id: z.number(),
	email: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	isActive: z.boolean(),
	createdAt: z.string(),
	updatedAt: z.string(),
	roles: z.array(
		z.object({
			id: z.number(),
			name: z.string(),
			code: z.string(),
		}),
	),
});

export const listUsersResponseSchema = z.object({
	data: z.array(managedUserSchema),
	total: z.number(),
	offset: z.number(),
	limit: z.number(),
});

// src/contracts/users/users.types.ts
import type { z } from 'zod';
import type { createUserRequestSchema, managedUserSchema, listUsersResponseSchema } from './users.schemas';

export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;
export type ManagedUserResponse = z.infer<typeof managedUserSchema>;
export type ListUsersResponse = z.infer<typeof listUsersResponseSchema>;
```

**Hono controller usage:**

```typescript
// Using zValidator middleware for input validation
app.post(
	'/',
	requirePermission(ADMIN_USER_PERMISSIONS.CREATE),
	zValidator('json', createUserRequestSchema),
	async (c) => {
		const body = c.req.valid('json'); // Already validated & typed
		const { userManagementService } = container.cradle;
		const user = await userManagementService.create(body);
		return c.json<ManagedUserResponse>(user, 201);
	},
);
```

### 7. Error Response Format

```typescript
// Standard error response
{
  error: string;
  details?: Record<string, unknown>;
}

// HTTP status codes
400 - Validation errors, invalid IDs
403 - Missing permission, self-lockout prevention
404 - Resource not found
409 - Conflict (duplicate email/code)
```

### 8. Permission Migrations

Each endpoint requires a corresponding permission in the database. Permissions must be added via migrations before the endpoints can be used.

**Required permissions per domain:**

Permission format: `module:resource:action` (e.g., `admin:user:read`)

| Module  | Resource     | Action   | Permission              | Used By                            |
| ------- | ------------ | -------- | ----------------------- | ---------------------------------- |
| `admin` | `permission` | `read`   | `admin:permission:read` | GET /api/permissions               |
| `admin` | `role`       | `read`   | `admin:role:read`       | GET /api/roles, GET /api/roles/:id |
| `admin` | `role`       | `create` | `admin:role:create`     | POST /api/roles                    |
| `admin` | `role`       | `update` | `admin:role:update`     | PATCH /api/roles/:id               |
| `admin` | `role`       | `delete` | `admin:role:delete`     | DELETE /api/roles/:id              |
| `admin` | `user`       | `read`   | `admin:user:read`       | GET /api/users, GET /api/users/:id |
| `admin` | `user`       | `create` | `admin:user:create`     | POST /api/users                    |
| `admin` | `user`       | `update` | `admin:user:update`     | PATCH /api/users/:id               |
| `admin` | `user`       | `delete` | `admin:user:delete`     | DELETE /api/users/:id              |

**Migration pattern:**

```typescript
// migrations/YYYYMMDDHHMMSS_add_user_management_permissions.ts
export async function up(knex: Knex): Promise<void> {
	const permissions = [
		{ module: 'admin', resource: 'permission', action: 'read', description: 'View all system permissions' },
		{ module: 'admin', resource: 'role', action: 'read', description: 'View roles' },
		{ module: 'admin', resource: 'role', action: 'create', description: 'Create new roles' },
		{ module: 'admin', resource: 'role', action: 'update', description: 'Update existing roles' },
		{ module: 'admin', resource: 'role', action: 'delete', description: 'Delete roles' },
		{ module: 'admin', resource: 'user', action: 'read', description: 'View users' },
		{ module: 'admin', resource: 'user', action: 'create', description: 'Create new users' },
		{ module: 'admin', resource: 'user', action: 'update', description: 'Update existing users' },
		{ module: 'admin', resource: 'user', action: 'delete', description: 'Delete users' },
	];

	for (const permission of permissions) {
		await knex('permissions').insert(permission).onConflict(['module', 'resource', 'action']).ignore();
	}
}

export async function down(knex: Knex): Promise<void> {
	await knex('permissions').where('module', 'admin').whereIn('resource', ['permission', 'role', 'user']).delete();
}
```

**Notes:**

- Use `onConflict().ignore()` to make migrations idempotent
- Each issue should include the migration for its required permissions
- Admin role should automatically receive all new permissions (separate migration or seed update)

### 9. Soft Delete Pattern

Users should be soft-deleted:

- Add `deletedAt: timestamp | null` column
- Exclude deleted records from all queries
- Retain data for audit/compliance

---

## GitHub Issues to Create

**Label:** `🖧 backend` (apply to all issues)

| #   | Title                                                  | Priority | Complexity | Permissions to Migrate                                                           |
| --- | ------------------------------------------------------ | -------- | ---------- | -------------------------------------------------------------------------------- |
| 1   | Permissions API - List all permissions with pagination | Low      | Low        | `admin:permission:read`                                                          |
| 2   | Roles API - CRUD with permission assignment            | High     | Medium     | `admin:role:read`, `admin:role:create`, `admin:role:update`, `admin:role:delete` |
| 3   | Users API - CRUD with role assignment                  | High     | Medium     | `admin:user:read`, `admin:user:create`, `admin:user:update`, `admin:user:delete` |

**Each issue description must include:**

- Endpoint specifications (method, path, request/response schemas)
- Authorization requirements
- Zod schemas for request/response validation
- Permission migration requirements
- Acceptance criteria

---

## Verification Checklist

- [ ] All endpoints return proper HTTP status codes
- [ ] All endpoints validate request bodies with Zod schemas
- [ ] All endpoints validate response bodies with Zod schemas
- [ ] All request/response types are exported from contracts
- [ ] All endpoints check authorization (bearer token + permission)
- [ ] All required permissions have migrations
- [ ] Admin role receives all new permissions
- [ ] Pagination works correctly with edge cases (empty, last page)
- [ ] Search is case-insensitive
- [ ] Self-lockout prevention works for admin users
- [ ] Soft delete is implemented for users
- [ ] All responses match the documented schemas
