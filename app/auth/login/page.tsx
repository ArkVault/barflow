"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Wine, TrendingUp, BarChart3, Sparkles } from "lucide-react";

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
          }

          // Check if email confirmation is required
          if (authData.session) {
            toast.success("¡Cuenta creada exitosamente! Redirigiendo...");
            setTimeout(() => {
              window.location.href = "/demo";
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
          console.log('Login successful, session created:', data.session);
          toast.success("¡Bienvenido de vuelta!");
          setTimeout(() => {
            window.location.href = "/demo";
          }, 500);
        } else {
          console.error('No session created after login');
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
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/backgroundvideo.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay for better readability */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>

      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-transparent to-blue-900/30"></div>

      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>

      {/* Subtle floating orbs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-3xl animate-float opacity-40"></div>
      <div className="absolute bottom-20 right-20 w-[32rem] h-[32rem] bg-gradient-to-br from-blue-500/15 to-purple-500/15 rounded-full blur-3xl animate-float-delay opacity-30"></div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl grid lg:grid-cols-2 gap-12 items-center px-4">
        {/* Hero Text */}
        <div className="text-white space-y-8 hidden lg:block">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
              <Sparkles className="w-4 h-4 text-purple-300" />
              <span className="text-sm font-medium text-purple-100">Sistema Profesional de Gestión</span>
            </div>

            <h1 className="text-7xl font-bold leading-tight">
              <span className="block text-white drop-shadow-2xl">Flowstock</span>
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-blue-300 to-purple-300 drop-shadow-lg">
                Gestión Inteligente
              </span>
            </h1>
          </div>

          <p className="text-xl text-gray-300 leading-relaxed max-w-lg">
            Optimiza tu inventario, proyecta ventas y toma decisiones basadas en datos.
            La herramienta profesional para bares modernos.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <BarChart3 className="w-5 h-5 text-purple-300" />
                </div>
                <h3 className="font-semibold text-white">Análisis en Tiempo Real</h3>
              </div>
              <p className="text-sm text-gray-400">Monitorea tu inventario y ventas al instante</p>
            </div>

            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <TrendingUp className="w-5 h-5 text-blue-300" />
                </div>
                <h3 className="font-semibold text-white">IA Predictiva</h3>
              </div>
              <p className="text-sm text-gray-400">Proyecciones inteligentes de demanda</p>
            </div>
          </div>
        </div>

        {/* Glassmorphism Auth Card */}
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>

          {/* Main glass card */}
          <div className="relative glass-card-premium rounded-2xl p-8 backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
            {/* Shimmer effect on edges */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent shimmer"></div>
            </div>

            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-white/20 mb-4">
                  <Wine className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  {isSignUp ? "Crear Cuenta" : "Bienvenido"}
                </h2>
                <p className="text-gray-300">
                  {isSignUp
                    ? "Comienza a optimizar tu negocio hoy"
                    : "Ingresa a tu cuenta de Flowstock"}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleAuth} className="space-y-5">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="barName" className="text-white font-medium">
                      Nombre de tu establecimiento
                    </Label>
                    <Input
                      id="barName"
                      placeholder="Ej: La Cantina del Centro"
                      value={formData.barName}
                      onChange={(e) =>
                        setFormData({ ...formData, barName: e.target.value })
                      }
                      required
                      className="glass-input bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400 focus:ring-purple-400/50"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white font-medium">
                    Correo Electrónico
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
                    className="glass-input bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400 focus:ring-purple-400/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white font-medium">
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
                    className="glass-input bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400 focus:ring-purple-400/50"
                  />
                </div>

                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white font-medium">
                      Confirmar Contraseña
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
                      className="glass-input bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400 focus:ring-purple-400/50"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold h-12 shadow-lg shadow-purple-500/50 border-0 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Procesando...
                    </>
                  ) : isSignUp ? (
                    "Crear Cuenta"
                  ) : (
                    "Iniciar Sesión"
                  )}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-transparent px-2 text-gray-400">o</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="w-full text-center text-gray-300 hover:text-white transition-colors text-sm font-medium py-2 rounded-lg hover:bg-white/5"
                >
                  {isSignUp
                    ? "¿Ya tienes cuenta? Inicia sesión"
                    : "¿No tienes cuenta? Regístrate"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-30px);
          }
        }

        @keyframes float-delay {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(30px);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-float {
          animation: float 8s ease-in-out infinite;
        }

        .animate-float-delay {
          animation: float-delay 10s ease-in-out infinite;
        }

        .shimmer {
          animation: shimmer 3s infinite;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }

        .glass-card-premium {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.1),
            rgba(255, 255, 255, 0.05)
          );
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.37),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 0 rgba(255, 255, 255, 0.05);
        }

        .glass-input {
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .glass-input:focus {
          background: rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
}
