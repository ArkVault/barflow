import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProdShell } from "@/components/shells";
import TeamManagement from "@/components/team/team-management";

export default async function EquipoPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  const { data: establishment } = await supabase
    .from("establishments")
    .select("id, name, user_id")
    .eq("user_id", user.id)
    .single();

  // Defense-in-depth: only the establishment owner can reach this page
  if (!establishment) {
    redirect("/dashboard");
  }

  return (
    <ProdShell
      userName={user.email || "Usuario"}
      establishmentName={establishment.name || "Mi Negocio"}
    >
      <TeamManagement />
    </ProdShell>
  );
}
