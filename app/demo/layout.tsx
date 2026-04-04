import { createClient } from "@/lib/supabase/server";
import { OnboardingQuestionnaire } from "@/components/onboarding-questionnaire";

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
      {userId && <OnboardingQuestionnaire userId={userId} userEmail={userEmail} />}
      {children}
    </>
  );
}
