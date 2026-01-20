import { Hono } from 'hono';
import userRoleController from './user-role.controller';

const app = new Hono();

// User CRUD endpoints will be added here when userController is created:
// app.route('/', userController);

// User role assignment endpoints: /:userId/roles, /:userId/permissions
app.route('/', userRoleController);

export default app;
