import { computed, Injectable, signal } from '@angular/core';

@Injectable({
	providedIn: 'root',
})
export class Navigation {
	private readonly _sections = signal([
		{
			id: 'settings',
			name: 'Ajustes y mantenimiento',
			routes: [
				{
					id: 'welcome',
					name: 'Configuración inicial',
					route: 'welcome',
					icon: 'featherHome',
					children: [],
				},
				{
					id: 'health',
					name: 'Salud',
					route: 'health',
					icon: 'featherActivity',
					children: [],
				},
			],
		},
	]);

	readonly sections = computed(() => this._sections());
}
