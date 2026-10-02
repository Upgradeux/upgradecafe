import { AdminHeader } from "@/features/super-admin/components/AdminHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  IconDatabase,
  IconShieldLock,
  IconGauge,
} from "@tabler/icons-react";
import { RATE_LIMIT_RULES } from "@/lib/rate-limit/rate-limiter";

function formatWindow(window: string) {
  const [amount, unit] = window.split(" ");
  const unitName = { s: "second", m: "minute", h: "hour", d: "day" }[unit as "s" | "m" | "h" | "d"];
  return `${amount} ${unitName}${amount === "1" ? "" : "s"}`;
}

export default function AdminSettingsPage() {
  const redisConfigured = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  const r2Configured = Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      process.env.R2_PUBLIC_URL
  );
  const rateLimits = Object.entries(RATE_LIMIT_RULES).map(([key, rule]) => ({
    key,
    requests: rule.requests,
    window: formatWindow(rule.window),
  }));

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Platform & Security Settings"
        subtitle="Environment configuration and the active rate limit policies."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Infrastructure Health */}
        <Card className="border border-[var(--color-border)]">
          <CardHeader className="py-3.5 px-5 border-b border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-2">
              <IconDatabase className="w-4 h-4 text-[var(--color-primary)]" />
              <CardTitle className="text-sm">Database & Infrastructure</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-[var(--color-border-subtle)]">
              <span className="text-[var(--color-muted)]">Authoritative Source of Truth:</span>
              <Badge variant={process.env.DATABASE_URL ? "active" : "warning"} showDot>
                {process.env.DATABASE_URL ? "DATABASE_URL supplied" : "Local database fallback"}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[var(--color-border-subtle)]">
              <span className="text-[var(--color-muted)]">ORM Framework:</span>
              <span className="font-semibold">Drizzle ORM (Type-safe SQL)</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[var(--color-border-subtle)]">
              <span className="text-[var(--color-muted)]">Distributed Cache & Rate Limiting:</span>
              <Badge variant={redisConfigured ? "active" : "warning"}>
                {redisConfigured ? "Upstash Redis configured" : "In-memory fallback"}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-[var(--color-muted)]">File & Image Storage:</span>
              <Badge variant={r2Configured ? "active" : "warning"}>
                {r2Configured ? "Cloudflare R2 configured" : "R2 not fully configured"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Security & Authentication Policy */}
        <Card className="border border-[var(--color-border)]">
          <CardHeader className="py-3.5 px-5 border-b border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-2">
              <IconShieldLock className="w-4 h-4 text-[var(--color-success)]" />
              <CardTitle className="text-sm">Authentication & Security Policy</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-[var(--color-border-subtle)]">
              <span className="text-[var(--color-muted)]">Session Management:</span>
              <span className="font-semibold">Better Auth (Secure HTTP-only Cookies)</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[var(--color-border-subtle)]">
              <span className="text-[var(--color-muted)]">Session Lifetime:</span>
              <span className="font-semibold">7 Days (Auto-rolling refresh)</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[var(--color-border-subtle)]">
              <span className="text-[var(--color-muted)]">Client Storage Policy:</span>
              <Badge variant="active">HTTP-only session cookies</Badge>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-[var(--color-muted)]">Tenant Isolation Enforcement:</span>
              <Badge variant="active">Server-side tenant and role checks</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Centralized Rate Limit Rules */}
      <Card className="border border-[var(--color-border)]">
        <CardHeader className="py-3.5 px-5 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2">
            <IconGauge className="w-4 h-4 text-[var(--color-warning)]" />
          <CardTitle className="text-sm">Configured Rate Limit Rules</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rateLimits.map((r) => (
              <div
                key={r.key}
                className="p-3 rounded-[var(--radius-button)] bg-[var(--color-border-subtle)]/40 border border-[var(--color-border)] flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="font-mono text-xs font-bold text-[var(--color-foreground)]">
                    {r.key}
                  </div>
                  <div className="text-[11px] text-[var(--color-muted)] mt-0.5">
                    Requests tracked by the {r.key} limiter.
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--color-primary)] pt-1 border-t border-[var(--color-border-subtle)]">
                  <span>{r.requests} requests</span>
                  <span>per {r.window}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
