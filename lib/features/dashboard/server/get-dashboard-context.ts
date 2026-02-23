import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type DashboardContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string; email: string | null };
  establishment: { id: string; name: string };
};

export async function getDashboardContextOrRedirect(): Promise<DashboardContext> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login");
  }

  const { data: establishment } = await supabase
    .from("establishments")
    .select("id, name")
    .eq("user_id", data.user.id)
    .single();

  if (!establishment) {
    redirect("/auth/login");
  }

  return {
    supabase,
    user: {
      id: data.user.id,
      email: data.user.email ?? null,
    },
    establishment: {
      id: establishment.id,
      name: establishment.name,
    },
  };
}
