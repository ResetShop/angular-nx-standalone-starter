import { InjectionToken } from '@angular/core'

export interface ProjectConfig {
	applicationName: string
}

export const PROJECT_CONFIG = new InjectionToken<ProjectConfig>('Project Configuration')
