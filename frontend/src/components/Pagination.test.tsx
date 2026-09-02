import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from './Pagination';

describe('Pagination', () => {
  it('tidak merender bila hanya satu halaman', () => {
    render(<Pagination page={1} totalPages={1} onPage={() => {}} />);
    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it('disable Prev di halaman pertama dan Next di halaman terakhir', () => {
    const onPage = vi.fn();
    render(<Pagination page={1} totalPages={3} onPage={onPage} />);
    expect(screen.getByRole('button', { name: /sebelumnya/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /berikutnya/i })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: /berikutnya/i }));
    expect(onPage).toHaveBeenCalledWith(2);
  });

  it('menandai halaman aktif dengan aria-current dan memotong nomor dengan ellipsis', () => {
    render(<Pagination page={2} totalPages={8} onPage={() => {}} />);
    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('…')).toBeInTheDocument();
  });
});
