import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '../../components/Modal';

describe('Modal', () => {
  it('renders children when open', () => {
    render(
      <Modal open={true} onClose={() => {}}>
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <Modal open={false} onClose={() => {}}>
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('calls onClose when overlay clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose}>
        <p>Modal content</p>
      </Modal>
    );

    fireEvent.click(screen.getByText('Modal content').closest('.modal-overlay')!);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not call onClose when modal body clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose}>
        <p>Modal content</p>
      </Modal>
    );

    fireEvent.click(screen.getByText('Modal content').closest('.modal')!);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when X button clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose}>
        <p>Content</p>
      </Modal>
    );

    // The close button contains &times; which renders as x character
    const closeBtn = screen.getByText('\u00D7');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
