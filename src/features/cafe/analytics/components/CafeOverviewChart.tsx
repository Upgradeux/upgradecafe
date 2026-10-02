"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { IconChartLine, IconTrendingUp } from "@tabler/icons-react";

interface HourlyDataPoint {
  time: string;
  sales: number;
  orders: number;
  occupancy: number; // percentage
}

const hourlyData: HourlyDataPoint[] = [
  { time: "08:00", sales: 420, orders: 3, occupancy: 20 },
  { time: "09:30", sales: 890, orders: 5, occupancy: 50 },
  { time: "11:00", sales: 1250, orders: 7, occupancy: 70 },
  { time: "12:30", sales: 1840, orders: 9, occupancy: 85 },
  { time: "14:00", sales: 1100, orders: 6, occupancy: 60 },
  { time: "16:00", sales: 780, orders: 4, occupancy: 40 },
  { time: "17:30", sales: 1650, orders: 8, occupancy: 80 },
  { time: "19:00", sales: 2100, orders: 11, occupancy: 95 },
  { time: "20:30", sales: 1450, orders: 7, occupancy: 65 },
  { time: "22:00", sales: 620, orders: 3, occupancy: 30 },
];

export const CafeOverviewChart: React.FC = () => {
  const [metric, setMetric] = useState<"sales" | "occupancy">("sales");

  const totalSalesToday = hourlyData.reduce((acc, d) => acc + d.sales, 0);
  const totalOrdersToday = hourlyData.reduce((acc, d) => acc + d.orders, 0);

  return (
    <Card className="p-4 border border-[var(--color-border)] shadow-xs rounded-lg">
      {/* Header with metric toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)]">
              <IconChartLine className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-medium tracking-tight text-[var(--color-foreground)]">
              Today's Live Sales & Rush Activity
            </h2>
          </div>
          <p className="text-[11px] text-[var(--color-muted)] mt-0.5 font-normal">
            Real-time hourly breakdown of revenue, customer rush, and table occupancy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 rounded-md bg-[var(--color-background)] border border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setMetric("sales")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                metric === "sales"
                  ? "bg-[var(--color-primary)] text-white shadow-xs"
                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              Revenue (₹)
            </button>
            <button
              type="button"
              onClick={() => setMetric("occupancy")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                metric === "occupancy"
                  ? "bg-[var(--color-primary)] text-white shadow-xs"
                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              Floor Occupancy %
            </button>
          </div>
        </div>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        <div className="p-2.5 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] shadow-xs">
          <span className="text-[10px] uppercase font-medium text-[var(--color-muted)]">
            Total Revenue
          </span>
          <div className="text-base font-semibold text-[var(--color-foreground)] mt-0.5">
            ₹{totalSalesToday.toLocaleString("en-IN")}
          </div>
        </div>

        <div className="p-2.5 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] shadow-xs">
          <span className="text-[10px] uppercase font-medium text-[var(--color-muted)]">
            Total Orders
          </span>
          <div className="text-base font-semibold text-[var(--color-foreground)] mt-0.5">
            {totalOrdersToday} orders
          </div>
        </div>

        <div className="p-2.5 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] shadow-xs">
          <span className="text-[10px] uppercase font-medium text-[var(--color-muted)]">
            Avg. Order Ticket
          </span>
          <div className="text-base font-semibold text-[var(--color-foreground)] mt-0.5">
            ₹{Math.round(totalSalesToday / totalOrdersToday)}
          </div>
        </div>

        <div className="p-2.5 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] shadow-xs">
          <span className="text-[10px] uppercase font-medium text-[var(--color-muted)]">
            Peak Rush Window
          </span>
          <div className="text-base font-semibold text-[var(--color-primary)] mt-0.5 flex items-center gap-1">
            <IconTrendingUp className="w-3.5 h-3.5" />
            <span>18:30 - 20:30</span>
          </div>
        </div>
      </div>

      {/* Recharts Area Container */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5E3C" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8B5E3C" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="occupancyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: "var(--color-muted)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--color-muted)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (metric === "sales" ? `₹${v}` : `${v}%`)}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload as HourlyDataPoint;
                return (
                  <div className="p-2.5 rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-md text-xs">
                    <div className="font-bold text-[var(--color-foreground)] mb-1">
                      {d.time} Rush Hour
                    </div>
                    <div className="text-[var(--color-primary)] font-semibold">
                      Revenue: ₹{d.sales.toLocaleString("en-IN")}
                    </div>
                    <div className="text-[var(--color-muted)] text-[11px]">
                      Completed Orders: {d.orders}
                    </div>
                    <div className="text-emerald-700 font-medium text-[11px] mt-0.5">
                      Seating Occupancy: {d.occupancy}%
                    </div>
                  </div>
                );
              }}
            />
            {metric === "sales" ? (
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#8B5E3C"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#salesGrad)"
              />
            ) : (
              <Area
                type="monotone"
                dataKey="occupancy"
                stroke="#10B981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#occupancyGrad)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
