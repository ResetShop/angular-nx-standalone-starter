import { TestBed } from '@angular/core/testing'
import { DrawerTracker } from './drawer-tracker'

describe('DrawerTracker', () => {
	let tracker: DrawerTracker

	beforeEach(() => {
		tracker = TestBed.inject(DrawerTracker)
	})

	it('should allow registering a drawer', () => {
		const drawer = {} as never

		expect(() => tracker.register(drawer)).not.toThrow()
	})

	it('should throw when registering a second drawer', () => {
		const first = {} as never
		const second = {} as never
		tracker.register(first)

		expect(() => tracker.register(second)).toThrowError('Only one drawer can be active at a time.')
	})

	it('should allow re-registering after unregistering', () => {
		const drawer = {} as never
		tracker.register(drawer)
		tracker.unregister(drawer)

		expect(() => tracker.register(drawer)).not.toThrow()
	})

	it('should not unregister a different drawer', () => {
		const active = {} as never
		const other = {} as never
		tracker.register(active)
		tracker.unregister(other)

		expect(() => tracker.register({} as never)).toThrowError('Only one drawer can be active at a time.')
	})
})
