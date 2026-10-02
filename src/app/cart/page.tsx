"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GlobalCartRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      // 1. Check direct recent cafe slug
      const recentSlug = localStorage.getItem("recent_cafe_slug");
      if (recentSlug) {
        router.replace(`/menu/${recentSlug}/cart`);
        return;
      }

      // 2. Scan localStorage for any cafe_cart_* key
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("cafe_cart_")) {
          const cafeSlug = key.replace("cafe_cart_", "");
          if (cafeSlug) {
            router.replace(`/menu/${cafeSlug}/cart`);
            return;
          }
        }
      }

      // 3. Fallback to homepage
      router.replace("/");
    } catch (e) {
      router.replace("/");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F4] text-[#1C1D1A]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-stone-300 border-t-stone-800 animate-spin" />
        <span className="text-xs text-stone-500 font-medium">Opening your cart...</span>
      </div>
    </div>
  );
}
