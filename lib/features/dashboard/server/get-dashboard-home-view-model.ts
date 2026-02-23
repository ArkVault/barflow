import { getDashboardContextOrRedirect } from "./get-dashboard-context";

export async function getDashboardHomeViewModel() {
  const { user, establishment } = await getDashboardContextOrRedirect();

  return {
    userName: user.email || "",
    establishmentName: establishment.name || "Mi Establecimiento",
  };
}
