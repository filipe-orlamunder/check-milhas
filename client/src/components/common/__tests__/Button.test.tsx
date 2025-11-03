import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('components/common/Button', () => {
  it('renderiza com children e chama onClick', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Salvar</Button>);
    const btn = screen.getByRole('button', { name: /salvar/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('aplica variante secondary', () => {
    render(<Button variant="secondary">Secundário</Button>);
    const btn = screen.getByRole('button', { name: /secundário/i });
    expect(btn.className).toMatch(/bg-gray-100/);
  });
});
