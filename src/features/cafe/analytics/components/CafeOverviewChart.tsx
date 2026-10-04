"use client";

import React, { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { IconChartLine, IconTrendingUp } from "@tabler/icons-react";

export interface CafeHourlyMetric {
  hour: string;
  revenue: number;
  orders: number;
  paidOrders: number;
}

interface CafeOverviewChartProps {
  hourlyData: CafeHourlyMetric[];
  currency: string;
}

export const CafeOverviewChart: React.FC<CafeOverviewChartProps> = ({
  hourlyData,
  currency,
}) => {
  const [metric, setMetric] = useState<"revenue" | "orders">("revenue");
  const totals = useMemo(
    () =>
      hourlyData.reduce(
        (acc, point) => ({
          revenue: acc.revenue + point.revenue,
          orders: acc.orders + point.orders,
          paidOrders: acc.paidOrders + point.paidOrders,
        }),
        { revenue: 0, orders: 0, paidOrders: 0 }
      ),
    [hourlyData]
  );
  const busiestHour = hourlyData.reduce<CafeHourlyMetric | null>(
    (busiest, point) => (point.orders > (busiest?.orders ?? 0) ? point : busiest),
    null
  );
  const formatMoney = (value: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

  return (
    <Card className="p-4 border border-[var(--color-border)] shadow-xs rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)]">
              <IconChartLine className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-medium tracking-tight text-[var(--color-foreground)]">
              Today’s order activity
            </h2>
          </div>
          <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
            Revenue includes orders marked as paid. Hours follow the café time zone.
          </p>
        </div>

        <div className="flex items-center p-0.5 rounded-md bg-[var(--color-background)] border border-[var(--color-border)]">
          {(["revenue", "orders"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMetric(value)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                metric === value
                  ? "bg-[var(--color-primary)] text-white shadow-xs"
                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              {value === "revenue" ? "Revenue" : "Orders"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        <Metric label="Revenue received" value={formatMoney(totals.revenue)} />
        <Metric label="Orders today" value={totals.orders.toLocaleString("en-IN")} />
        <Metric
          label="Average paid order"
          value={formatMoney(totals.paidOrders ? totals.revenue / totals.paidOrders : 0)}
        />
        <Metric
          label="Busiest hour"
          value={busiestHour && busiestHour.orders > 0 ? busiestHour.hour : "No orders yet"}
          icon={busiestHour && busiestHour.orders > 0 ? <IconTrendingUp className="w-3.5 h-3.5" /> : undefined}
        />
      </div>

      {totals.orders === 0 ? (
        <div className="h-52 flex items-center justify-center rounded-md border border-dashed border-[var(--color-border)] text-sm text-[var(--color-muted)]">
          No orders have been recorded today.
        </div>
      ) : (
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "var(--color-muted)" }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => metric === "revenue" ? formatMoney(Number(value)) : String(value)}
              />
              <Tooltip
                formatter={(value) =>
                  metric === "revenue"
                    ? [formatMoney(Number(value)), "Paid revenue"]
                    : [Number(value), "Orders"]
                }
                labelFormatter={(label) => `${label} (${currency})`}
                contentStyle={{ borderRadius: 8, borderColor: "var(--color-border)", fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey={metric}
                stroke="#8B5E3C"
                strokeWidth={2}
                fill="#8B5E3C"
                fillOpacity={0.12}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="p-2.5 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] shadow-xs">
      <span className="text-[10px] uppercase font-medium text-[var(--color-muted)]">{label}</span>
      <div className="text-base font-semibold text-[var(--color-foreground)] mt-0.5 flex items-center gap-1">
        {icon}
        {value}
      </div>
    </div>
  );
}
