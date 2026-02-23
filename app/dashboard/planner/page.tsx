import { PlannerClient } from "./planner-client";
import { getPlannerViewModel } from "@/lib/features/dashboard/server/get-planner-view-model";

export default async function PlannerPage() {
  const vm = await getPlannerViewModel();

  return (
    <PlannerClient 
      userName={vm.userName}
      establishmentName={vm.establishmentName}
    />
  );
}
