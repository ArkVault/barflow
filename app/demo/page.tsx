"use client";

import { usePathname } from "next/navigation";
import { PeriodProvider } from "@/contexts/period-context";
import { DemoShell } from "@/components/shells";
import { DemoPageContainer } from "@/components/presentation/demo-page-container";
import { HomeContent } from "@/components/home-content";
import { getDemoBasePath, toDemoPath } from "@/lib/utils/demo-route";

export default function DemoPage() {
  const pathname = usePathname();
  const demoBasePath = getDemoBasePath(pathname);
  return (
    <PeriodProvider>
      <DemoShell>
        <DemoPageContainer paddingClassName="p-6" maxWidthClassName="max-w-5xl">
          <HomeContent
            insumosHref={toDemoPath(demoBasePath, "/demo/insumos")}
            productosHref={toDemoPath(demoBasePath, "/demo/productos")}
            plannerRedirect={toDemoPath(demoBasePath, "/demo/planner")}
          />
        </DemoPageContainer>
      </DemoShell>
    </PeriodProvider>
  );
}
