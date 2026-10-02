"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { signIn } from "@/lib/auth/auth-client";
import { IconLock, IconMail } from "@tabler/icons-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error: authErr } = await signIn.email({
        email,
        password,
      });

      if (authErr) {
        throw new Error(authErr.message || "Invalid email or password.");
      }

      const response = await fetch("/api/account/continue", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result?.error?.message || "Unable to open your account.");
      }

      router.push(result.redirectTo);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[var(--color-background)]">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <img
            src="/logo/logo2.png"
            alt="UpgradeCafé"
            className="h-12 w-auto mx-auto object-contain drop-shadow-xs"
          />
          <p className="text-xs text-[var(--color-muted)]">
            Secure sign in for UpgradeCafe administrators and café teams
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-6 border border-[var(--color-border)] shadow-[var(--shadow-card)]">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 text-xs rounded-[var(--radius-button)] bg-[var(--color-danger-light)] text-[var(--color-danger)] font-medium">
                {error}
              </div>
            )}

            <Input
              label="Email address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              leftIcon={<IconMail className="w-4 h-4 text-[var(--color-muted)]" />}
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              leftIcon={<IconLock className="w-4 h-4 text-[var(--color-muted)]" />}
            />

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Sign in to Dashboard
            </Button>
          </form>
        </Card>

        <div className="text-center text-[11px] text-[var(--color-muted)]">
          Sign-in access is assigned by the UpgradeCafe platform administrator.
        </div>
      </div>
    </div>
  );
}
