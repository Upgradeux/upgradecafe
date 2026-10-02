import React from "react";
import { notFound, redirect } from "next/navigation";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { CafeAppShell } from "@/features/cafe/components/CafeAppShell";
import { ToastProvider } from "@/components/ui/Toast";
import { getCafeThemeStyles } from "@/lib/theme/theme-tokens";

interface CafeLayoutProps {
  children: React.ReactNode;
  params: Promise<{ cafeSlug: string }>;
}

export default async function CafeLayout({ children, params }: CafeLayoutProps) {
  const { cafeSlug } = await params;

  let tenantContext;
  try {
    tenantContext = await resolveCafeTenant(cafeSlug);
  } catch (err: any) {
    if (err?.code === "CAFE_NOT_FOUND" || err?.statusCode === 404) {
      notFound();
    }
    if (err?.statusCode === 401) {
      redirect(`/admin/login?returnUrl=/cafe/${cafeSlug}`);
    }
    if (err?.code === "PASSWORD_CHANGE_REQUIRED") {
      redirect("/account/change-password");
    }
    // Re-throw or display error
    throw err;
  }

  const { cafe, user, membershipRole, isSuperAdmin, accessState, settings } = tenantContext;
  const themeStyles = getCafeThemeStyles(settings?.themePreset || "roast");

  return (
    <ToastProvider>
      <div
        data-theme="cafe"
        style={themeStyles as React.CSSProperties}
        className="h-screen w-screen overflow-hidden bg-[var(--color-background)] text-[var(--color-foreground)] antialiased"
      >
        <CafeAppShell
          cafe={cafe}
          user={user}
          membershipRole={membershipRole}
          isSuperAdmin={isSuperAdmin}
          accessState={accessState}
        >
          {children}
        </CafeAppShell>
      </div>
    </ToastProvider>
  );
}
