import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2
  );

  return (
    <nav aria-label="Navigasi halaman" className="mt-6 flex flex-wrap items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        aria-label="Halaman sebelumnya"
        className="flex h-9 items-center gap-1 rounded-md px-3 text-sm text-gray-300 hover:bg-[#262a38] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden /> Prev
      </button>
      {pages.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && p - pages[i - 1] > 1 ? <span className="px-1 text-gray-500">…</span> : null}
          <button
            type="button"
            onClick={() => onPage(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`h-9 min-w-9 rounded-md px-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400 ${
              p === page ? 'bg-indigo-500 font-semibold text-white' : 'text-gray-300 hover:bg-[#262a38]'
            }`}
          >
            {p}
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        aria-label="Halaman berikutnya"
        className="flex h-9 items-center gap-1 rounded-md px-3 text-sm text-gray-300 hover:bg-[#262a38] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </nav>
  );
}
