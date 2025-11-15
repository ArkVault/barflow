import { createServerClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import { DashboardLayout } from "@/components/dashboard-layout";

export default async function CuentaPage() {
  const supabase = await createServerClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mi Cuenta</h1>
          <p className="text-muted-foreground mt-2">
            Administra tu información personal y preferencias de usuario
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* User Information Card */}
          <div className="neumorphic rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Información Personal</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Email</label>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">ID de Usuario</label>
                <p className="font-mono text-sm">{user.id}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Fecha de Registro</label>
                <p className="font-medium">
                  {new Date(user.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Establishment Information Card */}
          <div className="neumorphic rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Información del Negocio</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Nombre del Establecimiento</label>
                <p className="font-medium">{establishment?.name || "No configurado"}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Tipo de Negocio</label>
                <p className="font-medium">Bar / Restaurante</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Plan</label>
                <p className="font-medium">Gratuito</p>
              </div>
            </div>
          </div>

          {/* Security Card */}
          <div className="neumorphic rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Seguridad</h2>
            <div className="space-y-4">
              <button className="w-full px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                Cambiar Contraseña
              </button>
              <button className="w-full px-4 py-2 rounded-xl bg-accent hover:bg-accent/80 transition-colors">
                Autenticación de Dos Factores
              </button>
            </div>
          </div>

          {/* Preferences Card */}
          <div className="neumorphic rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Preferencias</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Notificaciones por Email</span>
                <input type="checkbox" className="h-4 w-4" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Alertas de Stock Bajo</span>
                <input type="checkbox" className="h-4 w-4" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Reportes Semanales</span>
                <input type="checkbox" className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
