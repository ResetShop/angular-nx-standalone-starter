import { createContainer, InjectionMode } from 'awilix';

/**
 * Awilix Dependency Injection Container
 *
 * Using CLASSIC injection mode for:
 * - Better performance than PROXY mode
 * - No minification in server-side code
 * - Dependencies resolved via constructor parameter names
 *
 * Constructor signature pattern for CLASSIC mode:
 * ```typescript
 * class MyService {
 *   constructor({ dep1, dep2 }: { dep1: Dep1; dep2: Dep2 }) {
 *     this.dep1 = dep1;
 *     this.dep2 = dep2;
 *   }
 * }
 * ```
 */
export const container = createContainer({
	injectionMode: InjectionMode.CLASSIC,
	strict: true,
});
