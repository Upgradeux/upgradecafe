import Link from "next/link";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { Card } from "@/components/ui/Card";
import { db } from "@/lib/db";
import { cafeMemberships } from "@/lib/db/schema/memberships";
import { cafes } from "@/lib/db/schema/cafes";
import { requireAuth } from "@/lib/permissions/guards";

export default async function SelectCafePage() {
  let user;
  try {
    user = await requireAuth();
  } catch {
    redirect("/admin/login");
  }

  if (user.mustChangePassword) redirect("/account/change-password");
  if (user.role === "SUPER_ADMIN") redirect("/admin");

  const memberships = await db
    .select({ id: cafes.id, name: cafes.name, slug: cafes.slug, status: cafes.status })
    .from(cafeMemberships)
    .innerJoin(cafes, eq(cafeMemberships.cafeId, cafes.id))
    .where(and(eq(cafeMemberships.userId, user.id), eq(cafeMemberships.isActive, true)));

  if (memberships.length === 1) redirect(`/cafe/${memberships[0].slug}`);

  return (
    <main className="min-h-screen bg-[var(--color-background)] p-6">
      <div className="mx-auto max-w-2xl space-y-5">
        <header>
          <h1 className="text-xl font-semibold text-[var(--color-foreground)]">Choose a café</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Select a café account to continue.</p>
        </header>

        {memberships.length === 0 ? (
          <Card className="border border-[var(--color-border)] p-5 text-sm text-[var(--color-muted)]">
            This login is not assigned to a café yet. Contact the UpgradeCafe platform administrator.
          </Card>
        ) : (
          <div className="grid gap-3">
            {memberships.map((cafe) => (
              <Link key={cafe.id} href={`/cafe/${cafe.slug}`}>
                <Card className="border border-[var(--color-border)] p-5 transition-colors hover:border-[var(--color-primary)]">
                  <div className="font-medium text-[var(--color-foreground)]">{cafe.name}</div>
                  <div className="mt-1 text-xs text-[var(--color-muted)]">/{cafe.slug} · {cafe.status}</div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
