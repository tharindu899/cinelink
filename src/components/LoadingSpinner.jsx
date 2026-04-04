// src/components/LoadingSpinner.jsx
export default function LoadingSpinner({ fullScreen = false, size = 'md' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };

  const spinner = (
    <div className={`relative ${sizes[size]}`}>
      <div className={`absolute inset-0 rounded-full border-2 border-white/10`} />
      <div
        className={`absolute inset-0 rounded-full border-2 border-transparent border-t-brand-500 animate-spin`}
      />
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-dark-950 z-50">
        <div className="flex flex-col items-center gap-4">
          {spinner}
          <p className="text-white/40 text-sm font-body animate-pulse">Loading…</p>
        </div>
      </div>
    );
  }

  return spinner;
}

// ── Skeleton loaders ──────────────────────────────────────────────────────────
export function CardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-dark-800 animate-pulse">
      <div className="aspect-[2/3] skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-4 skeleton rounded w-3/4" />
        <div className="h-3 skeleton rounded w-1/2" />
      </div>
    </div>
  );
}

export function DetailsSkeleton() {
  return (
    <div className="animate-pulse space-y-6 pt-20">
      <div className="h-72 skeleton rounded-none" />
      <div className="max-w-screen-xl mx-auto px-6 space-y-4">
        <div className="h-10 skeleton rounded w-1/2" />
        <div className="h-4 skeleton rounded w-1/3" />
        <div className="h-20 skeleton rounded" />
      </div>
    </div>
  );
}
