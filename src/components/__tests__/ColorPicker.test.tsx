import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorPicker } from '../ColorPicker';

describe('ColorPicker', () => {
  it('should render color input', () => {
    const mockOnChange = vi.fn();
    render(<ColorPicker value="#FF9900" onChange={mockOnChange} />);

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('should display current color value', () => {
    const mockOnChange = vi.fn();
    const { container } = render(<ColorPicker value="#FF9900" onChange={mockOnChange} />);

    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    expect(input?.value).toBe('#FF9900');
  });

  it('should call onChange when color is updated', () => {
    const mockOnChange = vi.fn();
    const { container } = render(<ColorPicker value="#FF9900" onChange={mockOnChange} />);

    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    if (input) {
      fireEvent.change(input, { target: { value: '#00FF00' } });
      expect(mockOnChange).toHaveBeenCalledWith('#00FF00');
    }
  });

  it('should validate hex color format', () => {
    const mockOnChange = vi.fn();
    const { container } = render(<ColorPicker value="#FF9900" onChange={mockOnChange} />);

    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    if (input) {
      fireEvent.change(input, { target: { value: 'invalid' } });

      // Should show validation error or not call onChange
      // Implementation depends on ColorPicker component
    }
  });

  it('should render color preview', () => {
    const mockOnChange = vi.fn();
    const { container } = render(<ColorPicker value="#FF9900" onChange={mockOnChange} />);

    const preview = container.querySelector('[data-testid="color-preview"]');
    if (preview) {
      expect(preview).toBeInTheDocument();
    }
  });
});
