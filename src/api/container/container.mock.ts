import type { IContainer } from './container.base';
import type { Cradle } from './container.types';

/**
 * Type that allows partial implementations of each service in the Cradle.
 * Useful for tests where you only need to mock specific methods.
 */
type MockCradle = {
	[K in keyof Cradle]?: Partial<Cradle[K]>;
};

export class MockContainer implements IContainer {
	constructor(private readonly mockCradle: MockCradle) {}

	get cradle(): Cradle {
		return new Proxy(this.mockCradle as Cradle, {
			get(target, prop: string | symbol) {
				if (prop in target) {
					return target[prop as keyof Cradle];
				}
				throw new Error(`Test mock missing for service: ${String(prop)}`);
			},
		});
	}

	resolve<K extends keyof Cradle>(key: K): Cradle[K] {
		if (key in this.mockCradle) {
			return this.mockCradle[key] as Cradle[K];
		}
		throw new Error(`Test mock missing for service: ${String(key)}`);
	}
}
