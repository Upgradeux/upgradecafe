import React from "react";

interface TableAvatarProps {
  tableNumber: string;
  capacity?: number;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Cleanly generates a concise, readable 2-3 character short code for any table name
 * Examples:
 * - "Table 01" -> "T01"
 * - "Table 14" -> "T14"
 * - "Balcony 01" -> "B01"
 * - "Community Table" -> "CT"
 * - "Bar Counter 2" -> "BC2"
 * - "Window 3" -> "W03"
 * - "Booth A" -> "BA"
 */
export function getTableShortCode(name: string): string {
  if (!name) return "T";
  const trimmed = name.trim();

  // Match "Table 01", "Table 2", "T-01", etc.
  const tableMatch = trimmed.match(/^table\s*[-_#]?\s*(\d+)$/i);
  if (tableMatch) {
    const num = tableMatch[1];
    return `T${num.padStart(2, "0")}`;
  }

  // Match "Balcony 01", "Window 02", "Booth 3"
  const wordNumMatch = trimmed.match(/^([a-zA-Z]+)\s*[-_#]?\s*(\d+)$/i);
  if (wordNumMatch) {
    const letter = wordNumMatch[1][0].toUpperCase();
    const num = wordNumMatch[2];
    return `${letter}${num.padStart(2, "0")}`;
  }

  // Multi-word names without numbers: "Community Table" -> "CT", "VIP Lounge" -> "VL"
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  // Single word: "Community" -> "COM"
  if (trimmed.length <= 4) {
    return trimmed.toUpperCase();
  }
  return trimmed.substring(0, 3).toUpperCase();
}

export const TableAvatar: React.FC<TableAvatarProps> = ({
  tableNumber,
  capacity,
  size = "md",
  className = "",
}) => {
  const shortCode = getTableShortCode(tableNumber);

  if (size === "sm") {
    return (
      <div
        className={`w-8 h-8 rounded-[var(--radius-button)] bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-center font-bold text-[11px] text-[var(--color-foreground)] flex-shrink-0 overflow-hidden select-none ${className}`}
        title={tableNumber}
      >
        <span className="truncate px-0.5 leading-none">{shortCode}</span>
      </div>
    );
  }

  return (
    <div
      className={`w-10 h-10 rounded-[var(--radius-button)] bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col items-center justify-center font-bold text-xs text-[var(--color-foreground)] shadow-2xs flex-shrink-0 overflow-hidden select-none ${className}`}
      title={tableNumber}
    >
      <span className="truncate px-0.5 leading-none">{shortCode}</span>
      {capacity !== undefined && (
        <span className="text-[9px] font-normal text-[var(--color-muted)] leading-none mt-0.5">
          {capacity}s
        </span>
      )}
    </div>
  );
};
