import type { Cradle } from './container.types';

export abstract class BaseContainer {
	abstract get cradle(): Cradle;
	abstract resolve<K extends keyof Cradle>(key: K): Cradle[K];
}
