import Link from "next/link";
import { IconCup, IconArrowRight, IconShieldCheck, IconCoffee, IconReceipt } from "@tabler/icons-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--color-background)] text-[var(--color-foreground)]">
      {/* Top Navbar */}
      <header className="h-16 px-6 sm:px-12 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/logo/logo2.png" alt="UpgradeCafé" className="h-8 w-auto object-contain" />
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/login"
            className="text-xs font-semibold px-4 py-2 rounded-[var(--radius-button)] bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors shadow-[var(--shadow-subtle)]"
          >
            Super Admin Portal
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 max-w-4xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] text-xs font-semibold border border-[var(--color-primary)]/20">
          <IconShieldCheck className="w-3.5 h-3.5" />
          <span>Phase 1 — Super Admin & Multi-Tenant SaaS Foundation</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[var(--color-foreground)] max-w-2xl leading-tight">
          Modern Multi-Tenant Hospitality Architecture
        </h1>

        <p className="text-sm sm:text-base text-[var(--color-muted)] max-w-xl leading-relaxed">
          Production-grade SaaS foundation powered by Drizzle ORM, Supabase PostgreSQL, Better Auth, and administrative offline billing.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-[var(--radius-button)] bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors shadow-[var(--shadow-subtle)]"
          >
            <span>Open Admin Dashboard</span>
            <IconArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-[var(--radius-button)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)] transition-colors"
          >
            Sign in as Super Admin
          </Link>
        </div>

        {/* Feature pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-10 text-left w-full">
          <div className="p-5 rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)]">
            <IconCoffee className="w-5 h-5 text-[var(--color-primary)] mb-2" />
            <h3 className="text-sm font-semibold mb-1">Strict Tenant Isolation</h3>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              Enforced server-side IDOR prevention ensuring complete data boundary isolation between cafés.
            </p>
          </div>

          <div className="p-5 rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)]">
            <IconReceipt className="w-5 h-5 text-[var(--color-warning)] mb-2" />
            <h3 className="text-sm font-semibold mb-1">Offline Billing Ledger</h3>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              Administrative manual payment recording for UPI, Cash, Bank Transfer without payment gateway dependencies.
            </p>
          </div>

          <div className="p-5 rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)]">
            <IconShieldCheck className="w-5 h-5 text-[var(--color-success)] mb-2" />
            <h3 className="text-sm font-semibold mb-1">Access State Engine</h3>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              Automated expiry calculation, 7-day grace periods, and manual Super Admin overrides.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-14 px-6 sm:px-12 border-t border-[var(--color-border)] text-xs text-[var(--color-muted)] flex items-center justify-between">
        <span>UpgradeCafe © {new Date().getFullYear()}</span>
        <span>Built with Next.js, Drizzle & Better Auth</span>
      </footer>
    </div>
  );
}
