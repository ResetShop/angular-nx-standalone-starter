import { effect, inject, Injectable, untracked } from '@angular/core'
import { Title } from '@angular/platform-browser'
import { RouterStateSnapshot, TitleStrategy } from '@angular/router'
import { Translation } from '../i18n/translation'
import type { TranslationKey } from '../i18n/translations.schema'
import { PROJECT_CONFIG } from '../interfaces/project'

@Injectable({ providedIn: 'root' })
export class NavigationTitleStrategy extends TitleStrategy {
	private readonly titleService = inject(Title)
	private readonly projectConfig = inject(PROJECT_CONFIG)
	private readonly translation = inject(Translation)

	private lastRouterState: RouterStateSnapshot | null = null

	// Re-applies the document title when the active language changes between
	// navigations — without this, the tab title stays frozen in whichever
	// language was active at the last route change.
	private readonly languageChangeEffect = effect(() => {
		this.translation.currentLanguage()
		untracked(() => {
			if (this.lastRouterState) {
				this.applyTitle(this.lastRouterState)
			}
		})
	})

	public override updateTitle(routerState: RouterStateSnapshot): void {
		this.lastRouterState = routerState
		this.applyTitle(routerState)
	}

	private applyTitle(routerState: RouterStateSnapshot): void {
		const titleKey = this.buildTitle(routerState)
		const translated = titleKey ? this.translation.instant(titleKey as TranslationKey) : ''
		const suffix = this.projectConfig.applicationName
		const pageTitle = translated ? `${translated} | ${suffix}` : suffix
		this.titleService.setTitle(pageTitle)
	}
}
