"use client";

import { usePathname } from "next/navigation";
import { DemoShell } from "@/components/shells";
import { PlannerContent } from "@/components/planner-content";
import { getDemoBasePath, toDemoPath } from "@/lib/utils/demo-route";

export default function PlannerPage() {
  const pathname = usePathname();
  const demoBasePath = getDemoBasePath(pathname);

  return (
    <DemoShell>
      <PlannerContent
        redirectAfterSave={toDemoPath(demoBasePath, "/demo/insumos")}
        wrapperClassName="min-h-screen ml-0 md:ml-72"
      />
    </DemoShell>
  );
}
