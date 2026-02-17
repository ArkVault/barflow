import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background">
      <div className="w-full max-w-sm">
        <Card className="neumorphic border-0">
          <CardHeader>
            <CardTitle className="text-2xl text-balance">
              ¡Gracias por registrarte!
            </CardTitle>
            <CardDescription>Verifica tu correo electrónico</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Te has registrado exitosamente. Por favor, verifica tu correo electrónico para confirmar tu cuenta antes de iniciar sesión.
            </p>
            
            <div className="pt-4 border-t border-border space-y-3">
              <p className="text-sm font-medium">
                Mientras tanto, puedes:
              </p>
              <Link href="/demo" className="block">
                <Button className="w-full neumorphic-hover border-0" variant="default">
                  Ver Demo del Sistema
                </Button>
              </Link>
              <Link href="/auth/login" className="block">
                <Button className="w-full neumorphic-hover border-0" variant="outline">
                  Ir a Iniciar Sesión
                </Button>
              </Link>
            </div>

            <p className="text-xs text-muted-foreground pt-2">
              Si ya verificaste tu correo, puedes iniciar sesión directamente.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
