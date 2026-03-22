import { ChangeDetectionStrategy, Component } from '@angular/core'
import NavigationCard from '@components/navigation-card/navigation-card'
import { provideIcons } from '@ng-icons/core'
import { featherKey, featherShield } from '@ng-icons/feather-icons'

@Component({
	selector: 'app-authorization-home',
	imports: [NavigationCard],
	viewProviders: [provideIcons({ featherShield, featherKey })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="space-y-4">
			<h2 class="text-foreground text-lg font-semibold">Autorización</h2>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<app-navigation-card
					[icons]="rolesIcon"
					route="/dashboard/authorization/roles"
					name="Roles"
					description="Define roles y asigna permisos para controlar el acceso a la plataforma."
				/>
				<app-navigation-card
					[icons]="permissionsIcon"
					route="/dashboard/authorization/permissions"
					name="Permisos"
					description="Consulta y gestiona las definiciones de permisos disponibles en el sistema."
				/>
			</div>
		</div>
	`,
})
export default class AuthorizationHome {
	protected readonly rolesIcon: Record<string, string> = { featherShield }
	protected readonly permissionsIcon: Record<string, string> = { featherKey }
}
