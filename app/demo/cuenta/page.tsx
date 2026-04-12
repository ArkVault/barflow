"use client";

import { DemoShell } from "@/components/shells";
import AccountContent from "@/components/account-content";
import { DemoPageContainer } from "@/components/presentation/demo-page-container";

export default function DemoCuentaPage() {
  return (
    <DemoShell>
      <DemoPageContainer paddingClassName="p-4" maxWidthClassName="max-w-none">
        <AccountContent />
      </DemoPageContainer>
    </DemoShell>
  );
}
