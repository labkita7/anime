import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AnimeCard from './AnimeCard';
import type { Anime } from '../types';

const anime: Anime = {
  id: 1,
  slug: 'kage-no-tabi-sub-indo',
  title: 'Kage no Tabi',
  japaneseTitle: null,
  posterUrl: '/posters/kage-no-tabi-sub-indo.svg',
  synopsis: 'sinopsis',
  score: '8.10',
  status: 'ongoing',
  type: 'TV',
  totalEpisodes: '8',
  duration: null,
  releaseDay: null,
  releaseDate: null,
  studio: null,
  genres: ['Action'],
  sortOrder: 1,
};

describe('AnimeCard', () => {
  it('merender judul, skor, badge status, dan tautan detail', () => {
    render(
      <MemoryRouter>
        <AnimeCard anime={anime} />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: /kage no tabi/i })).toHaveAttribute(
      'href',
      '/anime/kage-no-tabi-sub-indo'
    );
    expect(screen.getByText('8.10')).toBeInTheDocument();
    expect(screen.getByText(/ongoing/i)).toBeInTheDocument();
  });
});
