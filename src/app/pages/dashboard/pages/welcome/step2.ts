import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'app-welcome-step2',
	imports: [],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<h1 class="mb-4 text-xl font-bold">
			<span>Paso 2: Configuración</span>
		</h1>
		<div class="space-y-4">
			<p class="text-gray-600 dark:text-gray-400">Configure las opciones avanzadas de su aplicación.</p>

			<div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
				<h2 class="mb-4 text-lg font-semibold">Opciones de configuración</h2>
				<div class="space-y-4">
					<div class="flex items-center">
						<input type="checkbox" id="analytics" class="text-primary h-4 w-4 rounded border-gray-300" />
						<label for="analytics" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
							Habilitar Analytics
						</label>
					</div>
					<div class="flex items-center">
						<input type="checkbox" id="darkmode" class="text-primary h-4 w-4 rounded border-gray-300" />
						<label for="darkmode" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
							Modo oscuro por defecto
						</label>
					</div>
					<div class="flex items-center">
						<input type="checkbox" id="notifications" class="text-primary h-4 w-4 rounded border-gray-300" />
						<label for="notifications" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
							Habilitar notificaciones
						</label>
					</div>
				</div>
			</div>
		</div>
	`,
})
export default class WelcomeStep2 {}
