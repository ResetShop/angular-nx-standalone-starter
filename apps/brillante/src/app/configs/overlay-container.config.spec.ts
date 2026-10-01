import { TestBed } from '@angular/core/testing'
import { injectSelectConfig } from 'ng-primitives/select'
import { OVERLAY_CONTAINER_SELECTOR, provideOverlayContainers } from './overlay-container.config'

describe('overlay container config', () => {
	afterEach(() => {
		document.body.innerHTML = ''
	})

	it('attaches dropdowns to the body while no dialog is open', () => {
		document.body.innerHTML = '<dialog></dialog>'

		expect(document.querySelector(OVERLAY_CONTAINER_SELECTOR)).toBe(document.body)
	})

	it('attaches dropdowns inside the open dialog so they paint above its top layer', () => {
		document.body.innerHTML = '<dialog id="drawer" open></dialog>'

		expect(document.querySelector(OVERLAY_CONTAINER_SELECTOR)).toBe(document.getElementById('drawer'))
	})

	it('registers the selector as the default select dropdown container', () => {
		TestBed.configureTestingModule({ providers: [provideOverlayContainers()] })

		expect(TestBed.runInInjectionContext(() => injectSelectConfig().container)).toBe(OVERLAY_CONTAINER_SELECTOR)
	})
})
