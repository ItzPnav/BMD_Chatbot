import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FloatingChatButton } from './FloatingChatButton';

describe('FloatingChatButton', () => {
  it('renders the floating chat button', () => {
    const handleClick = vi.fn();
    render(<FloatingChatButton onClick={handleClick} />);
    
    const button = screen.getByRole('button', { name: /open chat/i });
    expect(button).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    
    render(<FloatingChatButton onClick={handleClick} />);
    const button = screen.getByRole('button', { name: /open chat/i });
    button.click();
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

