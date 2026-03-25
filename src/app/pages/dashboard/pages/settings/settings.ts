import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { FormField } from '@components/form-field/form-field'
import { PageShell } from '@components/page-shell/page-shell'
import { Select } from '@components/select/select'
import type { SelectOption } from '@components/select/select-option'
import { TranslatePipe } from '@providers/i18n/translate.pipe'
import { type Language, Translation } from '@providers/i18n/translation'

@Component({
	selector: 'app-settings',
	imports: [PageShell, TranslatePipe, FormField, Select],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<app-page-shell [title]="'SETTINGS.TITLE' | translate" [loading]="false">
			<p pageDescription>{{ 'SETTINGS.DESCRIPTION' | translate }}</p>

			<div class="max-w-md space-y-6">
				<app-form-field [label]="'SETTINGS.LANGUAGE.LABEL' | translate">
					<app-select
						(valueChange)="onLanguageChange($event)"
						[options]="languageOptions()"
						[value]="translation.currentLanguage()"
					/>
				</app-form-field>
			</div>
		</app-page-shell>
	`,
})
export default class Settings {
	protected readonly translation = inject(Translation)

	protected readonly languageOptions = computed<SelectOption[]>(() => [
		{ value: 'en', label: this.translation.instant('SETTINGS.LANGUAGE.ENGLISH') },
		{ value: 'es', label: this.translation.instant('SETTINGS.LANGUAGE.SPANISH') },
	])

	protected onLanguageChange(lang: string): void {
		this.translation.setLanguage(lang as Language)
	}
}
