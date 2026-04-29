import { TestBed } from '@angular/core/testing'
import { ConfirmDialogTracker } from './confirm-dialog-tracker'

describe('ConfirmDialogTracker', () => {
	let tracker: ConfirmDialogTracker

	beforeEach(() => {
		tracker = TestBed.inject(ConfirmDialogTracker)
	})

	it('should allow registering a dialog', () => {
		const dialog = {} as never

		expect(() => tracker.register(dialog)).not.toThrow()
	})

	it('should throw when registering a second dialog', () => {
		const first = {} as never
		const second = {} as never
		tracker.register(first)

		expect(() => tracker.register(second)).toThrowError('Only one confirm dialog can be active at a time.')
	})

	it('should allow re-registering after unregistering', () => {
		const dialog = {} as never
		tracker.register(dialog)
		tracker.unregister(dialog)

		expect(() => tracker.register(dialog)).not.toThrow()
	})

	it('should not unregister a different dialog', () => {
		const active = {} as never
		const other = {} as never
		tracker.register(active)
		tracker.unregister(other)

		expect(() => tracker.register({} as never)).toThrowError('Only one confirm dialog can be active at a time.')
	})
})
