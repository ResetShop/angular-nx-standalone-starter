import { InjectionToken, makeEnvironmentProviders } from '@angular/core'
import { projectConfig } from '@configs/project.config'
import { ProjectConfig } from '@interfaces/project'

export const PROJECT_CONFIG = new InjectionToken<ProjectConfig>('Project Configuration')

export function provideProjectConfig() {
	return makeEnvironmentProviders([{ provide: PROJECT_CONFIG, useValue: projectConfig }])
}

export function provideProjectConfigTesting() {
	return makeEnvironmentProviders([
		{ provide: PROJECT_CONFIG, useValue: { applicationName: 'Testing app' } satisfies ProjectConfig },
	])
}
