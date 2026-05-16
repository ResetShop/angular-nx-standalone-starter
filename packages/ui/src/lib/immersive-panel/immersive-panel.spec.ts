import { Component } from '@angular/core'
import { render, screen } from '@testing-library/angular'
import ImmersivePanel from './immersive-panel'

describe('ImmersivePanel', () => {
	it('should render title template when provided', async () => {
		@Component({
			template: `
				<app-immersive-panel [titleTemplate]="titleTpl">
					<ng-template #titleTpl>Test Title</ng-template>
				</app-immersive-panel>
			`,
			imports: [ImmersivePanel],
		})
		class TestComponent {}

		await render(TestComponent)

		expect(screen.getByText('Test Title')).toBeInTheDocument()
		expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Test Title')
	})

	it('should render subtitle template when provided', async () => {
		@Component({
			template: `
				<app-immersive-panel [subtitleTemplate]="subtitleTpl">
					<ng-template #subtitleTpl>Test Subtitle</ng-template>
				</app-immersive-panel>
			`,
			imports: [ImmersivePanel],
		})
		class TestComponent {}

		await render(TestComponent)

		expect(screen.getByText('Test Subtitle')).toBeInTheDocument()
	})

	it('should render content template when provided', async () => {
		@Component({
			template: `
				<app-immersive-panel [contentTemplate]="contentTpl">
					<ng-template #contentTpl>Test Content</ng-template>
				</app-immersive-panel>
			`,
			imports: [ImmersivePanel],
		})
		class TestComponent {}

		await render(TestComponent)

		expect(screen.getByText('Test Content')).toBeInTheDocument()
	})

	it('should render footer template when provided', async () => {
		@Component({
			template: `
				<app-immersive-panel [footerTemplate]="footerTpl">
					<ng-template #footerTpl>Test Footer</ng-template>
				</app-immersive-panel>
			`,
			imports: [ImmersivePanel],
		})
		class TestComponent {}

		await render(TestComponent)

		expect(screen.getByText('Test Footer')).toBeInTheDocument()
	})

	it('should render all templates when all are provided', async () => {
		@Component({
			template: `
				<app-immersive-panel
					[titleTemplate]="titleTpl"
					[subtitleTemplate]="subtitleTpl"
					[contentTemplate]="contentTpl"
					[footerTemplate]="footerTpl"
				>
					<ng-template #titleTpl>Full Title</ng-template>
					<ng-template #subtitleTpl>Full Subtitle</ng-template>
					<ng-template #contentTpl>Full Content</ng-template>
					<ng-template #footerTpl>Full Footer</ng-template>
				</app-immersive-panel>
			`,
			imports: [ImmersivePanel],
		})
		class TestComponent {}

		await render(TestComponent)

		expect(screen.getByText('Full Title')).toBeInTheDocument()
		expect(screen.getByText('Full Subtitle')).toBeInTheDocument()
		expect(screen.getByText('Full Content')).toBeInTheDocument()
		expect(screen.getByText('Full Footer')).toBeInTheDocument()
	})

	it('should not render title section when neither title nor subtitle templates are provided', async () => {
		@Component({
			template: `
				<app-immersive-panel [contentTemplate]="contentTpl">
					<ng-template #contentTpl>Only Content</ng-template>
				</app-immersive-panel>
			`,
			imports: [ImmersivePanel],
		})
		class TestComponent {}

		await render(TestComponent)

		expect(screen.getByText('Only Content')).toBeInTheDocument()
		expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
	})

	it('should not render content wrapper when no contentTemplate given', async () => {
		@Component({
			template: `
				<app-immersive-panel [titleTemplate]="titleTpl">
					<ng-template #titleTpl>Only Title</ng-template>
				</app-immersive-panel>
			`,
			imports: [ImmersivePanel],
		})
		class TestComponent {}

		await render(TestComponent)

		expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Only Title')
	})

	it('should not render footer wrapper when no footerTemplate given', async () => {
		@Component({
			template: `
				<app-immersive-panel [contentTemplate]="contentTpl">
					<ng-template #contentTpl>Content Only</ng-template>
				</app-immersive-panel>
			`,
			imports: [ImmersivePanel],
		})
		class TestComponent {}

		await render(TestComponent)

		expect(screen.getByText('Content Only')).toBeInTheDocument()
	})

	it('should render with title but no subtitle', async () => {
		@Component({
			template: `
				<app-immersive-panel [titleTemplate]="titleTpl">
					<ng-template #titleTpl>Title Without Subtitle</ng-template>
				</app-immersive-panel>
			`,
			imports: [ImmersivePanel],
		})
		class TestComponent {}

		await render(TestComponent)

		expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Title Without Subtitle')
	})

	it('should render with subtitle but no title', async () => {
		@Component({
			template: `
				<app-immersive-panel [subtitleTemplate]="subtitleTpl">
					<ng-template #subtitleTpl>Subtitle Without Title</ng-template>
				</app-immersive-panel>
			`,
			imports: [ImmersivePanel],
		})
		class TestComponent {}

		await render(TestComponent)

		expect(screen.getByText('Subtitle Without Title')).toBeInTheDocument()
	})

	it('should render empty panel when no templates are provided', async () => {
		const { fixture } = await render(ImmersivePanel)

		expect(fixture.componentInstance).toBeTruthy()
	})
})
