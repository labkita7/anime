import { useEffect, useState } from 'react';

const PLACEHOLDER = '/poster-placeholder.svg';

/**
 * Img poster dengan fallback: bila src kosong atau gagal dimuat
 * (mis. upstream memblokir hotlink), tampilkan placeholder lokal.
 */
export default function PosterImage({
  src,
  alt,
  className,
  loading = 'lazy',
}: {
  src: string | null;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}) {
  const [source, setSource] = useState(src ?? PLACEHOLDER);

  useEffect(() => {
    setSource(src ?? PLACEHOLDER);
  }, [src]);

  return (
    <img
      src={source}
      alt={alt}
      loading={loading}
      className={className}
      onError={() => {
        if (source !== PLACEHOLDER) setSource(PLACEHOLDER);
      }}
    />
  );
}
