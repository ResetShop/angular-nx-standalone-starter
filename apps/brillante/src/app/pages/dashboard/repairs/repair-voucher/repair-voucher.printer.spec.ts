import { DOCUMENT } from '@angular/common'
import { TestBed } from '@angular/core/testing'
import { mapRepairDto } from '@domain/repair/repair.mapper'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import {
	advanceTimersByTime,
	clearAllMocks,
	fn,
	type MockFn,
	useFakeTimers,
	useRealTimers,
} from '@resetshop/util/test-utils'
import { createMockRepairDto } from '../repair.mock'
import { repairsTranslation } from '../testing/repairs-translation.mock'
import { RepairVoucherPrinter } from './repair-voucher.printer'

interface FakeFrame {
	style: { cssText: string }
	srcdoc: string
	onload: (() => void) | null
	contentWindow: { addEventListener: MockFn; focus: MockFn; print: MockFn } | null
	setAttribute: MockFn
	remove: MockFn
}

describe('RepairVoucherPrinter', () => {
	let frame: FakeFrame
	let appendChild: MockFn
	let language: 'en' | 'es'

	function setup(): RepairVoucherPrinter {
		TestBed.configureTestingModule({
			providers: [
				{
					provide: DOCUMENT,
					useValue: { createElement: () => frame, body: { appendChild } },
				},
				{ provide: Translation, useValue: { ...repairsTranslation, getCurrentLanguage: () => language } },
			],
		})
		return TestBed.inject(RepairVoucherPrinter)
	}

	beforeEach(() => {
		clearAllMocks()
		useFakeTimers()
		language = 'en'
		appendChild = fn()
		frame = {
			style: { cssText: '' },
			srcdoc: '',
			onload: null,
			contentWindow: { addEventListener: fn(), focus: fn(), print: fn() },
			setAttribute: fn(),
			remove: fn(),
		}
	})

	afterEach(() => useRealTimers())

	const repair = () => ({ ...mapRepairDto(createMockRepairDto({ id: 9 })), note: 'Cambio de pantalla' })

	it('renders the translated voucher into a hidden frame attached to the page', () => {
		setup().print(repair(), new Date(2024, 5, 10, 15, 30))

		expect(appendChild.calls[0][0]).toBe(frame)
		expect(frame.setAttribute.calls).toContainEqual(['aria-hidden', 'true'])
		expect(frame.srcdoc).toContain('TECHNICAL SERVICE')
		expect(frame.srcdoc).toContain('Cambio de pantalla')
		expect(frame.srcdoc).toContain('lang="en-US"')
	})

	it('uses the Argentine locale when the language is Spanish', () => {
		language = 'es'

		setup().print(repair())

		expect(frame.srcdoc).toContain('lang="es-AR"')
	})

	it('prints once the frame has loaded and removes it afterwards', () => {
		setup().print(repair())
		const view = frame.contentWindow

		frame.onload?.()

		expect(view?.focus.calls).toHaveLength(1)
		expect(view?.print.calls).toHaveLength(1)
		const [eventName, handler] = view?.addEventListener.calls[0] as [string, () => void]
		expect(eventName).toBe('afterprint')
		handler()
		expect(frame.remove.calls).toHaveLength(1)
	})

	it('removes the frame after a while when the browser never reports the end of printing', () => {
		setup().print(repair())
		frame.onload?.()

		advanceTimersByTime(60_000)

		expect(frame.remove.calls).toHaveLength(1)
	})

	it('removes the frame without printing when it has no window', () => {
		setup().print(repair())
		frame.contentWindow = null

		frame.onload?.()

		expect(frame.remove.calls).toHaveLength(1)
	})
})
