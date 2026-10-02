import React from "react";

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <div className="w-full overflow-x-auto">
    <table
      className={`w-full text-left text-[13px] text-[var(--color-foreground)] border-collapse ${className}`}
      {...props}
    >
      {children}
    </table>
  </div>
);

export const TableHeader: React.FC<
  React.HTMLAttributes<HTMLTableSectionElement>
> = ({ children, className = "", ...props }) => (
  <thead
    className={`bg-[var(--color-background)] border-b border-[var(--color-border)] uppercase text-[11px] font-semibold tracking-wider text-[var(--color-muted)] ${className}`}
    {...props}
  >
    {children}
  </thead>
);

export const TableBody: React.FC<
  React.HTMLAttributes<HTMLTableSectionElement>
> = ({ children, className = "", ...props }) => (
  <tbody
    className={`divide-y divide-[var(--color-border-subtle)] bg-[var(--color-surface)] ${className}`}
    {...props}
  >
    {children}
  </tbody>
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <tr
    className={`transition-colors duration-100 hover:bg-[var(--color-border-subtle)]/50 ${className}`}
    {...props}
  >
    {children}
  </tr>
);

export const TableHead: React.FC<
  React.ThHTMLAttributes<HTMLTableCellElement>
> = ({ children, className = "", ...props }) => (
  <th className={`px-4 py-3 font-semibold ${className}`} {...props}>
    {children}
  </th>
);

export const TableCell: React.FC<
  React.TdHTMLAttributes<HTMLTableCellElement>
> = ({ children, className = "", ...props }) => (
  <td className={`px-4 py-3.5 align-middle ${className}`} {...props}>
    {children}
  </td>
);
