import type { DetectionEvent, Severity } from "@/lib/domain";

export type Detection = {
  ruleId: string;
  title: string;
  description: string;
  severity: Severity;
  subjectKey: string;
  evidenceIds: string[];
};
export function detect(event: DetectionEvent, history: DetectionEvent[]): Detection[] {
  const start = event.occurredAt.getTime() - 5 * 60_000;
  const failures = history.filter(
    (e) =>
      e.type === "FAILED_LOGIN" &&
      e.occurredAt.getTime() >= start &&
      e.occurredAt <= event.occurredAt,
  );
  const candidates =
    event.type === "FAILED_LOGIN"
      ? [...failures.filter((e) => e.id !== event.id), event]
      : failures;
  const results: Detection[] = [];
  const person = candidates.filter((e) => event.identityId && e.identityId === event.identityId);
  const ip = candidates.filter((e) => event.ipAddress && e.ipAddress === event.ipAddress);
  if (event.type === "FAILED_LOGIN" && person.length >= 5)
    results.push({
      ruleId: "AUTH-001",
      title: "Repeated authentication failures",
      description: `${person.length} failed sign-ins for one identity in five minutes.`,
      severity: "MEDIUM",
      subjectKey: `identity:${event.identityId}`,
      evidenceIds: person.map((e) => e.id),
    });
  if (event.type === "FAILED_LOGIN" && ip.length >= 15)
    results.push({
      ruleId: "AUTH-002",
      title: "Brute-force pattern from a single source",
      description: `${ip.length} failed sign-ins from one IP in five minutes.`,
      severity: "HIGH",
      subjectKey: `ip:${event.ipAddress}`,
      evidenceIds: ip.map((e) => e.id),
    });
  if (event.type === "NORMAL_LOGIN" && event.metadata.newCountry && person.length >= 10)
    results.push({
      ruleId: "AUTH-003",
      title: "Potential account compromise",
      description: `Successful authentication from an unfamiliar country after ${person.length} failed attempts. Verify the identity and review the session.`,
      severity: "CRITICAL",
      subjectKey: `identity:${event.identityId}`,
      evidenceIds: [...person.map((e) => e.id), event.id],
    });
  const direct: Partial<Record<DetectionEvent["type"], { title: string; severity: Severity }>> = {
    MALWARE_DETECTED: { title: "Simulated endpoint malware signal", severity: "CRITICAL" },
    PRIVILEGE_ESCALATION: { title: "Unusual privileged access", severity: "HIGH" },
    API_ABUSE: { title: "Abnormal API request activity", severity: "HIGH" },
    SUSPICIOUS_DOWNLOAD: { title: "Unusual data download volume", severity: "MEDIUM" },
    BRUTE_FORCE: { title: "Simulated brute-force sensor signal", severity: "HIGH" },
  };
  const match = direct[event.type];
  if (match)
    results.push({
      ruleId: `SIGNAL-${event.type}`,
      title: match.title,
      description:
        "A simulated sensor emitted this signal. Review the linked evidence before taking action.",
      severity: match.severity,
      subjectKey: event.assetId
        ? `asset:${event.assetId}`
        : `identity:${event.identityId ?? event.ipAddress ?? "unknown"}`,
      evidenceIds: [event.id],
    });
  return results;
}
