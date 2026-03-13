"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";

interface AuthContextType {
     user: User | null;
     loading: boolean;
     signOut: () => Promise<void>;
     establishmentId: string | null;
     establishmentName: string | null;
     taxRate: number;
     isDemoPublic: boolean;
}

const AuthContext = createContext<AuthContextType>({
     user: null,
     loading: true,
     signOut: async () => { },
     establishmentId: null,
     establishmentName: null,
     taxRate: 16,
     isDemoPublic: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
     const [user, setUser] = useState<User | null>(null);
     const [loading, setLoading] = useState(true);
     const [establishmentId, setEstablishmentId] = useState<string | null>(null);
     const [establishmentName, setEstablishmentName] = useState<string | null>(null);
     const [taxRate, setTaxRate] = useState<number>(16);
     const router = useRouter();
     const pathname = usePathname();
     const supabase = createClient();

     const publicDemoEstablishmentId =
          process.env.NEXT_PUBLIC_DEMO_PUBLIC_ESTABLISHMENT_ID || "demo-public";
     const publicDemoEstablishmentName =
          process.env.NEXT_PUBLIC_DEMO_PUBLIC_ESTABLISHMENT_NAME || "Demo Public";
     const cookieScope =
          typeof document !== "undefined"
               ? document.cookie
                    .split(";")
                    .map((part) => part.trim())
                    .find((part) => part.startsWith("barflow_demo_scope="))
                    ?.split("=")[1]
               : null;
     const isDemoPublic =
          pathname?.startsWith("/demo-public") === true || cookieScope === "public";

     useEffect(() => {
          if (isDemoPublic) {
               setUser(null);
               setEstablishmentId(publicDemoEstablishmentId);
               setEstablishmentName(publicDemoEstablishmentName);
               setLoading(false);
               return;
          }

          // Get initial session
          supabase.auth.getSession().then(({ data: { session } }) => {
               setUser(session?.user ?? null);
               if (session?.user) {
                    fetchEstablishment(session.user.id);
               }
               setLoading(false);
          });

          // Listen for auth changes
          const {
               data: { subscription },
          } = supabase.auth.onAuthStateChange((_event, session) => {
               setUser(session?.user ?? null);
               if (session?.user) {
                    fetchEstablishment(session.user.id);
               } else {
                    setEstablishmentId(null);
                    setEstablishmentName(null);
                    setTaxRate(16);
               }
               setLoading(false);
          });

          return () => subscription.unsubscribe();
     }, [isDemoPublic, publicDemoEstablishmentId, publicDemoEstablishmentName]);

     const fetchEstablishment = async (userId: string) => {
          const { data, error } = await supabase
               .from("establishments")
               .select("id, name, tax_rate")
               .eq("user_id", userId)
               .single();

          if (error && error.code !== 'PGRST116') {
               console.error("Failed to fetch establishment:", error.message);
          }

          if (data) {
               setEstablishmentId(data.id);
               setEstablishmentName(data.name || null);
               setTaxRate(data.tax_rate ?? 16);
          }
     };

     const signOut = async () => {
          if (isDemoPublic) {
               router.push("/demo-public");
               return;
          }

          await supabase.auth.signOut();
          setUser(null);
          setEstablishmentId(null);
          setEstablishmentName(null);
          router.push("/auth/login");
     };

     return (
          <AuthContext.Provider value={{ user, loading, signOut, establishmentId, establishmentName, taxRate, isDemoPublic }}>
               {children}
          </AuthContext.Provider>
     );
}

export const useAuth = () => {
     const context = useContext(AuthContext);
     if (context === undefined) {
          throw new Error("useAuth must be used within an AuthProvider");
     }
     return context;
};
