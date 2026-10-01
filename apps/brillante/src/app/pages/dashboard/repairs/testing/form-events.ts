import { fireEvent } from '@testing-library/angular'

/**
 * Picks an option of a native select the way a browser does: the value changes, then the control
 * emits `input` and `change`, so every form binding observes the new value.
 */
export function selectOption(select: HTMLElement, value: string): void {
	fireEvent.input(select, { target: { value } })
	fireEvent.change(select, { target: { value } })
}
