import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
	selector: 'app-welcome-step1',
	imports: [ReactiveFormsModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<h1 class="mb-4 text-xl font-bold">
			<span>Paso 1: Datos básicos</span>
		</h1>

		<form (ngSubmit)="onSubmit()" [formGroup]="form">
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
								[class.border-red-500]="form.get('projectName')?.invalid && form.get('projectName')?.touched"
								id="project-name"
								formControlName="projectName"
								type="text"
								aria-label="Nombre del proyecto"
								class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
								placeholder="Mi Aplicación"
							/>
							@if (form.get('projectName')?.invalid && form.get('projectName')?.touched) {
								<p class="mt-1 text-sm text-red-600 dark:text-red-400">
									El nombre del proyecto es requerido (mínimo 3 caracteres)
								</p>
							}
						</div>
						<div>
							<label for="project-description" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
								Descripción
							</label>
							<textarea
								id="project-description"
								formControlName="description"
								rows="3"
								aria-label="Descripción del proyecto"
								class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
								placeholder="Descripción de la aplicación..."
							></textarea>
						</div>
					</div>
				</div>

				<div class="flex justify-end gap-2">
					<button
						[disabled]="form.invalid"
						type="submit"
						class="bg-primary hover:bg-primary/90 rounded-md px-4 py-2 text-white disabled:opacity-50"
					>
						Continuar
					</button>
				</div>
			</div>
		</form>
	`,
})
export default class WelcomeStep1 {
	private readonly fb = inject(FormBuilder);

	readonly form = this.fb.group({
		projectName: ['', [Validators.required, Validators.minLength(3)]],
		description: [''],
	});

	onSubmit(): void {
		if (this.form.valid) {
			// TODO: Save to service/state management
			// TODO: Navigate to next step
			console.log('Form data:', this.form.value);
		} else {
			this.form.markAllAsTouched();
		}
	}
}
