import { FormControl } from '@angular/forms';

/**
 * Angular reactive form interface for login form.
 * This is Angular-specific (uses FormControl) and cannot be shared with backend.
 */
export interface LoginForm {
	email: FormControl<string>;
	password: FormControl<string>;
}
