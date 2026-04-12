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

  return (
    <>
      {userId && (
        <OnboardingQuestionnaire userId={userId} userEmail={userEmail} />
      )}
      {/* demoMode=true simulates the "manual" choice — shows up to 3 sessions.
          In production: remove demoMode and rely on localStorage "inventory_method"="manual"
          set by the onboarding when the user picks "Llenar manualmente después". */}
      <WelcomePlannerPopup plannerHref="/demo/planner" demoMode={true} />
      {children}
    </>
  );
}
