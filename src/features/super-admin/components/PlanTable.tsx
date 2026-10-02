"use client";

import React from "react";
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
import { Plan } from "@/lib/db/schema/plans";
import { IconEdit } from "@tabler/icons-react";

export interface PlanTableProps {
  plans: Plan[];
  onEdit: (plan: Plan) => void;
  onToggleActive: (plan: Plan) => void;
}

export const PlanTable: React.FC<PlanTableProps> = ({
  plans,
  onEdit,
  onToggleActive,
}) => {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-[var(--shadow-card)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Plan Name</TableHead>
            <TableHead>Monthly Price</TableHead>
            <TableHead>Yearly Price</TableHead>
            <TableHead>Lifetime</TableHead>
            <TableHead>Max Branches</TableHead>
            <TableHead>Max Menu Items</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-semibold text-[var(--color-foreground)]">
                    {p.name}
                  </span>
                  <span className="text-[11px] text-[var(--color-muted)] font-mono">
                    {p.slug}
                  </span>
                </div>
              </TableCell>

              <TableCell className="font-semibold">
                ₹{p.monthlyPrice.toLocaleString("en-IN")}/mo
              </TableCell>

              <TableCell className="font-semibold">
                ₹{p.yearlyPrice.toLocaleString("en-IN")}/yr
              </TableCell>

              <TableCell className="font-semibold">
                {p.lifetimePrice > 0 ? `₹${p.lifetimePrice.toLocaleString("en-IN")}` : "N/A"}
              </TableCell>

              <TableCell>{p.maxBranches} branch</TableCell>
              <TableCell>{p.maxMenuItems} items</TableCell>

              <TableCell>
                <Badge variant={p.isActive ? "active" : "archived"}>
                  {p.isActive ? "Active" : "Disabled"}
                </Badge>
              </TableCell>

              <TableCell className="text-right space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(p)}
                  leftIcon={<IconEdit className="w-3.5 h-3.5" />}
                >
                  Edit
                </Button>
                <Button
                  variant={p.isActive ? "secondary" : "primary"}
                  size="sm"
                  onClick={() => onToggleActive(p)}
                >
                  {p.isActive ? "Disable" : "Enable"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
