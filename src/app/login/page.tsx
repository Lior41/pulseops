import { Activity, ArrowUpRight, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/features/auth/login-form";
export const dynamic = "force-dynamic";
export default function Login() {
  return (
    <main className="min-h-screen lg:grid lg:grid-cols-2">
      <section className="relative hidden overflow-hidden border-r bg-card p-12 lg:flex lg:flex-col">
        <div className="flex items-center gap-3 text-lg font-bold tracking-[.16em]">
          <Activity className="text-primary" />
          PULSEOPS
          <span className="ml-2 rounded border px-2 py-1 text-[9px] font-normal tracking-widest text-muted-foreground">
            SECURITY CLOUD
          </span>
        </div>
        <div className="relative z-10 my-auto py-16">
          <p className="eyebrow mb-6 text-primary">Clarity in a world of signals</p>
          <h2 className="max-w-lg text-5xl font-medium leading-[1.13] tracking-tight">
            Every signal.
            <br />
            One clear picture.
          </h2>
          <p className="mt-6 max-w-sm text-sm leading-7 text-muted-foreground">
            Connect the evidence. Understand the risk. Move from detection to resolution with
            confidence.
          </p>
          <div className="mt-10 max-w-md rounded-xl border bg-background/80 p-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-primary" size={19} />
              <span className="text-xs">Evidence-led investigation</span>
              <ArrowUpRight className="ml-auto text-muted-foreground" size={16} />
            </div>
            <div className="mt-5 flex items-end gap-1.5" aria-hidden="true">
              {Array.from({ length: 38 }, (_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm bg-primary/30"
                  style={{ height: 12 + ((i * 19) % 53), opacity: i > 30 ? 0.9 : 0.35 }}
                />
              ))}
            </div>
            <div className="mt-3 flex justify-between text-[9px] text-muted-foreground">
              <span>DETECTION</span>
              <span>INVESTIGATION</span>
              <span>RESOLUTION</span>
            </div>
          </div>
        </div>
        <p className="text-[10px] tracking-wider text-muted-foreground">
          DEFENSIVE SECURITY · SIMULATED TELEMETRY
        </p>
        <div className="pointer-events-none absolute -right-64 top-48 h-[650px] w-[650px] rounded-full border border-primary/10" />
        <div className="pointer-events-none absolute -right-44 top-68 h-[490px] w-[490px] rounded-full border border-primary/10" />
      </section>
      <section className="flex min-h-screen items-center justify-center px-7 py-12">
        <LoginForm
          demoPassword={
            process.env.DEMO_MODE === "true" ? (process.env.DEMO_PASSWORD ?? null) : null
          }
        />
      </section>
    </main>
  );
}
