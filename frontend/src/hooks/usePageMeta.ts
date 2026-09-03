import { useEffect } from 'react';
import { site } from '../config/site';

export function usePageMeta(title?: string, description?: string) {
  useEffect(() => {
    const prevTitle = document.title;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const prevDesc = meta?.content ?? '';

    document.title = title
      ? `${title} — ${site.name}`
      : `${site.name} — Streaming Anime Subtitle Indonesia`;

    if (meta && description) {
      meta.content = description;
    }

    return () => {
      document.title = prevTitle;
      if (meta && description) {
        meta.content = prevDesc;
      }
    };
  }, [title, description]);
}
