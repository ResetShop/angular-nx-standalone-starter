import { setupZonelessTestEnv } from 'jest-preset-angular/setup-env/zoneless/index.js';
import '@testing-library/jest-dom';

setupZonelessTestEnv({
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true,
});
