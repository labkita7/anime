import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PosterImage from './PosterImage';

describe('PosterImage', () => {
  it('merender img dengan src saat tersedia', () => {
    render(<PosterImage src="https://contoh.test/poster.jpg" alt="Poster anime" />);
    expect(screen.getByRole('img', { name: 'Poster anime' })).toHaveAttribute(
      'src',
      'https://contoh.test/poster.jpg'
    );
  });

  it('langsung memakai placeholder bila src null', () => {
    render(<PosterImage src={null} alt="Poster anime" />);
    expect(screen.getByRole('img', { name: 'Poster anime' })).toHaveAttribute(
      'src',
      '/poster-placeholder.svg'
    );
  });

  it('berpindah ke placeholder saat gambar gagal dimuat', () => {
    render(<PosterImage src="https://contoh.test/poster.jpg" alt="Poster anime" />);
    const img = screen.getByRole('img', { name: 'Poster anime' }) as HTMLImageElement;
    fireEvent.error(img);
    expect(img).toHaveAttribute('src', '/poster-placeholder.svg');
  });
});
