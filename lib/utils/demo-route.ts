export function getDemoBasePath(pathname?: string | null) {
  if (pathname?.startsWith("/demo-public")) return "/demo-public";
  if (pathname?.startsWith("/demo-private")) return "/demo-private";
  return "/demo";
}

export function toDemoPath(basePath: string, target: string) {
  const normalizedTarget = target.startsWith("/") ? target : `/${target}`;
  const demoSuffix = normalizedTarget.startsWith("/demo")
    ? normalizedTarget.replace(/^\/demo/, "")
    : normalizedTarget;
  return `${basePath}${demoSuffix || ""}`;
}
