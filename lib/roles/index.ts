export type StaffRole = "admin" | "jefe_de_piso" | "jefe_de_barra" | "mesero";

export type PosTabId = "mesas" | "comandas" | "historial";

// Routes each role is allowed to visit (exact or prefix match)
export const ROLE_ROUTES: Record<StaffRole, string[]> = {
  admin: [
    "/dashboard",
    "/dashboard/planner",
    "/dashboard/insumos",
    "/dashboard/productos",
    "/dashboard/punto-de-venta",
    "/dashboard/proyecciones",
    "/dashboard/cuenta",
    "/dashboard/configuracion",
    "/dashboard/equipo",
    "/dashboard/operaciones",
  ],
  jefe_de_piso: [
    "/dashboard/planner",
    "/dashboard/insumos",
    "/dashboard/productos",
    "/dashboard/punto-de-venta",
  ],
  jefe_de_barra: [
    "/dashboard/planner",
    "/dashboard/insumos",
    "/dashboard/productos",
    "/dashboard/punto-de-venta",
  ],
  mesero: ["/dashboard/punto-de-venta"],
};

export const ROLE_POS_TABS: Record<StaffRole, PosTabId[]> = {
  admin: ["mesas", "comandas", "historial"],
  jefe_de_piso: ["mesas", "comandas", "historial"],
  jefe_de_barra: ["mesas", "comandas", "historial"],
  mesero: ["mesas"],
};

export const ROLE_LABELS: Record<StaffRole, { es: string; en: string }> = {
  admin: { es: "Administrador", en: "Admin" },
  jefe_de_piso: { es: "Jefe de Piso", en: "Floor Manager" },
  jefe_de_barra: { es: "Jefe de Barra", en: "Bar Manager" },
  mesero: { es: "Mesero", en: "Server" },
};

// Permission helpers — single source of truth
export const canAccessRoute = (role: StaffRole, pathname: string): boolean => {
  const allowed = ROLE_ROUTES[role];
  return allowed.some((r) => pathname === r || pathname.startsWith(`${r}/`));
};

export const canAccessPosTab = (role: StaffRole, tab: PosTabId): boolean =>
  ROLE_POS_TABS[role].includes(tab);

export const canAddSection = (role: StaffRole): boolean => role !== "mesero";

export const canCancelAccountDirect = (role: StaffRole): boolean =>
  role !== "mesero";

export const canManageTeam = (role: StaffRole): boolean => role === "admin";

export const canSeeAccountMenu = (role: StaffRole): boolean => role === "admin";

export const canApproveCancellation = (role: StaffRole): boolean =>
  role === "admin" || role === "jefe_de_piso" || role === "jefe_de_barra";

export const defaultRouteForRole = (role: StaffRole): string =>
  role === "admin" ? "/dashboard" : ROLE_ROUTES[role][0];

// Default can_approve_cancellations when creating a team member
export const defaultCanApprove = (role: StaffRole): boolean =>
  role !== "mesero";
