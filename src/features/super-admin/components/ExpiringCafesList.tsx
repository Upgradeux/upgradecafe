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
}) => {
  return (
    <Card className="border border-[var(--color-border)] h-full flex flex-col">
      <CardHeader className="py-3.5 px-5 flex items-center justify-between border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-2">
          <IconClock className="w-4 h-4 text-[var(--color-warning)]" />
          <CardTitle className="text-sm">Expiring Soon & In Grace</CardTitle>
        </div>
        <Link
          href="/admin/cafes?status=GRACE"
          className="text-xs text-[var(--color-primary)] hover:underline font-medium"
        >
          View all
        </Link>
      </CardHeader>

      <CardContent className="p-0 divide-y divide-[var(--color-border-subtle)] flex-1">
        {cafes.length === 0 ? (
          <div className="p-6 text-center text-xs text-[var(--color-muted)]">
            No cafés currently in grace period or expiring soon.
          </div>
        ) : (
          cafes.slice(0, 5).map((cafe) => (
            <div
              key={cafe.id}
              className="p-4 flex items-center justify-between hover:bg-[var(--color-border-subtle)]/40 transition-colors gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/cafes/${cafe.id}`}
                    className="text-xs font-semibold text-[var(--color-foreground)] hover:text-[var(--color-primary)] truncate"
                  >
                    {cafe.name}
                  </Link>
                  <Badge variant={cafe.accessState.status === "GRACE" ? "grace" : "warning"} size="sm">
                    {cafe.accessState.status === "GRACE"
                      ? `${cafe.accessState.daysRemainingInPeriod}d grace left`
                      : "Expiring"}
                  </Badge>
                </div>
                <div className="text-[11px] text-[var(--color-muted)] truncate mt-0.5">
                  Owner: {cafe.ownerEmail || cafe.contactEmail || "N/A"} • Plan: {cafe.planName}
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {onRecordPaymentClick && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRecordPaymentClick(cafe)}
                    leftIcon={<IconReceipt className="w-3.5 h-3.5 text-[var(--color-primary)]" />}
                  >
                    Pay
                  </Button>
                )}
                <Link href={`/admin/cafes/${cafe.id}`}>
                  <Button variant="ghost" size="sm" className="px-2">
                    <IconChevronRight className="w-4 h-4 text-[var(--color-muted)]" />
                  </Button>
                </Link>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
