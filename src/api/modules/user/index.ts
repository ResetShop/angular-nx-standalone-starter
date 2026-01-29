import { Hono } from 'hono';
import userManagementController from './user-management.controller';
import userRoleController from './user-role.controller';

const app = new Hono();

// User CRUD management endpoints: /, /:id
app.route('/', userManagementController);

// User role assignment endpoints: /:userId/roles, /:userId/permissions
app.route('/', userRoleController);

export default app;
