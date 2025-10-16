import { render, screen } from '@testing-library/angular';
import { App } from './app';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

describe('App', () => {
  it('should render title', async () => {
    await render(App, {
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    const title = screen.getByText(
      'Welcome to the Reset Dev Nx + Angular SSR starter repo 👋'
    );
    expect(title).toBeInTheDocument();
  });
});
