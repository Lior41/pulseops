import { validateAnalysis, type AnalysisResult, type Severity } from "@/lib/domain";
const recommendations: Record<string, AnalysisResult["recommendedActions"]> = {
  "SIGNAL-MALWARE_DETECTED": [
    {
      title: "Validate the endpoint signal",
      rationale:
        "Review the originating sensor evidence and assess whether the simulated finding is a false positive.",
    },
    {
      title: "Review the device timeline",
      rationale: "Correlate this signal with device ownership, sign-ins and privileged activity.",
    },
    {
      title: "Escalate for authorized containment",
      rationale:
        "A real responder may isolate a confirmed affected endpoint using their approved tools. PulseOps performs no external action.",
    },
  ],
  "SIGNAL-API_ABUSE": [
    {
      title: "Review request patterns",
      rationale: "Compare request timing, source and identity with the expected API workload.",
    },
    {
      title: "Verify the integration owner",
      rationale: "Check whether the activity matches an approved automation or a test.",
    },
    {
      title: "Review credential scope",
      rationale:
        "An authorized owner should assess token exposure and least-privilege access if misuse is confirmed.",
    },
  ],
  "SIGNAL-SUSPICIOUS_DOWNLOAD": [
    {
      title: "Verify business context",
      rationale: "Confirm whether the data transfer was expected and approved by the data owner.",
    },
    {
      title: "Review related access",
      rationale: "Correlate downloads with authentication, device and privilege events.",
    },
    {
      title: "Preserve the evidence",
      rationale:
        "Document the scope and timestamps before an authorized responder considers containment.",
    },
  ],
  "SIGNAL-PRIVILEGE_ESCALATION": [
    {
      title: "Check the approval record",
      rationale:
        "Verify whether the privilege change was part of an authorized maintenance operation.",
    },
    {
      title: "Review the account history",
      rationale: "Inspect nearby authentication events and the source device.",
    },
    {
      title: "Review excessive access",
      rationale:
        "Ask an authorized administrator to restore least-privilege permissions if the change is unapproved.",
    },
  ],
};
export function demoAnalysis(
  alert: { description: string; severity: Severity; ruleId: string },
  events: { id: string; type: string }[],
): AnalysisResult {
  return validateAnalysis(
    {
      summary: `${alert.description} This assessment is generated from the detection rule and its linked evidence. Confirm the context with an authorized owner before concluding that a compromise occurred.`,
      riskLevel: alert.severity,
      evidence: events.slice(-6).map((e) => ({
        eventId: e.id,
        observation: `Recorded ${e.type.toLowerCase().replaceAll("_", " ")} in the detection window.`,
      })),
      recommendedActions: recommendations[alert.ruleId] ?? [
        {
          title: "Verify the identity owner's activity",
          rationale: "Confirm the time, device and location through a trusted channel.",
        },
        {
          title: "Review related authentication history",
          rationale: "Correlate failed and successful sign-ins with device activity.",
        },
        {
          title: "Contain only after verification",
          rationale:
            "An authorized operator could revoke suspicious sessions in a real environment. PulseOps performs no external action.",
        },
      ],
      confidence: alert.ruleId === "AUTH-003" ? 82 : 70,
      limitations: [
        "Deterministic demo analysis; no model was called.",
        "Confidence is illustrative, not a calibrated probability.",
        "All telemetry is simulated.",
      ],
    },
    events.map((e) => e.id),
  );
}
