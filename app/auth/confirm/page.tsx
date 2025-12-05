"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

function ConfirmContent() {
     const router = useRouter();
     const searchParams = useSearchParams();
     const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
     const [message, setMessage] = useState("");

     useEffect(() => {
          const confirmEmail = async () => {
               const supabase = createClient();

               // Get the token from URL
               const token_hash = searchParams?.get("token_hash");
               const type = searchParams?.get("type");

               if (!token_hash || type !== "email") {
                    setStatus("error");
                    setMessage("Link de confirmación inválido");
                    return;
               }

               try {
                    const { error } = await supabase.auth.verifyOtp({
                         token_hash,
                         type: "email",
                    });

                    if (error) {
                         throw error;
                    }

                    setStatus("success");
                    setMessage("¡Email confirmado exitosamente! Redirigiendo al dashboard...");

                    // Redirect to dashboard after 2 seconds
                    setTimeout(() => {
                         router.push("/dashboard");
                    }, 2000);
               } catch (error: any) {
                    console.error("Error confirming email:", error);
                    setStatus("error");
                    setMessage(error.message || "Error al confirmar el email");
               }
          };

          confirmEmail();
     }, [searchParams, router]);

     return (
          <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background">
               <div className="w-full max-w-sm">
                    <Card className="neumorphic border-0">
                         <CardHeader>
                              <div className="flex justify-center mb-4">
                                   {status === "loading" && (
                                        <Loader2 className="w-16 h-16 text-primary animate-spin" />
                                   )}
                                   {status === "success" && (
                                        <CheckCircle2 className="w-16 h-16 text-green-500" />
                                   )}
                                   {status === "error" && (
                                        <XCircle className="w-16 h-16 text-destructive" />
                                   )}
                              </div>
                              <CardTitle className="text-2xl text-balance text-center">
                                   {status === "loading" && "Confirmando email..."}
                                   {status === "success" && "¡Email confirmado!"}
                                   {status === "error" && "Error"}
                              </CardTitle>
                              <CardDescription className="text-center">
                                   {message}
                              </CardDescription>
                         </CardHeader>
                         {status === "error" && (
                              <CardContent>
                                   <Button
                                        onClick={() => router.push("/auth/login")}
                                        className="w-full neumorphic-hover border-0"
                                   >
                                        Volver al inicio de sesión
                                   </Button>
                              </CardContent>
                         )}
                    </Card>
               </div>
          </div>
     );
}

export default function ConfirmPage() {
     return (
          <Suspense fallback={
               <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background">
                    <Loader2 className="w-16 h-16 text-primary animate-spin" />
               </div>
          }>
               <ConfirmContent />
          </Suspense>
     );
}
