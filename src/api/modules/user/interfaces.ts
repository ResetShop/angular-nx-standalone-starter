export interface UserData {
	id: number;
	email: string;
	firstName: string;
	lastName: string;
	enabled: boolean;
	deleted: boolean;
}

export interface IUserRepository {
	findByEmail(email: string): Promise<UserData | null>;
	findById(id: number): Promise<UserData | null>;
}
