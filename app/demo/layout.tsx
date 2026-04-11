import { createClient } from "@/lib/supabase/server";
import { OnboardingQuestionnaire } from "@/components/onboarding-questionnaire";
import { WelcomePlannerPopup } from "@/components/welcome-planner-popup";

export default async function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const userId = data?.user?.id ?? null;
  const userEmail = data?.user?.email ?? "";

  // Show planner hint in demo (testMode uses sessionStorage — resets each browser session)
  // In production, this would check user_metadata.inventory_method !== 'excel'
  const showPlannerHint = true;

  return (
    <>
      {userId && (
        <OnboardingQuestionnaire userId={userId} userEmail={userEmail} />
      )}
      {showPlannerHint && (
        <WelcomePlannerPopup plannerHref="/demo/planner" testMode={true} />
      )}
      {children}
    </>
  );
}
