"use client";

import { DemoShell } from "@/components/shells";
import { DemoPageContainer } from "@/components/presentation/demo-page-container";
import { ProyeccionesContent } from "@/components/proyecciones-content";

export default function ProyeccionesPage() {
  return (
    <DemoShell>
      <DemoPageContainer paddingClassName="p-6" maxWidthClassName="max-w-5xl">
        <ProyeccionesContent />
      </DemoPageContainer>
    </DemoShell>
  );
}
