import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { PageShell } from '@components/page-shell/page-shell'
import { TranslatePipe } from '@providers/i18n/translate.pipe'
import { type Language, Translation } from '@providers/i18n/translation'

@Component({
	selector: 'app-settings',
	imports: [PageShell, TranslatePipe],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<app-page-shell [title]="'SETTINGS.TITLE' | translate" [loading]="false">
			<p pageDescription>{{ 'SETTINGS.DESCRIPTION' | translate }}</p>

			<div class="max-w-md space-y-6">
				<div class="space-y-2">
					<label for="language-select" class="text-foreground text-sm font-medium">
						{{ 'SETTINGS.LANGUAGE.LABEL' | translate }}
					</label>
					<select
						(change)="onLanguageChange($event)"
						[value]="translation.currentLanguage()"
						id="language-select"
						class="border-input bg-background text-foreground focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
					>
						<option value="en">{{ 'SETTINGS.LANGUAGE.ENGLISH' | translate }}</option>
						<option value="es">{{ 'SETTINGS.LANGUAGE.SPANISH' | translate }}</option>
					</select>
				</div>
			</div>
		</app-page-shell>
	`,
})
export default class Settings {
	protected readonly translation = inject(Translation)

	protected onLanguageChange(event: Event): void {
		const lang = (event.target as HTMLSelectElement).value as Language
		this.translation.setLanguage(lang)
	}
}
