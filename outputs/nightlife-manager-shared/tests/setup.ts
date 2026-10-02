// Vitest global setup.
// Adds jest-dom matchers (toBeInTheDocument, etc.) for @testing-library/react
// and cleans up the rendered DOM after each test.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
