"use client";

import { DemoShell } from "@/components/shells";
import { DemoPageContainer } from "@/components/presentation/demo-page-container";
import { OperacionesContent } from "@/components/operaciones-content";

export default function OperacionesPage() {
  return (
    <DemoShell>
      <DemoPageContainer
        paddingClassName="p-6"
        maxWidthClassName="max-w-[1400px]"
      >
        <OperacionesContent />
      </DemoPageContainer>
    </DemoShell>
  );
}
