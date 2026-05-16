import { Component } from '@angular/core'
import type { Meta, StoryObj } from '@storybook/angular'
import ImmersivePanel from './immersive-panel'

@Component({
	selector: 'app-immersive-panel-story-host',
	standalone: true,
	imports: [ImmersivePanel],
	template: `
		<div class="h-[667px] w-[375px] sm:flex sm:h-auto sm:w-auto sm:items-center sm:justify-center sm:p-8">
			<div class="h-full sm:h-[420px] sm:w-[420px]">
				<app-immersive-panel [titleTemplate]="title" [contentTemplate]="content" [footerTemplate]="footer">
					<ng-template #title>Panel Title</ng-template>
					<ng-template #content>
						<p>
							This is the body content of the immersive panel. Below the sm: breakpoint it fills the viewport with no
							card chrome. From sm: up it renders as a centred card with border, rounded corners, and shadow.
						</p>
					</ng-template>
					<ng-template #footer>
						<button type="button" class="text-primary text-sm font-semibold">Primary action</button>
					</ng-template>
				</app-immersive-panel>
			</div>
		</div>
	`,
})
class ImmersivePanelStoryHostComponent {}

@Component({
	selector: 'app-immersive-panel-minimal-host',
	standalone: true,
	imports: [ImmersivePanel],
	template: `
		<div class="h-[667px] w-[375px] sm:flex sm:h-auto sm:w-auto sm:items-center sm:justify-center sm:p-8">
			<div class="h-full sm:h-[420px] sm:w-[420px]">
				<app-immersive-panel [contentTemplate]="content">
					<ng-template #content>
						<p>Content-only panel — no title or footer slots populated.</p>
					</ng-template>
				</app-immersive-panel>
			</div>
		</div>
	`,
})
class ImmersivePanelMinimalHostComponent {}

const meta: Meta<ImmersivePanelStoryHostComponent> = {
	title: 'UI / Immersive Panel',
	component: ImmersivePanelStoryHostComponent,
	tags: ['autodocs'],
	parameters: {
		layout: 'fullscreen',
		viewport: { defaultViewport: 'mobile' },
		docs: {
			description: {
				component:
					'`ImmersivePanel` is a layout container with the same template-input API as `Card` ' +
					'(`titleTemplate`, `subtitleTemplate`, `contentTemplate`, `footerTemplate`) but with responsive chrome. ' +
					'Below the `sm:` breakpoint the panel renders full-height and chromeless (no border, no rounded corners, no shadow). ' +
					'From `sm:` up, card chrome activates — pixel-identical to `Card`. ' +
					'Use for single-panel full-page layouts where the panel IS the page on mobile (e.g. auth pages).',
			},
		},
	},
}

export default meta
type Story = StoryObj<ImmersivePanelStoryHostComponent>

export const Default: Story = {}

export const Desktop: Story = {
	parameters: {
		viewport: { defaultViewport: 'desktop' },
	},
}

export const Minimal: Story = {
	render: () => ({
		moduleMetadata: { imports: [ImmersivePanelMinimalHostComponent] },
		template: `<app-immersive-panel-minimal-host />`,
	}),
}
