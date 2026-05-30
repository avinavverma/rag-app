"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// import { MarginLogo } from "@/components/margin-logo";
import { Button } from "@/components/ui/button";

import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
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
      await supabase.auth.signUp(
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
  <div className="min-h-screen flex flex-col items-center justify-center px-4">
    <div className="w-full max-w-md">
      <h1 className="mb-8 text-center text-6xl font-semibold tracking-tight text-foreground">
        trace
      </h1>

      <div className="mx-auto w-full max-w-[420px] rounded-md border border-border bg-card/80 backdrop-blur-md p-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground text-center">
            Sign up
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <input
              type="email"
              placeholder="Email"
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
            <div className="h-2" />

            <input
              type="password"
              placeholder="Password"
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

          {/* {error && ( */}
            <p className="h-5 text-sm text-destructive">
              {error}
            </p>
          {/* )} */}

          {/* <div className="h-2" /> */}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading
              ? "Creating account..."
              : "Sign up"}
          </Button>
        </form>

        <p className="text-sm text-center text-muted-foreground">
          Already have an
          account?{" "}
          <Link
            href="/login"
            className="text-muted-foreground underline transition-colors duration-150 hover:text-foreground"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  </div>
);
}