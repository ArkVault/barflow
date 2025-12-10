import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import AccountContent from "@/components/account-content";

export default async function CuentaPage() {
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
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <DashboardLayout
      userName={user.email || "Usuario"}
      establishmentName={establishment?.name || "Mi Negocio"}
    >
      <AccountContent />
    </DashboardLayout>
  );
}
