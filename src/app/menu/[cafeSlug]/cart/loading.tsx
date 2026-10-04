import React from "react";

export default function CartLoading() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1C1D1A] flex flex-col antialiased">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-30 bg-[#FDFBF7]/90 backdrop-blur-md px-4 pt-3 pb-3 border-b border-black/[0.04]">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="w-9 h-9 rounded-full bg-black/[0.05] animate-pulse" />
          <div className="w-24 h-5 rounded-md bg-black/[0.06] animate-pulse" />
          <div className="w-9 h-9 rounded-full bg-black/[0.05] animate-pulse" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="max-w-md mx-auto w-full px-4 pt-4 pb-28 space-y-4 flex-1">
        {/* Table / Dining Mode Pill Skeleton */}
        <div className="w-full h-11 rounded-2xl bg-black/[0.04] animate-pulse" />

        {/* Item Cards Skeleton */}
        <div className="rounded-3xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
          <div className="w-28 h-4 rounded bg-black/[0.06] animate-pulse" />
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-black/[0.03] last:border-none">
              <div className="w-14 h-14 rounded-2xl bg-black/[0.05] animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="w-3/4 h-3.5 rounded bg-black/[0.06] animate-pulse" />
                <div className="w-1/3 h-3 rounded bg-black/[0.04] animate-pulse" />
              </div>
              <div className="w-16 h-7 rounded-full bg-black/[0.05] animate-pulse shrink-0" />
            </div>
          ))}
        </div>

        {/* Bill Breakdown Skeleton */}
        <div className="rounded-3xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
          <div className="flex justify-between">
            <div className="w-20 h-3 rounded bg-black/[0.04] animate-pulse" />
            <div className="w-12 h-3 rounded bg-black/[0.04] animate-pulse" />
          </div>
          <div className="flex justify-between">
            <div className="w-16 h-3 rounded bg-black/[0.04] animate-pulse" />
            <div className="w-10 h-3 rounded bg-black/[0.04] animate-pulse" />
          </div>
          <div className="border-t border-black/[0.04] pt-2 flex justify-between">
            <div className="w-24 h-4 rounded bg-black/[0.07] animate-pulse" />
            <div className="w-16 h-4 rounded bg-black/[0.07] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
