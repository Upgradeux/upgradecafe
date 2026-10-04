import React from "react";
import type { Metadata } from "next";

interface MenuLayoutProps {
  children: React.ReactNode;
  params: Promise<{ cafeSlug: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cafeSlug: string }>;
}): Promise<Metadata> {
  const { cafeSlug } = await params;
  return {
    manifest: `/api/cafe/${cafeSlug}/manifest`,
  };
}

export default function MenuLayout({ children }: MenuLayoutProps) {
  return <>{children}</>;
}
