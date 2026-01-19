import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../button';

describe('Button', () => {
  it('should render with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: 'Click me' });
    
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center');
  });

  it('should apply different variants correctly', () => {
    const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const;
    
    variants.forEach((variant) => {
      const { unmount } = render(<Button variant={variant}>Test</Button>);
      const button = screen.getByRole('button');
      
      // Check that variant-specific classes are applied
      switch (variant) {
        case 'default':
          expect(button).toHaveClass('bg-blue-500');
          break;
        case 'destructive':
          expect(button).toHaveClass('bg-red-500');
          break;
        case 'outline':
          expect(button).toHaveClass('border');
          break;
        case 'secondary':
          expect(button).toHaveClass('bg-gray-200');
          break;
        case 'ghost':
          expect(button).toHaveClass('hover:bg-gray-100');
          break;
        case 'link':
          expect(button).toHaveClass('underline-offset-4');
          break;
      }
      
      unmount();
    });
  });

  it('should apply different sizes correctly', () => {
    const sizes = ['default', 'sm', 'lg', 'icon'] as const;
    
    sizes.forEach((size) => {
      const { unmount } = render(<Button size={size}>Test</Button>);
      const button = screen.getByRole('button');
      
      switch (size) {
        case 'default':
          expect(button).toHaveClass('h-10');
          break;
        case 'sm':
          expect(button).toHaveClass('h-9');
          break;
        case 'lg':
          expect(button).toHaveClass('h-11');
          break;
        case 'icon':
          expect(button).toHaveClass('h-10', 'w-10');
          break;
      }
      
      unmount();
    });
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should apply custom className', () => {
    const customClass = 'custom-button-class';
    render(<Button className={customClass}>Test</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass(customClass);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50');
  });

  it('should forward ref correctly', () => {
    const ref = jest.fn();
    render(<Button ref={ref}>Test</Button>);
    
    expect(ref).toHaveBeenCalled();
  });

  it('should spread additional props', () => {
    render(
      <Button data-testid="custom-button" aria-label="Custom label">
        Test
      </Button>
    );
    
    const button = screen.getByTestId('custom-button');
    expect(button).toHaveAttribute('aria-label', 'Custom label');
  });

  it('should combine all classes correctly', () => {
    render(
      <Button 
        variant="destructive" 
        size="lg" 
        className="extra-class"
      >
        Complex Button
      </Button>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass(
      'inline-flex',
      'bg-red-500',
      'h-11',
      'extra-class'
    );
  });

  it('should handle focus states', () => {
    render(<Button>Focusable</Button>);
    
    const button = screen.getByRole('button');
    button.focus();
    
    expect(button).toHaveFocus();
  });

  it('should not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} disabled>Disabled</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });
});