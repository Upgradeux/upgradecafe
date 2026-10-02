import React from "react";
import { Badge } from "@/components/ui/Badge";
import { CafeAccessState } from "@/server/services/access-state.service";

export interface CafeStatusBadgeProps {
  accessState: CafeAccessState;
  showDaysRemaining?: boolean;
}

export const CafeStatusBadge: React.FC<CafeStatusBadgeProps> = ({
  accessState,
  showDaysRemaining = true,
}) => {
  const { status, daysRemainingInPeriod, hasManualOverride, manualOverrideStatus } = accessState;

  const variantMap: Record<string, "active" | "grace" | "suspended" | "archived"> = {
    ACTIVE: "active",
    GRACE: "grace",
    SUSPENDED: "suspended",
    ARCHIVED: "archived",
  };

  const variant = variantMap[status] || "archived";

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <Badge variant={variant} showDot>
        {status}
        {status === "GRACE" && showDaysRemaining && (
          <span className="font-normal opacity-90">({daysRemainingInPeriod}d left)</span>
        )}
      </Badge>

      {hasManualOverride && (
        <span
          title={`Manually forced to ${manualOverrideStatus} by Super Admin`}
          className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-[var(--color-border-subtle)] text-[var(--color-muted)] border border-[var(--color-border)]"
        >
          OVERRIDE
        </span>
      )}
    </div>
  );
};
