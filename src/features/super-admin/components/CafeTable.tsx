"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { CafeStatusBadge } from "./CafeStatusBadge";
import { CafeListItem } from "../services/cafe-admin.service";
import {
  IconSearch,
  IconDotsVertical,
  IconEye,
  IconEdit,
  IconReceipt,
  IconPlayerPause,
  IconPlayerPlay,
  IconArchive,
  IconCoffee,
  IconExternalLink,
} from "@tabler/icons-react";

export interface CafeTableProps {
  cafes: CafeListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  searchQuery: string;
  statusFilter: string;
  onSearchChange: (search: string) => void;
  onStatusChange: (status: string) => void;
  onPageChange: (page: number) => void;
  onRecordPayment: (cafe: CafeListItem) => void;
  onToggleStatus: (cafe: CafeListItem, action: "SUSPEND" | "REACTIVATE" | "ARCHIVE") => void;
  isLoading?: boolean;
}

export const CafeTable: React.FC<CafeTableProps> = ({
  cafes,
  total,
  page,
  pageSize,
  totalPages,
  searchQuery,
  statusFilter,
  onSearchChange,
  onStatusChange,
  onPageChange,
  onRecordPayment,
  onToggleStatus,
  isLoading = false,
}) => {
  const router = useRouter();
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const statusTabs = [
    { id: "ALL", label: "All" },
    { id: "ACTIVE", label: "Active" },
    { id: "GRACE", label: "In Grace" },
    { id: "SUSPENDED", label: "Suspended" },
    { id: "ARCHIVED", label: "Archived" },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(localSearch);
  };

  return (
    <div className="space-y-4">
      {/* Controls: Search & Status Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onStatusChange(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-[var(--color-primary)] text-white font-semibold"
                  : "bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] border border-[var(--color-border)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-sm w-full">
          <Input
            placeholder="Search café name, slug, email..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            leftIcon={<IconSearch className="w-4 h-4 text-[var(--color-muted)]" />}
            className="text-xs h-8.5"
          />
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>
      </div>

      {/* Table Container */}
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-[var(--shadow-card)]">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[var(--color-muted)]">
            Loading café tenants...
          </div>
        ) : cafes.length === 0 ? (
          <EmptyState
            icon={<IconCoffee className="w-6 h-6" />}
            title="No cafés found"
            description="No café records match your search criteria. You can create a new café or adjust filters."
            actionLabel="Create Café"
            onAction={() => router.push("/admin/cafes/new")}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Café Tenant</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Plan & Expiry</TableHead>
                <TableHead>Access State</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cafes.map((cafe) => {
                const isSuspended = cafe.accessState.status === "SUSPENDED";
                const isArchived = cafe.accessState.status === "ARCHIVED";

                return (
                  <TableRow key={cafe.id}>
                    {/* Cafe info */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-white border border-[var(--color-border)] flex-shrink-0 p-1 flex items-center justify-center overflow-hidden shadow-2xs">
                          {cafe.logoKey ? (
                            <img
                              src={cafe.logoKey}
                              alt={cafe.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-xs font-bold text-[var(--color-primary)]">
                              {cafe.name.substring(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <Link
                            href={`/admin/cafes/${cafe.id}`}
                            className="font-semibold text-[var(--color-foreground)] hover:text-[var(--color-primary)] transition-colors truncate"
                          >
                            {cafe.name}
                          </Link>
                          <a
                            href={`/cafe/${cafe.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-[var(--color-primary)] hover:underline font-mono inline-flex items-center gap-0.5 mt-0.5"
                            title="Open Café Operations Portal"
                          >
                            /{cafe.slug}
                            <IconExternalLink className="w-3 h-3 inline ml-0.5" />
                          </a>
                        </div>
                      </div>
                    </TableCell>

                    {/* Owner info */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-[var(--color-foreground)]">
                          {cafe.ownerName || "Unassigned"}
                        </span>
                        <span className="text-[11px] text-[var(--color-muted)]">
                          {cafe.ownerEmail || cafe.contactEmail || "N/A"}
                        </span>
                      </div>
                    </TableCell>

                    {/* Plan & Expiry */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-[var(--color-foreground)]">
                          {cafe.planName}
                        </span>
                        <span className="text-[11px] text-[var(--color-muted)]">
                          {cafe.subscriptionExpiresAt
                            ? new Date(cafe.subscriptionExpiresAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "No expiry"}
                        </span>
                      </div>
                    </TableCell>

                    {/* Access State Badge */}
                    <TableCell>
                      <CafeStatusBadge accessState={cafe.accessState} />
                    </TableCell>

                    {/* Created Date */}
                    <TableCell className="text-[12px] text-[var(--color-muted)]">
                      {new Date(cafe.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>

                    {/* Actions Menu */}
                    <TableCell className="text-right">
                      <Dropdown
                        align="right"
                        trigger={
                          <button
                            type="button"
                            className="p-1 rounded-[var(--radius-button)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)] transition-colors cursor-pointer"
                            aria-label="Actions"
                          >
                            <IconDotsVertical className="w-4 h-4" />
                          </button>
                        }
                        items={[
                          {
                            label: "Open Café Portal",
                            icon: <IconExternalLink className="w-3.5 h-3.5 text-[var(--color-primary)]" />,
                            onClick: () => window.open(`/cafe/${cafe.slug}`, "_blank"),
                          },
                          {
                            label: "View Overview",
                            icon: <IconEye className="w-3.5 h-3.5" />,
                            onClick: () => router.push(`/admin/cafes/${cafe.id}`),
                          },
                          {
                            label: "Edit Details",
                            icon: <IconEdit className="w-3.5 h-3.5" />,
                            onClick: () =>
                              router.push(`/admin/cafes/${cafe.id}/edit`),
                          },
                          {
                            label: "Record Payment",
                            icon: <IconReceipt className="w-3.5 h-3.5 text-[var(--color-primary)]" />,
                            onClick: () => onRecordPayment(cafe),
                          },
                          isSuspended
                            ? {
                                label: "Reactivate Access",
                                icon: <IconPlayerPlay className="w-3.5 h-3.5 text-[var(--color-success)]" />,
                                onClick: () => onToggleStatus(cafe, "REACTIVATE"),
                              }
                            : {
                                label: "Suspend Café",
                                icon: <IconPlayerPause className="w-3.5 h-3.5 text-[var(--color-danger)]" />,
                                variant: "danger",
                                disabled: isArchived,
                                onClick: () => onToggleStatus(cafe, "SUSPEND"),
                              },
                          {
                            label: "Archive Café",
                            icon: <IconArchive className="w-3.5 h-3.5 text-[var(--color-muted)]" />,
                            disabled: isArchived,
                            onClick: () => onToggleStatus(cafe, "ARCHIVE"),
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* Server Pagination */}
        <div className="border-t border-[var(--color-border-subtle)] px-4 py-2 bg-[var(--color-surface)]">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={onPageChange}
          />
        </div>
      </div>
    </div>
  );
};
