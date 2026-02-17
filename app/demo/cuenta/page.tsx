"use client";

import { DemoSidebar } from "@/components/demo-sidebar";
import AccountContent from "@/components/account-content";
import Link from "next/link";
import { GlowButton } from "@/components/glow-button";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DemoCuentaPage() {
     const router = useRouter();

     const handleLogout = async () => {
          const supabase = createClient();
          await supabase.auth.signOut();
          router.push("/");
     };

     return (
          <div className="min-h-svh bg-background">
               <DemoSidebar />

               <div className="min-h-svh flex flex-col">
                    {/* Navigation */}
                    <nav className="border-b neumorphic-inset bg-background/80 backdrop-blur">
                         <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                              <Link href="/demo" className="block">
                                   <img
                                        src="/modoclaro.png"
                                        alt="Flowstock Demo"
                                        className="h-8 dark:hidden"
                                   />
                                   <img
                                        src="/modoclaro.png"
                                        alt="Flowstock Demo"
                                        className="h-8 hidden dark:block dark:invert"
                                   />
                              </Link>
                              <GlowButton onClick={handleLogout}>
                                   <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-inner">
                                        <LogOut className="w-3.5 h-3.5 text-white" />
                                   </div>
                                   <span className="hidden sm:inline">Cerrar Sesión</span>
                              </GlowButton>
                         </div>
                    </nav>

                    {/* Content */}
                    <div className="min-h-screen bg-background p-4 ml-0 md:ml-20 lg:ml-72">
                         <AccountContent />
                    </div>
               </div>
          </div>
     );
}
