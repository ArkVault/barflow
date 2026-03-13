import { createServerClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import { ProdShell } from "@/components/shells";
import { SettingsForm } from "@/components/configuracion/settings-form";

export default async function ConfiguracionPage() {
  const supabase = await createServerClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect("/auth/login");
  }

  const { data: establishment } = await supabase
    .from("establishments")
    .select("id, name, tax_rate")
    .eq("user_id", user!.id)
    .single();

  return (
    <ProdShell
      userName={user!.email || "Usuario"}
      establishmentName={establishment?.name || "Mi Negocio"}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground mt-2">
            Personaliza tu sistema de inventario y gestión
          </p>
        </div>

        {establishment ? (
          <SettingsForm establishment={establishment} />
        ) : (
          <p className="text-muted-foreground">No se encontró información del establecimiento.</p>
        )}
      </div>
    </ProdShell>
  );
}
