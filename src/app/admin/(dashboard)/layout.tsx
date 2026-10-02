import React from "react";
import { AdminSidebar } from "@/features/super-admin/components/AdminSidebar";
import { ToastProvider } from "@/components/ui/Toast";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/permissions/guards";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireSuperAdmin();
  } catch {
    redirect("/admin/login");
  }

  return (
    <ToastProvider>
      <div data-theme="admin" className="min-h-screen bg-[var(--color-background)] md:flex">
        <AdminSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <main className="mx-auto w-full max-w-[1440px] flex-1 space-y-5 p-4 sm:p-6 xl:p-8">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
