import { Hono } from 'hono';
import permissionController from './permission/permission.controller';
import roleController from './role/role.controller';

const app = new Hono();

// Permission listing endpoints: /permissions
app.route('/permissions', permissionController);

// Role CRUD and permission assignment endpoints: /roles, /roles/:id, /roles/:id/permissions
app.route('/roles', roleController);

export default app;
