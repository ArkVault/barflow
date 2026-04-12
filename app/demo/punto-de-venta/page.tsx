"use client";

import { DemoShell } from "@/components/shells";
import { DemoPageContainer } from "@/components/presentation/demo-page-container";
import { PuntoDeVentaContent } from "@/components/punto-de-venta-content";

export default function PuntoDeVentaPage() {
  return (
    <DemoShell>
      <DemoPageContainer paddingClassName="p-6" maxWidthClassName="max-w-5xl">
        <PuntoDeVentaContent />
      </DemoPageContainer>
    </DemoShell>
  );
}
