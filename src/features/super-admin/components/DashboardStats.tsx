import React from "react";
import { Card } from "@/components/ui/Card";
import { IconCoffee, IconCircleCheck, IconClock, IconAlertTriangle, IconCash } from "@tabler/icons-react";

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
    {
      title: "Total Cafés",
      value: totalCafes,
      label: "Registered Tenants",
      icon: IconCoffee,
      color: "var(--color-primary)",
      indicatorBg: "bg-[var(--color-primary)]",
    },
    {
      title: "Active",
      value: activeCafes,
      label: "Operational & Live",
      icon: IconCircleCheck,
      color: "var(--color-success)",
      indicatorBg: "bg-[var(--color-success)]",
    },
    {
      title: "Grace Period",
      value: graceCafes,
      label: "Expiring within 7 days",
      icon: IconClock,
      color: "var(--color-warning)",
      indicatorBg: "bg-[var(--color-warning)]",
    },
    {
      title: "Suspended",
      value: suspendedCafes,
      label: "Access Restricted",
      icon: IconAlertTriangle,
      color: "var(--color-danger)",
      indicatorBg: "bg-[var(--color-danger)]",
    },
    {
      title: "Offline Revenue",
      value: `₹${(totalRevenue).toLocaleString("en-IN")}`,
      label: "Recorded offline fees",
      icon: IconCash,
      color: "var(--color-primary)",
      indicatorBg: "bg-[var(--color-primary)]",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <Card key={idx} className="relative overflow-hidden p-4 border border-[var(--color-border)]">
            <div className={`absolute top-0 left-0 bottom-0 w-1 ${card.indicatorBg}`} />
            <div className="pl-1.5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between text-[var(--color-muted)] mb-1">
                <span className="text-[12px] font-semibold tracking-wide uppercase">
                  {card.title}
                </span>
                <IconComponent className="w-4 h-4" style={{ color: card.color }} />
              </div>
              <div className="text-[28px] font-bold text-[var(--color-foreground)] tracking-tight leading-none my-1.5">
                {card.value}
              </div>
              <div className="text-[11px] text-[var(--color-muted)] font-normal">
                {card.label}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
