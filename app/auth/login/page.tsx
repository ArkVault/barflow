"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    barName: "",
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    try {
      if (isSignUp) {
        // Validations for signup
        if (formData.password !== formData.confirmPassword) {
          toast.error("Las contraseñas no coinciden");
          setLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          toast.error("La contraseña debe tener al menos 6 caracteres");
          setLoading(false);
          return;
        }

        if (!formData.barName.trim()) {
          toast.error("Por favor ingresa el nombre de tu bar");
          setLoading(false);
          return;
        }

        // Sign up with Supabase
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              bar_name: formData.barName,
            },
            emailRedirectTo: `${window.location.origin}/demo`,
          },
        });

        if (signUpError) {
          console.error('Signup error:', signUpError);
          throw signUpError;
        }

        if (authData.user) {
          // Create establishment for the user
          const { error: estError } = await supabase
            .from('establishments')
            .insert({
              user_id: authData.user.id,
              name: formData.barName,
            });

          if (estError) {
            console.error('Error creating establishment:', estError);
            // Don't fail - establishment can be created later
          }

          // Check if email confirmation is required
          if (authData.session) {
            toast.success("¡Cuenta creada exitosamente! Redirigiendo...");
            setTimeout(() => {
              router.push("/demo");
            }, 1000);
          } else {
            toast.success("¡Cuenta creada! Por favor revisa tu email para confirmar tu cuenta.");
            setFormData({ email: formData.email, password: "", confirmPassword: "", barName: "" });
            setIsSignUp(false);
          }
        }
      } else {
        // Login
        if (!formData.email || !formData.password) {
          toast.error("Por favor ingresa email y contraseña");
          setLoading(false);
          return;
        }

        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (loginError) {
          console.error('Login error:', loginError);
          // Provide specific error messages
          if (loginError.message.includes('Invalid login credentials')) {
            toast.error("Email o contraseña incorrectos. ¿No tienes cuenta? Regístrate.");
          } else if (loginError.message.includes('Email not confirmed')) {
            toast.error("Por favor confirma tu email antes de iniciar sesión");
          } else {
            toast.error(loginError.message);
          }
          setLoading(false);
          return;
        }

        if (data.session) {
          toast.success("¡Bienvenido de vuelta!");
          setTimeout(() => {
            router.push("/demo");
          }, 500);
        } else {
          toast.error("No se pudo iniciar sesión. Intenta de nuevo.");
          setLoading(false);
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message || "Error en la autenticación");
      setLoading(false);
    } finally {
      if (isSignUp) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 animate-gradient-shift">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      </div>

      {/* Floating orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-float-delay"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse"></div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Hero Text */}
        <div className="text-white space-y-6 hidden lg:block">
          <h1 className="text-6xl font-bold leading-tight">
            Gestiona tu bar
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200">
              con inteligencia
            </span>
          </h1>
          <p className="text-xl text-blue-100/80 leading-relaxed">
            Sistema completo de inventario, ventas y proyecciones con IA.
            Optimiza tu negocio desde el primer día.
          </p>
          <div className="flex gap-4 pt-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-blue-100">Análisis en tiempo real</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-blue-100">IA predictiva</span>
            </div>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="neumorphic border-0 backdrop-blur-xl bg-white/10 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold text-white">
              {isSignUp ? "Crear cuenta" : "Iniciar sesión"}
            </CardTitle>
            <CardDescription className="text-blue-100">
              {isSignUp
                ? "Comienza a optimizar tu bar hoy"
                : "Bienvenido de vuelta a Barflow"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="barName" className="text-white">
                    Nombre de tu bar
                  </Label>
                  <Input
                    id="barName"
                    placeholder="Mi Bar Increíble"
                    value={formData.barName}
                    onChange={(e) =>
                      setFormData({ ...formData, barName: e.target.value })
                    }
                    required
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/30"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/30"
                />
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white">
                    Confirmar contraseña
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/30"
                  />
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-purple-600 hover:bg-white/90 font-semibold h-12"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : isSignUp ? (
                  "Crear cuenta"
                ) : (
                  "Iniciar sesión"
                )}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-transparent px-2 text-white/80">o</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full text-center text-white/80 hover:text-white transition-colors text-sm"
              >
                {isSignUp
                  ? "¿Ya tienes cuenta? Inicia sesión"
                  : "¿No tienes cuenta? Regístrate"}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes float-delay {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(20px);
          }
        }

        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 15s ease infinite;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delay {
          animation: float-delay 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
