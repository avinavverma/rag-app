import Link from "next/link";
import { redirect } from "next/navigation";

// import { MarginLogo } from "@/components/margin-logo";

import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
  <main className="min-h-screen flex flex-col items-center justify-center px-4">
    <h1 className="mb-8 text-center text-8xl font-semibold tracking-tight text-foreground">
      trace
    </h1>

    <div className="flex w-full max-w-xs flex-col gap-3">
      <Link
        href="/login"
        className="block w-full rounded-md bg-accent px-4 py-2 text-center text-sm font-medium text-accent-foreground transition-colors duration-150 hover:bg-[var(--accent-hover)]"
      >
        Log in
      </Link>

      <Link
        href="/signup"
        className="block w-full rounded-md border border-border bg-transparent px-4 py-2 text-center text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-secondary hover:text-foreground"
      >
        Sign up
      </Link>
    </div>
  </main>
);
}