import { Directive, signal } from '@angular/core'

@Directive()
export abstract class FormFieldCustomControl {
	readonly ariaInvalid = signal(false)
}
