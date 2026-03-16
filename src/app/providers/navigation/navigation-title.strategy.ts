import { inject, Injectable } from '@angular/core'
import { Title } from '@angular/platform-browser'
import { RouterStateSnapshot, TitleStrategy } from '@angular/router'
import { PROJECT_CONFIG } from '@providers/project/project.provider'

@Injectable({ providedIn: 'root' })
export class NavigationTitleStrategy extends TitleStrategy {
	private readonly titleService = inject(Title)
	private readonly projectConfig = inject(PROJECT_CONFIG)

	override updateTitle(routerState: RouterStateSnapshot): void {
		const title = this.buildTitle(routerState)
		const suffix = this.projectConfig.applicationName
		const pageTitle = title ? `${title} | ${suffix}` : suffix
		this.titleService.setTitle(pageTitle)
	}
}
