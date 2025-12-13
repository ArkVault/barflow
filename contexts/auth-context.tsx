"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

interface AuthContextType {
     user: User | null;
     loading: boolean;
     signOut: () => Promise<void>;
     establishmentId: string | null;
     establishmentName: string | null;
}

const AuthContext = createContext<AuthContextType>({
     user: null,
     loading: true,
     signOut: async () => { },
     establishmentId: null,
     establishmentName: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
     const [user, setUser] = useState<User | null>(null);
     const [loading, setLoading] = useState(true);
     const [establishmentId, setEstablishmentId] = useState<string | null>(null);
     const [establishmentName, setEstablishmentName] = useState<string | null>(null);
     const router = useRouter();
     const supabase = createClient();

     useEffect(() => {
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
               }
               setLoading(false);
          });

          return () => subscription.unsubscribe();
     }, []);

     const fetchEstablishment = async (userId: string) => {
          const { data } = await supabase
               .from("establishments")
               .select("id, name")
               .eq("user_id", userId)
               .single();

          if (data) {
               setEstablishmentId(data.id);
               setEstablishmentName(data.name || null);
          }
     };

     const signOut = async () => {
          await supabase.auth.signOut();
          setUser(null);
          setEstablishmentId(null);
          setEstablishmentName(null);
          router.push("/auth/login");
     };

     return (
          <AuthContext.Provider value={{ user, loading, signOut, establishmentId, establishmentName }}>
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
