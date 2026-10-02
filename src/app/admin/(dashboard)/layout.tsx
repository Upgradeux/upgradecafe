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
      <div className="min-h-screen flex bg-[var(--color-background)]">
        {/* Compact Super Admin Sidebar */}
        <AdminSidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
