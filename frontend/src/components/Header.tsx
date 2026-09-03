import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, Search, X } from 'lucide-react';
import { site } from '../config/site';
import { useSearch } from '../hooks/useSearch';
import { Badge } from './AnimeCard';
import { formatScore } from '../lib/format';

const NAV_ITEMS = [
  { to: '/ongoing', label: 'Ongoing' },
  { to: '/complete', label: 'Complete' },
  { to: '/history', label: 'History' },
];

function SearchBar() {
  const navigate = useNavigate();
  const { query, setQuery, results, open, setOpen, loading } = useSearch();

  const go = (slug: string) => {
    setQuery('');
    setOpen(false);
    navigate(`/anime/${slug}`);
  };

  return (
    <div className="relative w-full sm:max-w-xs">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
            if (e.key === 'Enter' && results[0]) go(results[0].slug);
          }}
          placeholder="Cari anime..."
          aria-label="Cari anime"
          className="h-9 w-full rounded-md border border-[#262a38] bg-[#1a1d27] pl-9 pr-3 text-sm text-gray-200 placeholder:text-gray-500 focus:border-indigo-400 focus:outline-none sm:h-10"
        />
      </div>
      {open && (loading || results.length > 0) ? (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-[#262a38] bg-[#1a1d27] shadow-xl">
          {loading ? (
            <p className="px-3 py-2 text-sm text-gray-400">Mencari…</p>
          ) : (
            results.map((r) => (
              <button
                key={r.slug}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(r.slug)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[#262a38]"
              >
                {r.posterUrl ? (
                  <img src={r.posterUrl} alt="" className="h-12 w-8 rounded object-cover" />
                ) : null}
                <span className="min-w-0">
                  <span className="block truncate text-sm text-gray-200">{r.title}</span>
                  <span className="flex items-center gap-2 text-xs text-gray-400">
                    <Badge status={r.status} /> {formatScore(r.score)}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  // tutup menu mobile setiap pindah halaman
  useEffect(() => {
    setMobileOpen(false);
  }, [navigate]);

  return (
    <header className="sticky top-0 z-30 border-b border-[#262a38] bg-[#0f1117]/95 backdrop-blur">
      <div className="container-page flex h-14 items-center justify-between gap-3 sm:h-16">
        <Link to="/" className="text-lg font-extrabold tracking-tight text-white">
          {site.name}
        </Link>
        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 sm:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium capitalize focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400 ${
                  isActive ? 'bg-[#262a38] text-white' : 'text-gray-300 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden sm:block">
          <SearchBar />
        </div>
        <button
          type="button"
          className="rounded-md p-2 text-gray-300 hover:bg-[#262a38] sm:hidden"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {mobileOpen ? (
        <div className="border-t border-[#262a38] px-4 py-3 sm:hidden">
          <div className="mb-3">
            <SearchBar />
          </div>
          <nav aria-label="Navigasi mobile" className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium capitalize ${
                    isActive ? 'bg-[#262a38] text-white' : 'text-gray-300'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
