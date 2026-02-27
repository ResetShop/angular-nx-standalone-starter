import type { Cradle } from './container.types';

export interface IContainer {
	get cradle(): Cradle;
	resolve<K extends keyof Cradle>(key: K): Cradle[K];
}
