import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PlannerClient } from "./planner-client";

export default async function PlannerPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/");
  }

  const { data: establishment } = await supabase
    .from("establishments")
    .select("id, name")
    .eq("user_id", user.id)
    .single();

  return (
    <PlannerClient 
      userName={user.email || "Usuario"}
      establishmentName={establishment?.name || "Mi Establecimiento"}
    />
  );
}
