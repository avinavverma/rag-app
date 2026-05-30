"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { MarginLogo } from "@/components/margin-logo";
import { Button } from "@/components/ui/button";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const supabase =
    createClient();

  const [email, setEmail] =
    useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [error, setError] =
    useState<string | null>(
      null
    );

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);

    setError(null);

    const { error } =
      await supabase.auth.signInWithPassword(
        {
          email,
          password,
        }
      );

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/dashboard");

    router.refresh();
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-md border border-border bg-card p-6 space-y-6">
        <div className="space-y-2">
          <MarginLogo
            size="lg"
          />

          <h1 className="text-2xl font-semibold text-foreground">
            Log in
          </h1>

          <p className="text-sm text-muted-foreground">
            Sign in to your
            trace account
          </p>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-4"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Email
            </label>

            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              required
              className="w-full resize-none rounded-md border border-border bg-secondary px-3 py-2 text-base text-foreground placeholder:text-muted-foreground outline-none transition-[border-color] duration-150 focus:border-accent disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              required
              className="w-full resize-none rounded-md border border-border bg-secondary px-3 py-2 text-base text-foreground placeholder:text-muted-foreground outline-none transition-[border-color] duration-150 focus:border-accent disabled:opacity-50"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Log in"}
          </Button>
        </form>

        <p className="text-sm text-center text-muted-foreground">
          Don&apos;t have an
          account?{" "}
          <Link
            href="/signup"
            className="text-muted-foreground underline transition-colors duration-150 hover:text-foreground"
          >
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}