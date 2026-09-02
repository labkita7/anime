export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-md bg-[#1a1d27]" aria-hidden>
      <div className="aspect-[2/3] w-full animate-pulse bg-[#262a38]" />
      <div className="space-y-2 p-2">
        <div className="h-3 w-full animate-pulse rounded bg-[#262a38]" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-[#262a38]" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
      role="status"
      aria-label="Memuat"
    >
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
