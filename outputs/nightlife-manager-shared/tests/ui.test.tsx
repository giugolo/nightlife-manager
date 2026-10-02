import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button, Badge, Input, Modal } from '../components/ui';

describe('Button', () => {
  it('renders children and fires onClick', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Salva</Button>);
    const btn = screen.getByRole('button', { name: 'Salva' });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('shows a spinner and disables itself while loading', () => {
    render(<Button loading>Salva</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    // Children are replaced by the spinner (role=status) when loading.
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(btn).not.toHaveTextContent('Salva');
  });
});

describe('Badge', () => {
  it('applies the variant classes', () => {
    render(<Badge variant="purple">Admin</Badge>);
    const badge = screen.getByText('Admin');
    expect(badge.className).toContain('text-purple-400');
  });
});

describe('Input', () => {
  it('associates the label with the control and shows errors', () => {
    render(<Input label="Email" name="email" error="Campo obbligatorio" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByText('Campo obbligatorio')).toBeInTheDocument();
  });
});

describe('Modal', () => {
  it('renders only when open and closes on Escape', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Modal open={false} onClose={onClose} title="Titolo">contenuto</Modal>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(<Modal open onClose={onClose} title="Titolo">contenuto</Modal>);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
