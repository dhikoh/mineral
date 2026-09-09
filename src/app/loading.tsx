import { Sparkles } from 'lucide-react';

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 space-y-8 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="h-48 sm:h-64 w-full rounded-3xl bg-slate-200/80" />

      {/* Filter / Tabs Skeleton */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        <div className="h-8 w-28 rounded-full bg-slate-200" />
        <div className="h-8 w-32 rounded-full bg-slate-200" />
        <div className="h-8 w-24 rounded-full bg-slate-200" />
        <div className="h-8 w-36 rounded-full bg-slate-200" />
      </div>

      {/* Grid Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col rounded-3xl border border-surface-200 bg-white p-4 space-y-4 shadow-soft-xs"
          >
            <div className="aspect-square w-full rounded-2xl bg-slate-100" />
            <div className="space-y-2">
              <div className="h-4 w-3/4 rounded-md bg-slate-200" />
              <div className="h-3 w-1/2 rounded-md bg-slate-100" />
            </div>
            <div className="pt-2 border-t border-surface-100 flex items-center justify-between">
              <div className="h-5 w-20 rounded-md bg-emerald-100" />
              <div className="h-8 w-24 rounded-full bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
