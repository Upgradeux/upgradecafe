"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/Card";
import {
  IconCalendar,
  IconTrendingUp,
  IconCurrencyRupee,
  IconReceipt,
  IconArmchair,
  IconChartBar,
  IconClock,
  IconStar,
} from "@tabler/icons-react";

interface CafeAnalyticsManagerProps {
  cafeSlug: string;
  cafeName: string;
}

const revenueTrends = [
  { day: "Mon", revenue: 4200, orders: 19 },
  { day: "Tue", revenue: 3800, orders: 16 },
  { day: "Wed", revenue: 5100, orders: 22 },
  { day: "Thu", revenue: 4900, orders: 20 },
  { day: "Fri", revenue: 7400, orders: 31 },
  { day: "Sat", revenue: 9800, orders: 42 },
  { day: "Sun", revenue: 8600, orders: 38 },
];

const rushHours = [
  { hour: "8 AM", guests: 12 },
  { hour: "10 AM", guests: 28 },
  { hour: "12 PM", guests: 45 },
  { hour: "2 PM", guests: 24 },
  { hour: "4 PM", guests: 32 },
  { hour: "6 PM", guests: 58 },
  { hour: "8 PM", guests: 64 },
  { hour: "10 PM", guests: 18 },
];

const categoryDistribution = [
  { name: "Espresso & Classics", value: 38, color: "#8B5E3C" },
  { name: "Artisanal Bakery", value: 32, color: "#D89B72" },
  { name: "Cold Brews & Tonics", value: 18, color: "#10B981" },
  { name: "Manual Pourovers", value: 12, color: "#F59E0B" },
];

const topDishes = [
  { name: "Smoked Chicken & Pesto Panini", category: "Bakery", sold: 64, revenue: 21760, tag: "NON_VEG" },
  { name: "Cortado", category: "Espresso", sold: 82, revenue: 14760, tag: "VEG" },
  { name: "Nitro Cold Brew", category: "Cold Brews", sold: 58, revenue: 13920, tag: "VEGAN" },
  { name: "Truffle Scrambled Egg Croissant", category: "Bakery", sold: 46, revenue: 12880, tag: "EGG" },
  { name: "Almond Frangipane Croissant", category: "Bakery", sold: 52, revenue: 10140, tag: "EGG" },
];

