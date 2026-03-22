import { ChangeDetectionStrategy, Component } from '@angular/core'
import NavigationCard from '@components/navigation-card/navigation-card'
import { featherKey, featherShield } from '@ng-icons/feather-icons'

@Component({
	selector: 'app-authorization-home',
	imports: [NavigationCard],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="space-y-4">
			<h2 class="text-foreground text-lg font-semibold">Autorización</h2>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<app-navigation-card
					[icon]="rolesIcon"
					route="/dashboard/authorization/roles"
					name="Roles"
					description="Define roles y asigna permisos para controlar el acceso a la plataforma."
				/>
				<app-navigation-card
					[icon]="permissionsIcon"
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
