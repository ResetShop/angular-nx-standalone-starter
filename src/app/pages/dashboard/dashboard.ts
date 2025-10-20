import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '@components/sidebar/sidebar';

@Component({
	selector: 'app-dashboard',
	imports: [RouterOutlet, Sidebar],
	template: ` <aside class="border-r-1 border-gray-200">
			<app-sidebar />
		</aside>
		<nav class="border-b-1 border-gray-200">Header</nav>
		<main class="">
			<article>Content</article>
			<router-outlet />
		</main>`,
	styles: `
		:host {
			@reference "tailwindcss";
			@apply grid h-svh;
			grid-template-columns: 240px 1fr;
			grid-template-rows: 64px 1fr;
			grid-template-areas:
				'aside nav nav'
				'aside main main';
		}

		main {
			grid-area: main;
		}

		aside {
			grid-area: aside;
		}

		nav {
			grid-area: nav;
		}

		article {
			grid-area: article;
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Dashboard {}
