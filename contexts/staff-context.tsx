"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { StaffRole, defaultRouteForRole } from "@/lib/roles";
import {
  loginStaffWithPin,
  verifyApprovalPin as verifyApprovalPinAction,
  TeamMemberDTO,
} from "@/lib/team/actions";

const STORAGE_KEY = "flowstock_staff_session";

interface StaffSession {
  id: string;
  name: string;
  role: StaffRole;
  establishmentId: string;
}

interface StaffContextType {
  /** "admin" when the owner is acting directly, otherwise the staff role */
  role: StaffRole;
  /** null when the owner is acting directly */
  staff: TeamMemberDTO | null;
  /** true during sessionStorage hydration */
  loading: boolean;
  loginStaff: (pin: string) => Promise<{ ok: boolean; reason?: string }>;
  logoutStaff: () => void;
  verifyApprovalPin: (
    pin: string,
  ) => Promise<
    { ok: true; approverName: string; approverRole: StaffRole } | { ok: false }
  >;
}

const StaffContext = createContext<StaffContextType>({
  role: "admin",
  staff: null,
  loading: true,
  loginStaff: async () => ({ ok: false }),
  logoutStaff: () => {},
  verifyApprovalPin: async () => ({ ok: false }),
});

export function StaffProvider({ children }: { children: ReactNode }) {
  const { user, establishmentId, loading: authLoading } = useAuth();
  const router = useRouter();

  const [staff, setStaff] = useState<TeamMemberDTO | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate from sessionStorage after mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw && establishmentId) {
        const session: StaffSession = JSON.parse(raw);
        // Invalidate if establishment changed (e.g. owner account switched)
        if (session.establishmentId === establishmentId) {
          setStaff({
            id: session.id,
            name: session.name,
            role: session.role,
            can_approve_cancellations: false, // not needed client-side
            is_active: true,
          });
        } else {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // sessionStorage unavailable (SSR guard)
    }
    setLoading(false);
  }, [establishmentId]);

  const loginStaff = useCallback(
    async (pin: string): Promise<{ ok: boolean; reason?: string }> => {
      const result = await loginStaffWithPin(pin);
      if (result.ok) {
        const session: StaffSession = {
          id: result.member.id,
          name: result.member.name,
          role: result.member.role,
          establishmentId: establishmentId ?? "",
        };
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        } catch {
          // ignore
        }
        setStaff(result.member);
        return { ok: true };
      }
      return { ok: false, reason: result.reason };
    },
    [establishmentId],
  );

  const logoutStaff = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setStaff(null);
    router.push("/dashboard");
  }, [router]);

  const verifyApprovalPin = useCallback(async (pin: string) => {
    return verifyApprovalPinAction(pin);
  }, []);

  // When the owner signs out, clear any staff session too.
  // Wait for BOTH auth and staff loading to finish before deciding —
  // otherwise a slow auth hydration (user still null) would wipe
  // a valid staff session that was just restored from sessionStorage.
  useEffect(() => {
    if (!user && !loading && !authLoading) {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
      setStaff(null);
    }
  }, [user, loading, authLoading]);

  const role: StaffRole = staff?.role ?? "admin";

  return (
    <StaffContext.Provider
      value={{
        role,
        staff,
        loading,
        loginStaff,
        logoutStaff,
        verifyApprovalPin,
      }}
    >
      {children}
    </StaffContext.Provider>
  );
}

export const useStaff = () => {
  const ctx = useContext(StaffContext);
  if (ctx === undefined) {
    throw new Error("useStaff must be used within a StaffProvider");
  }
  return ctx;
};
