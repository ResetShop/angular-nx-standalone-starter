import { provideRouter } from '@angular/router'
import { featherKey, featherShield, featherUsers } from '@ng-icons/feather-icons'
import type { Meta, StoryObj } from '@storybook/angular'
import { applicationConfig } from '@storybook/angular'
import NavigationCard from './navigation-card'

const meta: Meta<NavigationCard> = {
	component: NavigationCard,
	title: 'Components/NavigationCard',
	tags: ['autodocs'],
	decorators: [
		applicationConfig({
			providers: [provideRouter([{ path: '**', component: NavigationCard }])],
		}),
	],
	parameters: {
		docs: {
			description: {
				component: `
A clickable card for navigating to child routes, following the Supabase CardButton pattern.

## Features

- **Horizontal layout**: Icon on the left, text stacking on the right
- **Chevron indicator**: Slides left on hover with color brightening
- **Subtle hover**: Background shifts, border strengthens, icon scales up
- **Lazy icon loading**: Icons are registered in a per-card child injector via \`createEnvironmentInjector\`, matching the sidebar's lazy loading pattern

## Usage

\`\`\`html
<app-navigation-card
  route="/dashboard/users"
  name="Users"
  description="Manage user accounts and access"
  [icon]="{ featherUsers }"
/>
\`\`\`
				`,
			},
			canvas: {
				sourceState: 'shown',
			},
		},
	},
}

export default meta

type Story = StoryObj<NavigationCard>

/**
 * A single navigation card with an icon.
 */
export const Default: Story = {
	render: () => ({
		props: { icon: { featherUsers } },
		template: `
			<div class="max-w-sm">
				<app-navigation-card
					route="/dashboard/users"
					name="Users"
					description="Manage user accounts, roles, and permissions for your application."
					[icon]="icon"
				/>
			</div>
		`,
	}),
}

/**
 * A card without an icon — the content fills the full width.
 */
export const WithoutIcon: Story = {
	render: () => ({
		template: `
			<div class="max-w-sm">
				<app-navigation-card
					route="/dashboard/health"
					name="Health"
					description="Monitor the health and status of your application services."
				/>
			</div>
		`,
	}),
}

/**
 * A deck of cards in a responsive grid, demonstrating the parent page composition pattern.
 */
export const CardDeck: Story = {
	render: () => ({
		props: {
			usersIcon: { featherUsers },
			rolesIcon: { featherShield },
			permissionsIcon: { featherKey },
		},
		template: `
			<div class="space-y-4">
				<div>
					<h3 class="text-sm font-semibold text-foreground mb-3">Light</h3>
					<div class="bg-background p-4 rounded border border-border">
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							<app-navigation-card
								route="/dashboard/users"
								name="Users"
								description="Manage user accounts, roles, and permissions for your application."
								[icon]="usersIcon"
							/>
							<app-navigation-card
								route="/dashboard/authorization/roles"
								name="Roles"
								description="Define roles and assign permissions to control access across the platform."
								[icon]="rolesIcon"
							/>
							<app-navigation-card
								route="/dashboard/authorization/permissions"
								name="Permissions"
								description="View and manage the granular permission definitions available in the system."
								[icon]="permissionsIcon"
							/>
						</div>
					</div>
				</div>
				<div>
					<h3 class="text-sm font-semibold text-foreground mb-3">Dark</h3>
					<div class="dark bg-background p-4 rounded border border-border">
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							<app-navigation-card
								route="/dashboard/users"
								name="Users"
								description="Manage user accounts, roles, and permissions for your application."
								[icon]="usersIcon"
							/>
							<app-navigation-card
								route="/dashboard/authorization/roles"
								name="Roles"
								description="Define roles and assign permissions to control access across the platform."
								[icon]="rolesIcon"
							/>
							<app-navigation-card
								route="/dashboard/authorization/permissions"
								name="Permissions"
								description="View and manage the granular permission definitions available in the system."
								[icon]="permissionsIcon"
							/>
						</div>
					</div>
				</div>
			</div>
		`,
	}),
}
