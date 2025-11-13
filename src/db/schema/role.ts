import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { permission } from './permission';
import { userRole } from './user';

export const role = pgTable('role', {
	id: serial('id').primaryKey(),
	name: text('name').notNull().unique(),
	description: text('description'),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
});

export const rolePermission = pgTable('role_permission', {
	id: serial('id').primaryKey(),
	roleId: integer('role_id')
		.notNull()
		.references(() => role.id, { onDelete: 'restrict' }),
	permissionId: integer('permission_id')
		.notNull()
		.references(() => permission.id, { onDelete: 'restrict' }),
	createdAt: timestamp('created_at').defaultNow(),
});

export const roleRelations = relations(role, ({ many }) => ({
	permissions: many(rolePermission),
	users: many(userRole),
}));

export const rolePermissionRelations = relations(rolePermission, ({ one }) => ({
	role: one(role, { fields: [rolePermission.roleId], references: [role.id] }),
	permission: one(permission, { fields: [rolePermission.permissionId], references: [permission.id] }),
}));
