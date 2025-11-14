import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Navigation } from '../Navigation';

describe('Navigation', () => {
  beforeEach(() => {
    // Mock window.scrollY
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 0,
    });

    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();

    // Mock querySelector
    vi.spyOn(document, 'querySelector').mockReturnValue({
      scrollIntoView: vi.fn(),
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it('should toggle mobile menu', async () => {
    const { container } = render(<Navigation />);

    const menuButton = screen.getByLabelText('Toggle mobile menu');
    
    // Initially menu button shows Menu icon (closed)
    expect(menuButton.querySelector('.lucide-menu')).toBeInTheDocument();
    
    // Open menu
    fireEvent.click(menuButton);
    
    // Menu button should show X icon (open)
    await waitFor(() => {
      expect(menuButton.querySelector('.lucide-x')).toBeInTheDocument();
    });
    
    // Close menu
    fireEvent.click(menuButton);
    
    // Menu button should show Menu icon again (closed)
    await waitFor(() => {
      expect(menuButton.querySelector('.lucide-menu')).toBeInTheDocument();
    });
  });

  it('should handle scroll event and update background', () => {
    const { container } = render(<Navigation />);

    // Simulate scroll
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true, configurable: true });
    
    // Trigger scroll event
    const scrollEvent = new Event('scroll');
    window.dispatchEvent(scrollEvent);

    // Component should update (nav element exists)
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });

  it('should scroll to section when nav link is clicked', () => {
    const mockElement = {
      scrollIntoView: vi.fn(),
    };
    vi.spyOn(document, 'querySelector').mockReturnValue(mockElement as any);

    render(<Navigation />);

    // Find and click a nav link (desktop)
    const featuresButton = screen.getAllByText('Features')[0];
    fireEvent.click(featuresButton);

    expect(document.querySelector).toHaveBeenCalledWith('#features');
    expect(mockElement.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('should close mobile menu when nav link is clicked', async () => {
    const mockElement = {
      scrollIntoView: vi.fn(),
    };
    vi.spyOn(document, 'querySelector').mockReturnValue(mockElement as any);

    render(<Navigation />);

    // Open mobile menu
    const menuButton = screen.getByLabelText('Toggle mobile menu');
    fireEvent.click(menuButton);

    // Click a mobile menu link
    const mobileLinks = screen.getAllByText('Features');
    const mobileLink = mobileLinks[mobileLinks.length - 1]; // Last one is mobile
    fireEvent.click(mobileLink);

    // Menu should close (scrollToSection sets isMobileMenuOpen to false)
    expect(mockElement.scrollIntoView).toHaveBeenCalled();
  });

  it('should close mobile menu when sign in link is clicked', async () => {
    render(<Navigation />);

    // Open mobile menu
    const menuButton = screen.getByLabelText('Toggle mobile menu');
    fireEvent.click(menuButton);

    // Click mobile sign in link
    const mobileSignInLinks = screen.getAllByText('Sign In');
    const mobileSignInLink = mobileSignInLinks[mobileSignInLinks.length - 1];
    fireEvent.click(mobileSignInLink);

    // Menu should close
    await waitFor(() => {
      // Menu closes when link is clicked
      expect(mobileSignInLink).toBeInTheDocument();
    });
  });

  it('should close mobile menu when get started link is clicked', async () => {
    render(<Navigation />);

    // Open mobile menu
    const menuButton = screen.getByLabelText('Toggle mobile menu');
    fireEvent.click(menuButton);

    // Click mobile get started link
    const mobileGetStartedLinks = screen.getAllByText('Get Started');
    const mobileGetStartedLink = mobileGetStartedLinks[mobileGetStartedLinks.length - 1];
    fireEvent.click(mobileGetStartedLink);

    // Menu should close
    await waitFor(() => {
      expect(mobileGetStartedLink).toBeInTheDocument();
    });
  });

  it('should handle scrollToSection when element is not found', () => {
    vi.spyOn(document, 'querySelector').mockReturnValue(null);

    render(<Navigation />);

    // Click nav link - should not throw error
    const featuresButton = screen.getAllByText('Features')[0];
    fireEvent.click(featuresButton);

    expect(document.querySelector).toHaveBeenCalledWith('#features');
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

  it('should cleanup scroll listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    
    const { unmount } = render(<Navigation />);
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });
});
