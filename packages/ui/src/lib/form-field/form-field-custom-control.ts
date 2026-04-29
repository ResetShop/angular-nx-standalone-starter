import { Directive, signal } from '@angular/core'

@Directive()
export abstract class FormFieldCustomControl {
	public readonly ariaInvalid = signal(false)
}
