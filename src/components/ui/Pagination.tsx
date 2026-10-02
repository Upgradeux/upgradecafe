"use client";

import React from "react";
import { Button } from "./Button";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  onPageChange,
  className = "",
}) => {
  if (totalPages <= 1 && (!totalItems || totalItems <= pageSize)) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : currentPage * pageSize;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 py-3 px-1 text-xs text-[var(--color-muted)] ${className}`}
    >
      {totalItems !== undefined ? (
        <div>
          Showing <span className="font-semibold text-[var(--color-foreground)]">{startItem}</span> to{" "}
          <span className="font-semibold text-[var(--color-foreground)]">{endItem}</span> of{" "}
          <span className="font-semibold text-[var(--color-foreground)]">{totalItems}</span> results
        </div>
      ) : (
        <div>
          Page <span className="font-semibold text-[var(--color-foreground)]">{currentPage}</span> of{" "}
          <span className="font-semibold text-[var(--color-foreground)]">{totalPages}</span>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => {
            if (totalPages <= 5) return true;
            if (p === 1 || p === totalPages) return true;
            return Math.abs(p - currentPage) <= 1;
          })
          .map((p, index, array) => {
            const showEllipsis = index > 0 && p - array[index - 1] > 1;
            return (
              <React.Fragment key={p}>
                {showEllipsis && <span className="px-1 text-[var(--color-muted)]">...</span>}
                <button
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={`w-8 h-8 rounded-[var(--radius-button)] text-xs font-semibold transition-colors cursor-pointer ${
                    currentPage === p
                      ? "bg-[var(--color-primary)] text-white"
                      : "text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)]"
                  }`}
                >
                  {p}
                </button>
              </React.Fragment>
            );
          })}

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
