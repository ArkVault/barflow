"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-8 bg-background">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">Algo salió mal</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Ocurrió un error inesperado. Puedes intentar recargar la página.
        </p>
      </div>
      <Button onClick={reset}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Reintentar
      </Button>
    </div>
  );
}
