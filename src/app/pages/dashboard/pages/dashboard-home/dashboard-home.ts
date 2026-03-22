import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import NavigationCard from '@components/navigation-card/navigation-card'
import { Navigation } from '@providers/navigation/navigation'

@Component({
	selector: 'app-dashboard-home',
	imports: [NavigationCard],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="space-y-8">
			@for (section of navigation.sections(); track section.id) {
				<section>
					@if (section.name) {
						<h2 class="text-foreground mb-4 text-lg font-semibold">{{ section.name }}</h2>
					}
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						@for (route of section.routes; track route.id) {
							<app-navigation-card
								[route]="'/' + route.route"
								[name]="route.name"
								[description]="getDescription(route.id)"
								[icon]="route.icon"
							/>
						}
					</div>
				</section>
			}
		</div>
	`,
})
export default class DashboardHome {
	protected readonly navigation = inject(Navigation)

	protected getDescription(routeId: string): string {
		const descriptions: Record<string, string> = {
			welcome: 'Guía de configuración inicial para preparar tu aplicación.',
			health: 'Monitorea el estado y la salud de los servicios de tu aplicación.',
			users: 'Gestiona las cuentas de usuario, sus roles y permisos de acceso.',
			authorization: 'Administra los roles y permisos que controlan el acceso a la plataforma.',
		}
		return descriptions[routeId] ?? ''
	}
}
