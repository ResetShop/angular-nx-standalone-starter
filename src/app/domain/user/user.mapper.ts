import type { IRole } from '../access/role.interface';
import type { IUser } from './user.interface';
import { User } from './user.model';

export function createUser(
	id: number,
	email: string,
	firstName: string,
	lastName: string,
	roles: IRole[],
	token: string,
): IUser {
	return new User(id, email, firstName, lastName, roles, token);
}
