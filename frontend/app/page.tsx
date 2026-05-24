import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main>
      <h1>Margin</h1>
      <Link href="/login">Log in</Link>
      <Link href="/signup">Sign up</Link>
    </main>
  );
}