/**
 * Skeleton loader pour les cartes anime/manhwa.
 * ratio : "2/3" (anime, hentai anime), "1/1" (manhwa, hentai manga)
 */
export function SkeletonCard({ ratio = "2/3" }) {
  return (
    <div className="skeleton-card">
      <div className="skeleton-thumb" style={{ aspectRatio: ratio }} />
      <div className="skeleton-body">
        <div className="skeleton-line w-[80%]" />
        <div className="skeleton-line w-[55%]" style={{ height: 10, marginTop: 6 }} />
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <div className="skeleton-line" style={{ width: 40, height: 16 }} />
          <div className="skeleton-line" style={{ width: 52, height: 16 }} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 12, ratio = "2/3" }) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} ratio={ratio} />
      ))}
    </div>
  );
}