export const CafeAnalyticsManager: React.FC<CafeAnalyticsManagerProps> = ({
  cafeName,
}) => {
  const [timeRange, setTimeRange] = useState<"week" | "month">("week");

  const totalWeeklyRevenue = revenueTrends.reduce((acc, r) => acc + r.revenue, 0);
  const totalWeeklyOrders = revenueTrends.reduce((acc, r) => acc + r.orders, 0);

  return (
    <div className="space-y-6">
      {/* Header with Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--color-foreground)]">
            Café Business Analytics
          </h2>
          <p className="text-xs text-[var(--color-muted)]">
            Comprehensive sales trends, peak rush hours, and menu performance for {cafeName}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-[var(--radius-button)] bg-[var(--color-background)] border border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setTimeRange("week")}
              className={`px-3 py-1 rounded-[var(--radius-button)] text-xs font-semibold transition-colors cursor-pointer ${
                timeRange === "week"
                  ? "bg-[var(--color-primary)] text-white shadow-xs"
                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeRange("month")}
              className={`px-3 py-1 rounded-[var(--radius-button)] text-xs font-semibold transition-colors cursor-pointer ${
                timeRange === "month"
                  ? "bg-[var(--color-primary)] text-white shadow-xs"
                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              This Month
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              Total Revenue
            </span>
            <div className="p-2 rounded-[var(--radius-button)] bg-[var(--color-primary-light)] text-[var(--color-primary)]">
              <IconCurrencyRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
              ₹{totalWeeklyRevenue.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <IconTrendingUp className="w-3.5 h-3.5" />
              <span>+18.4% vs previous week</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 border border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              Total Orders
            </span>
            <div className="p-2 rounded-[var(--radius-button)] bg-[var(--color-border-subtle)] text-[var(--color-foreground)]">
              <IconReceipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
              {totalWeeklyOrders}
            </div>
            <div className="text-xs text-[var(--color-muted)] mt-1">
              Avg. 27 orders / day
            </div>
          </div>
        </Card>

        <Card className="p-5 border border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              Average Order Value
            </span>
            <div className="p-2 rounded-[var(--radius-button)] bg-emerald-50 text-emerald-700">
              <IconReceipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
              ₹{Math.round(totalWeeklyRevenue / totalWeeklyOrders)}
            </div>
            <div className="text-xs text-[var(--color-muted)] mt-1">
              Across all dining & QR tables
            </div>
          </div>
        </Card>

        <Card className="p-5 border border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              Table Turn Time
            </span>
            <div className="p-2 rounded-[var(--radius-button)] bg-amber-50 text-amber-700">
              <IconClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
              42 mins
            </div>
            <div className="text-xs text-[var(--color-muted)] mt-1">
              Average customer seating duration
            </div>
          </div>
        </Card>
      </div>

      {/* Row 2: Revenue Trend & Rush Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue AreaChart */}
        <Card className="p-6 border border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-[var(--color-foreground)]">
                Daily Revenue Trend
              </h3>
              <p className="text-xs text-[var(--color-muted)]">
                Gross sales volume across the last 7 operational days.
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsSalesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5E3C" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8B5E3C" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--color-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-muted)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8B5E3C" strokeWidth={2.5} fillOpacity={1} fill="url(#analyticsSalesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Rush Hours BarChart */}
        <Card className="p-6 border border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-[var(--color-foreground)]">
                Peak Customer Rush Hours
              </h3>
              <p className="text-xs text-[var(--color-muted)]">
                Footfall distribution from morning coffee to late evening.
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rushHours} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "var(--color-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-muted)" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(val: any) => [`${val} guests`, "Seated Guests"]} />
                <Bar dataKey="guests" fill="#D89B72" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Row 3: Category Breakdown & Top Bestsellers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Split */}
        <Card className="p-6 border border-[var(--color-border)] lg:col-span-1">
          <h3 className="text-sm font-bold tracking-tight text-[var(--color-foreground)] mb-1">
            Category Revenue Share
          </h3>
          <p className="text-xs text-[var(--color-muted)] mb-4">
            Proportion of sales by menu category.
          </p>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => [`${v}%`, "Share"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-[var(--color-border-subtle)]">
            {categoryDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-[var(--color-muted)]">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </span>
                <span className="font-bold text-[var(--color-foreground)]">{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top 5 Bestsellers */}
        <Card className="p-6 border border-[var(--color-border)] lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-[var(--color-foreground)]">
                Top Performing Menu Items
              </h3>
              <p className="text-xs text-[var(--color-muted)]">
                Highest selling food and beverage items by revenue and order volume.
              </p>
            </div>
            <IconStar className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>

          <div className="divide-y divide-[var(--color-border-subtle)]">
            {topDishes.map((dish, i) => (
              <div key={dish.name} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-bold flex items-center justify-center text-[var(--color-muted)]">
                    #{i + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--color-foreground)]">
                        {dish.name}
                      </span>
                      {dish.tag === "NON_VEG" && (
                        <span className="w-3.5 h-3.5 rounded border border-red-700 flex items-center justify-center bg-white" title="Non-Veg">
                          <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-red-700" />
                        </span>
                      )}
                      {dish.tag === "VEG" && (
                        <span className="w-3.5 h-3.5 rounded border border-emerald-600 flex items-center justify-center bg-white" title="Veg">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        </span>
                      )}
                      {dish.tag === "EGG" && (
                        <span className="w-3.5 h-3.5 rounded border border-amber-600 flex items-center justify-center bg-white" title="Egg">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                        </span>
                      )}
                      {dish.tag === "VEGAN" && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-teal-50 text-teal-700 font-semibold">
                          Vegan
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[var(--color-muted)]">
                      {dish.category}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-[var(--color-foreground)]">
                    ₹{dish.revenue.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] text-[var(--color-muted)]">
                    {dish.sold} sold
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
