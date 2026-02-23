type AuditLevel = "info" | "warn" | "error";

export function auditLog(
  level: AuditLevel,
  event: string,
  details: Record<string, unknown> = {}
) {
  const payload = {
    event,
    level,
    timestamp: new Date().toISOString(),
    ...details,
  };

  const line = `[audit] ${JSON.stringify(payload)}`;
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}
