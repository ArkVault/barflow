"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useState } from "react";
import { toast } from "sonner";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Las contraseñas no coinciden");
      setIsLoading(false);
      return;
    }

    try {
      // Calculate trial end date (30 days from now)
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 30);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            email_confirm: true
          }
        },
      });

      if (error) throw error;

      if (data.user) {
        // Create establishment with trial period
        const { error: estError } = await supabase
          .from('establishments')
          .insert({
            user_id: data.user.id,
            name: email.split('@')[0] + "'s Bar", // Default name
            trial_end_date: trialEndDate.toISOString(),
            subscription_status: 'trialing',
            plan_type: 'free_trial'
          });

        if (estError) {
          console.error('Error creating establishment:', estError);
        }

        // Show success message
        toast.success("¡Cuenta creada! Por favor revisa tu email para confirmar tu cuenta.");
        router.push('/auth/sign-up-success');
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocurrió un error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background">
      <div className="w-full max-w-sm">
        <Card className="neumorphic border-0">
          <CardHeader>
            <CardTitle className="text-2xl text-balance">Crear Cuenta</CardTitle>
            <CardDescription>
              Regístrate para comenzar con Barmode
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@ejemplo.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="neumorphic-inset border-0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="neumorphic-inset border-0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="repeat-password">Repetir Contraseña</Label>
                  <Input
                    id="repeat-password"
                    type="password"
                    required
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    className="neumorphic-inset border-0"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full neumorphic-hover border-0" disabled={isLoading}>
                  {isLoading ? "Creando cuenta..." : "Registrarse"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                ¿Ya tienes cuenta?{" "}
                <Link
                  href="/auth/login"
                  className="underline underline-offset-4 text-primary"
                >
                  Inicia sesión
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
