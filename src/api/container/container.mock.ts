import { Container } from './container';
import { BaseContainer } from './container.base';
import type { Cradle } from './container.types';

/**
 * Type that allows partial implementations of each service in the Cradle.
 * Useful for tests where you only need to mock specific methods.
 */
export type MockCradle = {
	[K in keyof Cradle]?: Partial<Cradle[K]>;
};

export class MockContainer extends BaseContainer {
	constructor(private readonly mockCradle: MockCradle) {
		super();
	}

	/**
	 * Activates the mock container for tests.
	 * Only the services you provide will be mocked;
	 * accessing unmocked services will throw an error to catch missing mocks early.
	 */
	static activate(cradle: MockCradle): void {
		Container.setActive(new MockContainer(cradle));
	}

	/**
	 * Deactivates the mock container, restoring the default production container.
	 * Call this in afterEach to ensure clean state.
	 */
	static deactivate(): void {
		Container.resetActive();
	}

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
