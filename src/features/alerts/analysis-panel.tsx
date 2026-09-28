"use client";
import { useState, useTransition } from "react";
import { Sparkles, Loader2, ArrowUpRight, Check, Info } from "lucide-react";
import { analyzeAction } from "@/app/actions";
import { Panel, SeverityBadge } from "@/components/soc-ui";
import { Button } from "@/components/ui/button";
import type { AnalysisResult } from "@/lib/domain";
export function AnalysisPanel({
  id,
  allowed,
  initial,
}: {
  id: string;
  allowed: boolean;
  initial: { mode: string; result: AnalysisResult } | null;
}) {
  const [analysis, setAnalysis] = useState(initial);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  return (
    <div id="analysis">
      <Panel
        title="AI security analyst"
        subtitle="Evidence-grounded assessment · human review required"
        action={<Sparkles size={16} className="text-primary" />}
      >
        <div className="space-y-5 p-5">
          {!analysis && (
            <>
              <div className="flex gap-3 rounded-lg border bg-primary/[.03] p-4">
                <Sparkles className="mt-1 shrink-0 text-primary" size={18} />
                <p className="text-xs leading-6 text-muted-foreground">
                  Turn the detection’s linked evidence into a structured assessment, with
                  recommended next steps and explicit limitations.
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground">
                No API key required. Demo analysis is clearly labelled.
              </p>
            </>
          )}
          {analysis && (
            <div className="space-y-5" aria-live="polite">
              <div className="flex items-center justify-between">
                <span className="rounded border px-2 py-1 text-[9px] uppercase tracking-wider text-primary">
                  {analysis.mode === "LIVE"
                    ? "AI analysis"
                    : analysis.mode === "FALLBACK"
                      ? "Fallback analysis"
                      : "Demo analysis"}
                </span>
                <SeverityBadge severity={analysis.result.riskLevel} />
              </div>
              <div>
                <p className="eyebrow mb-2">Summary</p>
                <p className="text-xs leading-6 text-muted-foreground">{analysis.result.summary}</p>
              </div>
              <div>
                <p className="eyebrow mb-3">Evidence</p>
                <ul className="space-y-3">
                  {analysis.result.evidence.map((e, i) => (
                    <li key={`${e.eventId}-${i}`} className="flex gap-2 text-xs leading-5">
                      <Check size={13} className="mt-1 shrink-0 text-primary" />
                      <a className="hover:text-primary" href={`#event-${e.eventId}`}>
                        {e.observation}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="eyebrow mb-3">Recommended actions</p>
                <ol className="space-y-3">
                  {analysis.result.recommendedActions.map((a, i) => (
                    <li key={a.title} className="rounded-md border p-3">
                      <p className="text-xs">
                        {i + 1}. {a.title}
                      </p>
                      <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                        {a.rationale}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="flex items-center justify-between border-y py-3">
                <div>
                  <p className="text-xs">Confidence</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Uncalibrated {analysis.mode === "LIVE" ? "model estimate" : "demo estimate"}
                  </p>
                </div>
                <strong className="mono text-xl text-primary">{analysis.result.confidence}%</strong>
              </div>
              <div className="flex gap-2">
                <Info size={13} className="mt-1 shrink-0 text-muted-foreground" />
                <p className="text-[10px] leading-5 text-muted-foreground">
                  {analysis.result.limitations.join(" ")}
                </p>
              </div>
            </div>
          )}
          {error && (
            <p role="alert" className="text-xs text-rose-400">
              {error}
            </p>
          )}
          <Button
            className="w-full"
            disabled={!allowed || pending}
            onClick={() => {
              setError("");
              start(async () => {
                try {
                  const result = await analyzeAction({ id });
                  if (!result.ok) setError(result.error);
                  else setAnalysis(result.data);
                } catch {
                  setError("The analysis could not reach the server. Try again.");
                }
              });
            }}
          >
            {pending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Analyzing evidence…
              </>
            ) : (
              <>
                <Sparkles size={14} />
                {analysis ? "Analyze again" : "Analyze with AI"}
                <ArrowUpRight size={13} />
              </>
            )}
          </Button>
          {!allowed && (
            <p className="text-[10px] text-muted-foreground">
              An analyst role is required to generate an assessment.
            </p>
          )}
        </div>
      </Panel>
    </div>
  );
}
