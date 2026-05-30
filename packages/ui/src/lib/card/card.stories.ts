import { Component } from '@angular/core'
import type { Meta, StoryObj } from '@storybook/angular'
import Card from './card'

@Component({
	selector: 'app-story-card-host',
	standalone: true,
	imports: [Card],
	template: `
		<div class="max-w-md">
			<app-card
				[titleTemplate]="title"
				[subtitleTemplate]="subtitle"
				[contentTemplate]="content"
				[footerTemplate]="footer"
			>
				<ng-template #title>Card title</ng-template>
				<ng-template #subtitle>Section heading</ng-template>
				<ng-template #content>
					<p>This is the body content of the card. It can hold any markup the consumer projects via the template.</p>
				</ng-template>
				<ng-template #footer>
					<button type="button" class="text-primary text-sm font-semibold">Primary action</button>
				</ng-template>
			</app-card>
		</div>
	`,
})
class CardStoryHostComponent {}

const meta: Meta<CardStoryHostComponent> = {
	title: 'UI / Card',
	component: CardStoryHostComponent,
	tags: ['autodocs'],
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'`Card` is a layout container with optional title, subtitle, content, and footer slots. ' +
					'Each slot is a `TemplateRef` input, allowing consumers to project arbitrary markup. ' +
					'Use this story as a reference for the wrapper pattern needed when authoring stories for any component that takes `TemplateRef` inputs.',
			},
		},
	},
}

export default meta
type Story = StoryObj<CardStoryHostComponent>

export const Default: Story = {}

/**
 * Mobile-viewport rendering. Card padding tightens from `p-4` (default) to `p-3` below `sm:`. Pick a
 * non-mobile viewport (or resize) to see the `p-4`/`p-5` desktop padding.
 */
export const MobileViewport: Story = {
	parameters: {
		viewport: { defaultViewport: 'mobile' },
		docs: { canvas: { sourceState: 'shown' } },
	},
}
