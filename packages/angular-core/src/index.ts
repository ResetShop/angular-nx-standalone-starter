// @resetshop/angular-core — Angular framework infrastructure
// Consumers should prefer deep imports for tree-shaking: '@resetshop/angular-core/i18n/translation'

// Breakpoint
export { createBreakpointSignal, type BreakpointDirection, type BreakpointName } from './lib/breakpoint/breakpoint'

// i18n
export { TranslatePipe } from './lib/i18n/translate.pipe'
export {
	DEFAULT_LANGUAGE,
	TRANSLATION_LOADER,
	Translation,
	type Language,
	type TranslationLoaderFn,
} from './lib/i18n/translation'
export { initializeTranslation } from './lib/i18n/translation.initializer'
export { provideTranslation, type TranslationProviderConfig } from './lib/i18n/translation.provider'
export { type TranslationKey, type TranslationSchema } from './lib/i18n/translations.schema'

// Theme
export { Theme, provideTheme } from './lib/theme/theme'
export { ThemeProvider } from './lib/theme/theme.abstract'
export { ThemeMock, provideMockTheme } from './lib/theme/theme.mock'

// Navigation
export { NAVIGATION_PERMISSION_CHECK, Navigation } from './lib/navigation/navigation'
export { NavigationState } from './lib/navigation/navigation-state'
export { NavigationTitleStrategy } from './lib/navigation/navigation-title.strategy'
export { NavigationMock, provideNavigationMock } from './lib/navigation/navigation.mock'
export { provideNavigation, provideNavigationConfig } from './lib/navigation/navigation.provider'

// Interfaces
export { NAVIGATION_CONFIG, isLeafRoute, isParentRoute } from './lib/interfaces/navigation'
export type {
	BreadcrumbItem,
	LeafNavigationRoute,
	NamedRoute,
	NavigationConfig,
	NavigationRoute,
	NavigationSection,
	ParentNavigationRoute,
} from './lib/interfaces/navigation'
export { PROJECT_CONFIG, type ProjectConfig } from './lib/interfaces/project'

// Logger
export { Logger } from './lib/logger/logger.token'

// Store utilities
export { extractErrorMessage } from './lib/store/extract-error-message'
