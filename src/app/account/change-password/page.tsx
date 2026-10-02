"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function ChangeTemporaryPasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result?.error?.message || "Could not change your password.");
      }

      const nextResponse = await fetch("/api/account/continue", { cache: "no-store" });
      const nextResult = await nextResponse.json();
      if (!nextResponse.ok || !nextResult.success) {
        throw new Error(nextResult?.error?.message || "Password changed. Please sign in again.");
      }

      router.replace(nextResult.redirectTo);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not change your password.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-4">
      <Card className="w-full max-w-md space-y-5 border border-[var(--color-border)] p-6">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-foreground)]">Set a new password</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Your temporary password must be replaced before you can use your café account.
          </p>
        </div>

        {error && (
          <div role="alert" className="rounded-md bg-[var(--color-danger-light)] p-3 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Temporary password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
          />
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            minLength={12}
            maxLength={128}
            helperText="Use at least 12 characters."
            required
          />
          <Input
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={12}
            maxLength={128}
            required
          />
          <Button type="submit" isLoading={isLoading} className="w-full">
            Change password and continue
          </Button>
        </form>
      </Card>
    </main>
  );
}
