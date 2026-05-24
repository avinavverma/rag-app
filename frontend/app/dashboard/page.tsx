"use client";

import { useRouter } from "next/navigation";

import { useUser, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user, loading } = useUser();

  const router = useRouter();

  async function handleSignOut() {
    await signOut();

    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="p-6">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">
        Dashboard
      </h1>

      <p>
        Signed in as: {user?.email}
      </p>

      <p className="text-sm text-gray-500 break-all">
        User ID: {user?.id}
      </p>

      <Button onClick={handleSignOut}>
        Sign out
      </Button>
    </main>
  );
}
