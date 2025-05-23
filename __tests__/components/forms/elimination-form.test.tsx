import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EliminationForm } from '@/components/forms/elimination-form';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/components/ui/use-toast', () => ({
  useToast: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('EliminationForm', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockToast = jest.fn();

  const defaultProps = {
    targetId: 'target123',
    targetName: 'Test Target',
    targetGroup: '3r - MAT',
    targetPhoto: 'https://example.com/photo.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    
    // Mock canvas methods
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      strokeStyle: '',
      lineWidth: 0,
      lineCap: '',
      lineJoin: '',
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      clearRect: jest.fn(),
    })) as any;
    
    HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,signature');
  });

  it('should render the target information correctly', () => {
    render(<EliminationForm {...defaultProps} />);

    expect(screen.getByText('Test Target')).toBeInTheDocument();
    expect(screen.getByText('3r - MAT')).toBeInTheDocument();
    expect(screen.getByText('Confirmar Eliminació')).toBeInTheDocument();
  });

  it('should show error toast when submitting without signature', async () => {
    render(<EliminationForm {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: /Reportar Eliminació/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Signatura requerida',
        description: "Has de signar per confirmar l'eliminació",
        variant: 'destructive',
      });
    });
  });

  it('should handle successful elimination submission', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        eliminationId: 'elim123',
        message: 'Eliminació reportada',
      }),
    });

    render(<EliminationForm {...defaultProps} />);

    // Simulate drawing on canvas
    const canvas = screen.getByRole('img', { hidden: true }) as HTMLCanvasElement;
    fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });
    fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseUp(canvas);

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Reportar Eliminació/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/eliminations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetId: 'target123',
          killerSignature: 'data:image/png;base64,signature',
        }),
      });
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Eliminació reportada!',
        description: 'Pendent de confirmació per la víctima o un organitzador',
      });
    });

    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
  });

  it('should handle API error during submission', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'La víctima ja ha estat eliminada',
      }),
    });

    render(<EliminationForm {...defaultProps} />);

    // Simulate drawing on canvas
    const canvas = screen.getByRole('img', { hidden: true }) as HTMLCanvasElement;
    fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });
    fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseUp(canvas);

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Reportar Eliminació/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'La víctima ja ha estat eliminada',
        variant: 'destructive',
      });
    });

    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('should clear signature when clear button is clicked', () => {
    render(<EliminationForm {...defaultProps} />);

    // Simulate drawing on canvas
    const canvas = screen.getByRole('img', { hidden: true }) as HTMLCanvasElement;
    fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });
    fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseUp(canvas);

    // Clear signature
    const clearButton = screen.getByRole('button', { name: /Esborrar signatura/i });
    fireEvent.click(clearButton);

    const context = canvas.getContext('2d');
    expect(context?.clearRect).toHaveBeenCalled();
  });

  it('should handle network error during submission', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<EliminationForm {...defaultProps} />);

    // Simulate drawing on canvas
    const canvas = screen.getByRole('img', { hidden: true }) as HTMLCanvasElement;
    fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });
    fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseUp(canvas);

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Reportar Eliminació/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Network error',
        variant: 'destructive',
      });
    });
  });

  it('should support touch events for drawing', () => {
    render(<EliminationForm {...defaultProps} />);

    const canvas = screen.getByRole('img', { hidden: true }) as HTMLCanvasElement;
    
    // Simulate touch drawing
    fireEvent.touchStart(canvas, {
      touches: [{ clientX: 50, clientY: 50 }],
    });
    fireEvent.touchMove(canvas, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    fireEvent.touchEnd(canvas);

    const context = canvas.getContext('2d');
    expect(context?.beginPath).toHaveBeenCalled();
    expect(context?.moveTo).toHaveBeenCalled();
    expect(context?.lineTo).toHaveBeenCalled();
    expect(context?.stroke).toHaveBeenCalled();
  });

  it('should display loading state during submission', async () => {
    (fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<EliminationForm {...defaultProps} />);

    // Simulate drawing on canvas
    const canvas = screen.getByRole('img', { hidden: true }) as HTMLCanvasElement;
    fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });
    fireEvent.mouseUp(canvas);

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Reportar Eliminació/i });
    fireEvent.click(submitButton);

    // Check loading state
    await waitFor(() => {
      expect(screen.getByText(/Reportant eliminació.../i)).toBeInTheDocument();
    });
  });
}); 