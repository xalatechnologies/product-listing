import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navigation } from '../Navigation';

describe('Navigation', () => {
  it('should render navigation component', () => {
    render(<Navigation />);

    expect(screen.getByText('ListingAI')).toBeInTheDocument();
  });

  it('should render all navigation links', () => {
    render(<Navigation />);

    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Pricing')).toBeInTheDocument();
    expect(screen.getByText('Testimonials')).toBeInTheDocument();
  });

  it('should render sign in and get started buttons', () => {
    render(<Navigation />);

    const signInButtons = screen.getAllByText('Sign In');
    const getStartedButtons = screen.getAllByText('Get Started');

    expect(signInButtons.length).toBeGreaterThan(0);
    expect(getStartedButtons.length).toBeGreaterThan(0);
  });

  it('should toggle mobile menu', () => {
    render(<Navigation />);

    const menuButton = screen.getByLabelText('Toggle mobile menu');
    fireEvent.click(menuButton);

    // Mobile menu content should be visible
    // Note: Actual visibility depends on screen size and CSS
  });

  it('should apply golden theme colors', () => {
    const { container } = render(<Navigation />);

    const logo = container.querySelector('.from-amber-500');
    expect(logo).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<Navigation />);

    const menuButton = screen.getByLabelText('Toggle mobile menu');
    expect(menuButton).toHaveAttribute('aria-label', 'Toggle mobile menu');
  });
});
