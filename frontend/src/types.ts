export interface Anime {
  id: number;
  slug: string;
  title: string;
  japaneseTitle: string | null;
  posterUrl: string | null;
  synopsis: string | null;
  score: string | null;
  status: 'ongoing' | 'complete';
  type: string | null;
  totalEpisodes: string | null;
  duration: string | null;
  releaseDay: string | null;
  releaseDate: string | null;
  studio: string | null;
  genres: string[];
  sortOrder: number;
}

export interface Episode {
  id: number;
  animeId: number;
  slug: string;
  title: string;
  episodeNumber: number;
  releaseDate: string | null;
}

export interface Page<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
}

export interface AnimeDetail extends Anime {
  episodes: Episode[];
  totalEpisodeCount: number;
  episodePage: number;
  episodePerPage: number;
  episodeTotalPages: number;
  episodeHasMore: boolean;
}

export interface SearchItem {
  title: string;
  slug: string;
  posterUrl: string | null;
  status: 'ongoing' | 'complete';
  score: string | null;
}

export interface SearchResult {
  query: string;
  totalResults: number;
  data: SearchItem[];
}

export type StreamMode = 'native' | 'iframe';

export interface StreamSource {
  server: string;
  mode: StreamMode;
  url: string;
}

export interface StreamPayload {
  title: string;
  animeSlug: string;
  animeTitle: string;
  posterUrl: string | null;
  episodeNumber: number;
  synopsis: string | null;
  score: string | null;
  studio: string | null;
  genres: string[];
  duration: string | null;
  releaseDay: string | null;
  status: 'ongoing' | 'complete';
  prevEpisodeSlug: string | null;
  nextEpisodeSlug: string | null;
  defaultPlayer: string | null;
  streams: Record<string, StreamSource[]>;
}
