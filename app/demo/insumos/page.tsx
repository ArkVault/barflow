"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DemoShell } from "@/components/shells";
import { DemoPageContainer } from "@/components/presentation/demo-page-container";
import { InsumosContent } from "@/components/insumos-content";
import { getDemoBasePath, toDemoPath } from "@/lib/utils/demo-route";

function InsumosPageInner() {
  const pathname = usePathname();
  const demoBasePath = getDemoBasePath(pathname);
  return (
    <DemoShell>
      <DemoPageContainer paddingClassName="p-6" maxWidthClassName="max-w-5xl">
        <InsumosContent
          plannerHref={toDemoPath(demoBasePath, "/demo/planner")}
          restockCleanupUrl={toDemoPath(demoBasePath, "/demo/insumos")}
        />
      </DemoPageContainer>
    </DemoShell>
  );
}

export default function InsumosPage() {
  return (
    <Suspense
      fallback={
        <DemoShell>
          <div className="min-h-svh bg-background flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Cargando...</p>
            </div>
          </div>
        </DemoShell>
      }
    >
      <InsumosPageInner />
    </Suspense>
  );
}
