import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe.skip('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByText('Click me');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    
    const button = screen.getByText('Disabled Button');
    expect(button).toBeDisabled();
  });

  it('should apply variant classes', () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>);
    
    let button = screen.getByText('Delete');
    expect(button).toHaveClass('bg-red-600');
    
    rerender(<Button variant="outline">Cancel</Button>);
    button = screen.getByText('Cancel');
    expect(button).toHaveClass('border-2');
  });

  it('should apply size classes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    
    let button = screen.getByText('Small');
    expect(button).toHaveClass('h-8');
    
    rerender(<Button size="lg">Large</Button>);
    button = screen.getByText('Large');
    expect(button).toHaveClass('h-12');
  });
});
