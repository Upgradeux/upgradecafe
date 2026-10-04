import React from "react";

export default function OrdersLoading() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1C1D1A] flex flex-col antialiased">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-30 bg-[#FDFBF7]/90 backdrop-blur-md px-4 pt-3 pb-3 border-b border-black/[0.04]">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="w-9 h-9 rounded-full bg-black/[0.05] animate-pulse" />
          <div className="w-28 h-5 rounded-md bg-black/[0.06] animate-pulse" />
          <div className="w-9 h-9 rounded-full bg-black/[0.05] animate-pulse" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="max-w-md mx-auto w-full px-4 pt-4 pb-28 space-y-4 flex-1">
        {/* Active Order Card Skeleton */}
        <div className="rounded-3xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="w-24 h-4 rounded bg-black/[0.06] animate-pulse" />
              <div className="w-16 h-3 rounded bg-black/[0.04] animate-pulse" />
            </div>
            <div className="w-20 h-6 rounded-full bg-black/[0.05] animate-pulse" />
          </div>

          <div className="w-full h-2 rounded-full bg-black/[0.04] animate-pulse" />

          <div className="space-y-2 pt-2 border-t border-black/[0.03]">
            {[1, 2].map((i) => (
              <div key={i} className="flex justify-between items-center py-1">
                <div className="w-32 h-3.5 rounded bg-black/[0.05] animate-pulse" />
                <div className="w-12 h-3.5 rounded bg-black/[0.05] animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
