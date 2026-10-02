import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

/**
 * Smoke test proving the jsdom + @testing-library/react + jest-dom pipeline
 * is wired correctly. It renders a trivial inline component (no source files
 * are imported) so it never breaks due to unrelated app changes.
 */
function Hello({ name }: { name: string }) {
  return <h1>Ciao {name}</h1>;
}

describe('testing pipeline', () => {
  it('renders a component and queries the DOM', () => {
    render(<Hello name="Dioniso" />);
    expect(screen.getByRole('heading')).toHaveTextContent('Ciao Dioniso');
  });
});
