import React from "react";
import { Card } from "@/components/ui/Card";
import {
  IconCoffee,
  IconCircleCheck,
  IconClock,
  IconAlertTriangle,
  IconCash,
} from "@tabler/icons-react";

export interface DashboardStatsProps {
  totalCafes: number;
  activeCafes: number;
  graceCafes: number;
  suspendedCafes: number;
  totalRevenue: number;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  totalCafes,
  activeCafes,
  graceCafes,
  suspendedCafes,
  totalRevenue,
}) => {
  const cards = [
    { title: "Total cafes", value: totalCafes, detail: "All tenants", icon: IconCoffee },
    { title: "Active", value: activeCafes, detail: "Operational", icon: IconCircleCheck },
    { title: "Grace period", value: graceCafes, detail: "Expiring within 7 days", icon: IconClock },
    { title: "Suspended", value: suspendedCafes, detail: "Access restricted", icon: IconAlertTriangle },
    {
      title: "Offline revenue",
      value: `₹${totalRevenue.toLocaleString("en-IN")}`,
      detail: "Recorded platform fees",
      icon: IconCash,
    },
  ];

  return (
    <section aria-label="Platform metrics" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {cards.map(({ title, value, detail, icon: Icon }) => (
        <Card key={title} className="min-w-0 p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="truncate text-xs font-medium text-[var(--color-muted)]">{title}</h2>
            <Icon className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-semibold leading-none tracking-tight text-[var(--color-foreground)] sm:text-[26px]">
            {value}
          </p>
          <p className="mt-1.5 truncate text-[11px] text-[var(--color-muted)]">{detail}</p>
        </Card>
      ))}
    </section>
  );
};
