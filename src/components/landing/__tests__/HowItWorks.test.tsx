import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HowItWorks } from '../HowItWorks';

describe('HowItWorks', () => {
  it('should render section title', () => {
    render(<HowItWorks />);

    expect(screen.getByText('How It Works')).toBeInTheDocument();
  });

  it('should render all 4 steps', () => {
    render(<HowItWorks />);

    expect(screen.getByText('Upload Your Product')).toBeInTheDocument();
    expect(screen.getByText('AI Generates Content')).toBeInTheDocument();
    expect(screen.getByText('Review & Customize')).toBeInTheDocument();
    expect(screen.getByText('Launch & Sell More')).toBeInTheDocument();
  });

  it('should render step descriptions', () => {
    render(<HowItWorks />);

    expect(screen.getByText(/Upload 1-10 product photos/i)).toBeInTheDocument();
    expect(screen.getByText(/Advanced AI creates professional images/i)).toBeInTheDocument();
  });

  it('should render call-to-action button', () => {
    render(<HowItWorks />);

    const ctaButton = screen.getByText('Start Creating Now');
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton.closest('a')).toHaveAttribute('href', '/auth/signin');
  });

  it('should use golden theme colors', () => {
    const { container } = render(<HowItWorks />);

    const stepNumbers = container.querySelectorAll('.from-amber-600');
    expect(stepNumbers.length).toBeGreaterThan(0);
  });
});
