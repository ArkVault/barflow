"use client";

import { DemoShell } from "@/components/shells";
import AccountContent from "@/components/account-content";
import { GlowButton } from "@/components/glow-button";
import { LogOut } from "lucide-react";
import { DemoTopNav } from "@/components/presentation/demo-top-nav";
import { DemoPageContainer } from "@/components/presentation/demo-page-container";
import { useAuth } from "@/contexts/auth-context";

export default function DemoCuentaPage() {
     const { signOut } = useAuth();

     const handleLogout = async () => {
          await signOut();
     };

     return (
          <DemoShell>
               <div className="min-h-svh flex flex-col">
                    {/* Navigation */}
                    <DemoTopNav
                         alt="Flowstock Demo"
                         variant="blur"
                         logoClassName="h-8 dark:hidden"
                         darkLogoClassName="h-8 hidden dark:block dark:invert"
                         rightSlot={
                              <GlowButton onClick={handleLogout}>
                                   <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-inner">
                                        <LogOut className="w-3.5 h-3.5 text-white" />
                                   </div>
                                   <span className="hidden sm:inline">Cerrar Sesión</span>
                              </GlowButton>
                         }
                    />

                    {/* Content */}
                    <DemoPageContainer paddingClassName="p-4" maxWidthClassName="max-w-none">
                         <AccountContent />
                    </DemoPageContainer>
               </div>
          </DemoShell>
     );
}
