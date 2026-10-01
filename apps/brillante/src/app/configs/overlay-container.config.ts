import { type EnvironmentProviders, makeEnvironmentProviders } from '@angular/core'
import { provideComboboxConfig } from 'ng-primitives/combobox'
import { provideSelectConfig } from 'ng-primitives/select'

/**
 * Select and combobox dropdowns are portaled to `<body>` by default. A modal `<dialog>` (the
 * drawers) lives in the browser's top layer, which always paints above `<body>` content, so a
 * dropdown opened inside a drawer would render hidden behind it. While a dialog is open the
 * dropdowns attach inside it; otherwise they attach to `<body>`.
 */
export const OVERLAY_CONTAINER_SELECTOR = 'dialog[open], body:not(:has(dialog[open]))'

export function provideOverlayContainers(): EnvironmentProviders {
	return makeEnvironmentProviders([
		provideSelectConfig({ container: OVERLAY_CONTAINER_SELECTOR }),
		provideComboboxConfig({ container: OVERLAY_CONTAINER_SELECTOR }),
	])
}
