"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { FieldLabel, Input } from "@/components/ui/Field";

type AdminLoginFormProps = {
  nextPath: string;
};

export function AdminLoginForm({ nextPath }: AdminLoginFormProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password, nextPath }),
      });

      const payload = (await response.json()) as { message?: string; redirectTo?: string };

      if (!response.ok) {
        throw new Error(payload.message || "Unable to login.");
      }

      window.location.assign(payload.redirectTo || nextPath);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardContent>
        <h1 className="font-heading text-3xl text-ink sm:text-4xl">Admin Login</h1>
        <p className="mt-2 text-sm text-smoke">Enter the dashboard password to view and manage appointments.</p>

        <form onSubmit={onSubmit} className="mt-5">
          <FieldLabel htmlFor="admin-password">Password</FieldLabel>
          <Input
            id="admin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <Button type="submit" disabled={loading} className="mt-4 w-full sm:w-auto">
            {loading ? "Logging in..." : "Login"}
          </Button>

          {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
