import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { IconClock, IconReceipt, IconChevronRight } from "@tabler/icons-react";
import { CafeListItem } from "../services/cafe-admin.service";

export interface ExpiringCafesListProps {
  cafes: CafeListItem[];
  onRecordPaymentClick?: (cafe: CafeListItem) => void;
}

export const ExpiringCafesList: React.FC<ExpiringCafesListProps> = ({
  cafes,
  onRecordPaymentClick,
}) => (
  <Card className="flex h-full min-w-0 flex-col overflow-hidden">
    <CardHeader className="px-4 py-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <IconClock className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden="true" />
        <CardTitle className="truncate text-sm">Expiring soon</CardTitle>
      </div>
      <Link href="/admin/cafes?status=GRACE" className="shrink-0 text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
        View all
      </Link>
    </CardHeader>

    <CardContent className="flex-1 divide-y divide-[var(--color-border-subtle)] p-0">
      {cafes.length === 0 ? (
        <div className="px-4 py-9 text-center">
          <p className="text-sm font-medium text-[var(--color-foreground)]">All cafes are up to date</p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">No subscriptions are expiring soon.</p>
        </div>
      ) : (
        cafes.slice(0, 5).map((cafe) => {
          const inGrace = cafe.accessState.status === "GRACE";
          return (
            <div key={cafe.id} className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-neutral-50 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Link href={`/admin/cafes/${cafe.id}`} className="max-w-full truncate text-sm font-medium text-[var(--color-foreground)] hover:underline">
                    {cafe.name}
                  </Link>
                  <Badge variant={inGrace ? "grace" : "warning"} size="sm">
                    {inGrace ? `${cafe.accessState.daysRemainingInPeriod}d grace` : "Expiring"}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-[var(--color-muted)]">
                  {cafe.ownerEmail || cafe.contactEmail || "No owner email"} <span aria-hidden="true">·</span> {cafe.planName}
                </p>
              </div>

              <div className="flex items-center justify-between gap-1.5 sm:justify-end">
                {onRecordPaymentClick && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRecordPaymentClick(cafe)}
                    leftIcon={<IconReceipt className="h-3.5 w-3.5" aria-hidden="true" />}
                  >
                    Record payment
                  </Button>
                )}
                <Link href={`/admin/cafes/${cafe.id}`} aria-label={`Open ${cafe.name}`} className="rounded-md p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-border-subtle)] hover:text-[var(--color-foreground)]">
                  <IconChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          );
        })
      )}
    </CardContent>
  </Card>
);
