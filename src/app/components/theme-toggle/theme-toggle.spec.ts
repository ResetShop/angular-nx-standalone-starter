import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { signal } from '@angular/core';
import { ThemeToggle } from './theme-toggle';
import { Theme } from '@providers/theme/theme';

const createMockThemeService = (isDark: boolean) => ({
	isDarkMode: signal(isDark),
	toggleTheme: () => {},
	setTheme: () => {},
	applyTheme: () => {},
});

describe('ThemeToggle', () => {
	it('should render the theme toggle button', async () => {
		const toggleCalled = { value: false };
		const mockThemeService = {
			isDarkMode: signal(false),
			toggleTheme: () => {
				toggleCalled.value = true;
			},
			setTheme: () => {},
			applyTheme: () => {},
		};
		await render(ThemeToggle, {
			providers: [{ provide: Theme, useValue: mockThemeService }],
		});

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});

	it('should display sun icon when in light mode', async () => {
		const mockThemeService = createMockThemeService(false);
		await render(ThemeToggle, {
			providers: [{ provide: Theme, useValue: mockThemeService }],
		});

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
		expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
	});

	it('should display moon icon when in dark mode', async () => {
		const mockThemeService = createMockThemeService(true);
		await render(ThemeToggle, {
			providers: [{ provide: Theme, useValue: mockThemeService }],
		});

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
		expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
	});

	it('should call toggleTheme when button is clicked', async () => {
		const user = userEvent.setup();
		const toggleCalled = { value: false };
		const mockThemeService = {
			isDarkMode: signal(false),
			toggleTheme: () => {
				toggleCalled.value = true;
			},
			setTheme: () => {},
			applyTheme: () => {},
		};
		await render(ThemeToggle, {
			providers: [{ provide: Theme, useValue: mockThemeService }],
		});

		const button = screen.getByRole('button');
		await user.click(button);

		expect(toggleCalled.value).toBe(true);
	});

	it('should have ghost variant styling', async () => {
		const mockThemeService = createMockThemeService(false);
		await render(ThemeToggle, {
			providers: [{ provide: Theme, useValue: mockThemeService }],
		});

		const button = screen.getByRole('button');
		expect(button).toHaveAttribute('variant', 'ghost');
		expect(button).toHaveAttribute('size', 'sm');
	});

	it('should have accessible aria labels', async () => {
		const mockThemeService = createMockThemeService(false);
		await render(ThemeToggle, {
			providers: [{ provide: Theme, useValue: mockThemeService }],
		});

		const button = screen.getByRole('button', { name: /switch to dark mode/i });
		expect(button).toBeInTheDocument();
	});
});
