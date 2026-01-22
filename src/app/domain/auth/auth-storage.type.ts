import { roleWithPermissionsSchema } from '@contracts/roles/roles.schemas';
import { z } from 'zod';

export const authStorageDataSchema = z.object({
	id: z.number(),
	email: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	token: z.string(),
	roles: z.array(roleWithPermissionsSchema),
});

export type AuthStorageData = z.infer<typeof authStorageDataSchema>;
