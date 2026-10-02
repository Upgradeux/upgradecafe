"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminHeader } from "@/features/super-admin/components/AdminHeader";
import { ActivityLogTable } from "@/features/super-admin/components/ActivityLogTable";
import { useToast } from "@/components/ui/Toast";
import { ActivityLogItem } from "@/features/super-admin/services/activity-admin.service";

export default function AdminActivityPage() {
  const toast = useToast();
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/activity?page=${page}&limit=20`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data.logs);
        setTotal(data.data.total);
        setTotalPages(data.data.totalPages);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load audit logs.");
    } finally {
      setIsLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Platform Audit Trail"
        subtitle="Immutable security logs of sensitive administrative mutations and access events."
      />

      <ActivityLogTable
        logs={logs}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
        isLoading={isLoading}
      />
    </div>
  );
}
