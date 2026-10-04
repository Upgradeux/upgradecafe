"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActivityLogItem } from "../services/activity-admin.service";
import { IconHistory, IconCode } from "@tabler/icons-react";

export interface ActivityLogTableProps {
  logs: ActivityLogItem[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export const ActivityLogTable: React.FC<ActivityLogTableProps> = ({
  logs,
  total,
  page,
  totalPages,
  onPageChange,
  isLoading = false,
}) => {
  const [inspectLog, setInspectLog] = useState<ActivityLogItem | null>(null);

  const getActionBadgeVariant = (
    action?: string
  ): "primary" | "active" | "grace" | "suspended" | "neutral" => {
    if (!action) return "neutral";
    if (action.includes("CREATE")) return "active";
    if (action.includes("SUSPEND")) return "suspended";
    if (action.includes("REACTIVATE")) return "active";
    if (action.includes("PAYMENT")) return "primary";
    if (action.includes("ARCHIVE")) return "neutral";
    return "grace";
  };

  return (
    <>
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-[var(--shadow-card)]">
        {isLoading ? (
          <div className="p-10 text-center text-xs text-[var(--color-muted)]">
            Loading activity audit logs...
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={<IconHistory className="w-6 h-6" />}
            title="No audit logs recorded"
            description="Sensitive Super Admin operations will be captured here."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target Entity</TableHead>
                <TableHead>Café Tenant</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead className="text-right">Metadata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-[var(--color-muted)] font-mono whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </TableCell>

                  <TableCell>
                    <Badge variant={getActionBadgeVariant(log.action)}>
                      {log.action ? log.action.replace("ADMIN_", "") : "ACTIVITY"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-xs font-medium">
                    {log.entityType || "Item"} ({log.entityId ? `${log.entityId.slice(0, 8)}...` : "—"})
                  </TableCell>

                  <TableCell>
                    {log.cafeId ? (
                      <Link
                        href={`/admin/cafes/${log.cafeId}`}
                        className="text-xs font-semibold text-[var(--color-foreground)] hover:text-[var(--color-primary)]"
                      >
                        {log.cafeName || "Café"}
                      </Link>
                    ) : (
                      <span className="text-xs text-[var(--color-muted)]">Platform</span>
                    )}
                  </TableCell>

                  <TableCell className="text-xs">
                    <span className="font-medium text-[var(--color-foreground)]">
                      {log.actorName}
                    </span>
                    <span className="text-[11px] text-[var(--color-muted)] block">
                      {log.actorEmail}
                    </span>
                  </TableCell>

                  <TableCell className="text-xs font-mono text-[var(--color-muted)]">
                    {log.ipAddress || "—"}
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInspectLog(log)}
                      leftIcon={<IconCode className="w-3.5 h-3.5" />}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="border-t border-[var(--color-border-subtle)] px-4 py-2 bg-[var(--color-surface)]">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            onPageChange={onPageChange}
          />
        </div>
      </div>

      {/* Metadata Inspector Modal */}
      {inspectLog && (
        <Modal
          isOpen={true}
          onClose={() => setInspectLog(null)}
          title={`Audit Payload: ${inspectLog.action}`}
          description={`Logged on ${new Date(inspectLog.createdAt).toLocaleString("en-IN")}`}
          maxWidth="md"
        >
          <div className="space-y-3">
            <div className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
              Sanitized Metadata (JSON)
            </div>
            <pre className="p-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-button)] text-xs font-mono overflow-x-auto text-[var(--color-foreground)] max-h-60">
              {JSON.stringify(inspectLog.metadata, null, 2)}
            </pre>
            <div className="flex justify-end pt-2">
              <Button size="sm" variant="outline" onClick={() => setInspectLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
