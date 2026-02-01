import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

@Component({
	selector: 'app-welcome-step2',
	imports: [ReactiveFormsModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<h1 class="mb-4 text-xl font-bold">
			<span>Paso 2: Configuración</span>
		</h1>

		<form (ngSubmit)="onSubmit()" [formGroup]="form">
			<div class="space-y-4">
				<p class="text-gray-600 dark:text-gray-400">Configure las opciones avanzadas de su aplicación.</p>

				<div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
					<h2 class="mb-4 text-lg font-semibold">Opciones de configuración</h2>
					<div class="space-y-4">
						<div class="flex items-center">
							<input
								type="checkbox"
								id="analytics"
								formControlName="analytics"
								aria-label="Habilitar Analytics"
								class="text-primary h-4 w-4 rounded border-gray-300"
							/>
							<label for="analytics" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
								Habilitar Analytics
							</label>
						</div>
						<div class="flex items-center">
							<input
								type="checkbox"
								id="darkmode"
								formControlName="darkMode"
								aria-label="Modo oscuro por defecto"
								class="text-primary h-4 w-4 rounded border-gray-300"
							/>
							<label for="darkmode" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
								Modo oscuro por defecto
							</label>
						</div>
						<div class="flex items-center">
							<input
								type="checkbox"
								id="notifications"
								formControlName="notifications"
								aria-label="Habilitar notificaciones"
								class="text-primary h-4 w-4 rounded border-gray-300"
							/>
							<label for="notifications" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
								Habilitar notificaciones
							</label>
						</div>
					</div>
				</div>

				<div class="flex justify-end gap-2">
					<button type="submit" class="bg-primary hover:bg-primary/90 rounded-md px-4 py-2 text-white">
						Continuar
					</button>
				</div>
			</div>
		</form>
	`,
})
export default class WelcomeStep2 {
	private readonly fb = inject(FormBuilder);

	readonly form = this.fb.group({
		analytics: [false],
		darkMode: [false],
		notifications: [false],
	});

	onSubmit(): void {
		// TODO: Save to service/state management
		// TODO: Navigate to next step or final submission
		console.log('Form data:', this.form.value);
	}
}
