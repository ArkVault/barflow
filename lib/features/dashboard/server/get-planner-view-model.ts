import { getDashboardContextOrRedirect } from "./get-dashboard-context";

export async function getPlannerViewModel() {
  const { user, establishment } = await getDashboardContextOrRedirect();

  return {
    userName: user.email || "Usuario",
    establishmentName: establishment.name || "Mi Establecimiento",
  };
}
