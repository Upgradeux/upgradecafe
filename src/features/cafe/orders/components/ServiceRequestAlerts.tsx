"use client";

import React from "react";
import { ServiceRequest } from "@/lib/db/schema/orders";
import {
  IconBellRinging,
  IconDroplet,
  IconReceipt,
  IconMessageDots,
  IconCheck,
  IconArmchair,
} from "@tabler/icons-react";

interface ServiceRequestAlertsProps {
  requests: ServiceRequest[];
  onAcknowledge: (requestId: string) => Promise<void>;
  isAcknowledging?: string | null;
}

export const ServiceRequestAlerts: React.FC<ServiceRequestAlertsProps> = ({
  requests,
  onAcknowledge,
  isAcknowledging,
}) => {
  if (requests.length === 0) return null;

  const getRequestMeta = (type: string) => {
    switch (type) {
      case "CALL_WAITER":
        return {
          label: "Waiter Requested",
          icon: <IconBellRinging className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-bounce" />,
          color: "border-amber-200 bg-amber-50/90 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-200",
        };
      case "NEED_WATER":
        return {
          label: "Water Refill",
          icon: <IconDroplet className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />,
          color: "border-blue-200 bg-blue-50/90 text-blue-900 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-200",
        };
      case "REQUEST_BILL":
        return {
          label: "Bill Requested",
          icon: <IconReceipt className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
          color: "border-emerald-200 bg-emerald-50/90 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-200",
        };
      default:
        return {
          label: "Guest Assistance",
          icon: <IconMessageDots className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />,
          color: "border-purple-200 bg-purple-50/90 text-purple-900 dark:bg-purple-950/40 dark:border-purple-900 dark:text-purple-200",
        };
    }
  };

  const formatElapsed = (createdDate: Date | string) => {
    const elapsedSeconds = Math.max(
      0,
      Math.floor((Date.now() - new Date(createdDate).getTime()) / 1000)
    );
    const mins = Math.floor(elapsedSeconds / 60);
    if (mins < 1) return "Just now";
    return `${mins}m ago`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
        <IconBellRinging className="w-3.5 h-3.5 text-amber-500" />
        <span>Table Service Calls ({requests.length})</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {requests.map((req) => {
          const meta = getRequestMeta(req.requestType);
          const isActing = isAcknowledging === req.id;

          return (
            <div
              key={req.id}
              className={`p-3 rounded-md border flex items-center justify-between gap-3 shadow-xs transition-all ${meta.color}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-md bg-white/80 dark:bg-black/20 flex-shrink-0 shadow-xs">
                  {meta.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs truncate">
                      {req.tableNameSnapshot}
                    </span>
                    <span className="text-[10px] opacity-75">•</span>
                    <span className="text-[11px] font-medium truncate">
                      {meta.label}
                    </span>
                  </div>
                  <div className="text-[10px] opacity-80 mt-0.5 truncate">
                    {req.notes ? `"${req.notes}" • ` : ""}
                    {formatElapsed(req.createdAt)}
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={isActing}
                onClick={() => onAcknowledge(req.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-white dark:bg-black/40 border border-current/20 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0 shadow-xs"
                title="Mark request as attended"
              >
                <IconCheck className="w-3.5 h-3.5" />
                <span>{isActing ? "Attending..." : "Attended"}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
