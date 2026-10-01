import { Component, computed, effect, inject, signal, untracked } from '@angular/core'
import { form, FormField as SignalFormField } from '@angular/forms/signals'
import { PageShell } from '@components/page-shell/page-shell'
import { Permission } from '@contracts/permission/permission.constants'
import { featherList, featherMapPin, featherUsers } from '@ng-icons/feather-icons'
import type { AppTranslationKey } from '@providers/i18n/app-translations'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { type Language, Translation } from '@resetshop/angular-core/i18n/translation'
import { FormField } from '@resetshop/ui/form-field/form-field'
import NavigationCard from '@resetshop/ui/navigation-card/navigation-card'
import { Select } from '@resetshop/ui/select/select'
import type { SelectOption } from '@resetshop/ui/select/select-option'
import { AuthStore } from '@store/auth/auth.store'

interface SettingsCard {
	readonly id: string
	readonly route: string
	readonly icon: Record<string, string>
	readonly titleKey: AppTranslationKey
	readonly descriptionKey: AppTranslationKey
	/** Permission required to see the card; omitted for sections every signed-in user may open. */
	readonly permission?: Permission
}

interface SettingsForm {
	language: string
}

@Component({
	selector: 'app-settings-home',
	imports: [PageShell, TranslatePipe, NavigationCard, FormField, SignalFormField, Select],
	template: `
		<app-page-shell [title]="'SETTINGS.TITLE' | translate" [loading]="false">
			<p pageDescription>{{ 'SETTINGS.DESCRIPTION' | translate }}</p>

			<section aria-labelledby="settings-sections-title">
				<h2 id="settings-sections-title" class="text-foreground mb-4 text-lg font-semibold">
					{{ 'SETTINGS_HOME.SECTIONS_TITLE' | translate }}
				</h2>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					@for (card of visibleCards(); track card.id) {
						<app-navigation-card
							[route]="card.route"
							[name]="card.titleKey | translate"
							[description]="card.descriptionKey | translate"
							[icon]="card.icon"
						/>
					}
				</div>
			</section>

			<section aria-labelledby="settings-preferences-title" class="max-w-md space-y-6">
				<h2 id="settings-preferences-title" class="text-foreground text-lg font-semibold">
					{{ 'SETTINGS_HOME.LANGUAGE_TITLE' | translate }}
				</h2>
				<app-form-field [label]="'SETTINGS.LANGUAGE.LABEL' | translate">
					<app-select [formField]="settingsForm.language" [options]="languageOptions()" />
				</app-form-field>
			</section>
		</app-page-shell>
	`,
})
export default class SettingsHome {
	private readonly translation = inject(Translation)
	private readonly authStore = inject(AuthStore)

	private readonly cards: readonly SettingsCard[] = [
		{
			id: 'office-branches',
			route: '/dashboard/settings/office-branches',
			icon: { featherMapPin },
			titleKey: 'SETTINGS_HOME.CARDS.OFFICE_BRANCHES.TITLE',
			descriptionKey: 'SETTINGS_HOME.CARDS.OFFICE_BRANCHES.DESCRIPTION',
		},
		{
			id: 'user-management',
			route: '/dashboard/settings/user-management',
			icon: { featherUsers },
			titleKey: 'SETTINGS_HOME.CARDS.USER_MANAGEMENT.TITLE',
			descriptionKey: 'SETTINGS_HOME.CARDS.USER_MANAGEMENT.DESCRIPTION',
			permission: Permission.SETTINGS_USERS_MANAGE,
		},
		{
			id: 'concepts',
			route: '/dashboard/settings/concepts',
			icon: { featherList },
			titleKey: 'SETTINGS_HOME.CARDS.CASH_CONCEPTS.TITLE',
			descriptionKey: 'SETTINGS_HOME.CARDS.CASH_CONCEPTS.DESCRIPTION',
			permission: Permission.SETTINGS_CASH_CONCEPTS_MANAGE,
		},
	]

	protected readonly visibleCards = computed(() => {
		const user = this.authStore.currentUser()
		return this.cards.filter((card) => !card.permission || user?.hasPermission(card.permission))
	})

	private readonly model = signal<SettingsForm>({ language: this.translation.currentLanguage() })
	protected readonly settingsForm = form(this.model)

	protected readonly languageOptions = computed<SelectOption[]>(() => [
		{ value: 'en', label: this.translation.instant('SETTINGS.LANGUAGE.ENGLISH') },
		{ value: 'es', label: this.translation.instant('SETTINGS.LANGUAGE.SPANISH') },
	])

	protected readonly syncLanguageEffect = effect(() => {
		const language = this.model().language
		untracked(() => {
			if (language !== this.translation.currentLanguage()) {
				void this.translation.setLanguage(language as Language)
			}
		})
	})
}
