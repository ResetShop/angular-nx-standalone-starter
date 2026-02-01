import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'app-welcome-step1',
	imports: [],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<h1 class="mb-4 text-xl font-bold">
			<span>Paso 1: Datos básicos</span>
		</h1>
		<div class="space-y-4">
			<p class="text-gray-600 dark:text-gray-400">Configure los datos básicos de su aplicación.</p>

			<div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
				<h2 class="mb-4 text-lg font-semibold">Información del proyecto</h2>
				<div class="space-y-4">
					<div>
						<label for="project-name" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
							Nombre del proyecto
						</label>
						<input
							id="project-name"
							name="projectName"
							type="text"
							aria-label="Nombre del proyecto"
							class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
							placeholder="Mi Aplicación"
						/>
					</div>
					<div>
						<label for="project-description" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
							Descripción
						</label>
						<textarea
							id="project-description"
							name="description"
							rows="3"
							aria-label="Descripción del proyecto"
							class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
							placeholder="Descripción de la aplicación..."
						></textarea>
					</div>
				</div>
			</div>
		</div>
	`,
})
export default class WelcomeStep1 {}
