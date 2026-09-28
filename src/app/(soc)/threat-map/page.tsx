import { requireActor } from "@/server/auth/guard";
import { dashboardData } from "@/server/services/dashboard";
import { ThreatMap } from "@/features/dashboard/threat-map";
import { PageHeader, Panel, SeverityBadge } from "@/components/soc-ui";
import { countryName } from "@/lib/geo";
import { db } from "@/server/db";
import Link from "next/link";
export default async function MapPage() {
  await requireActor();
  const data = await dashboardData();
  const alerts = await db.alert.findMany({
    where: { status: { in: ["OPEN", "INVESTIGATING"] } },
    orderBy: { severity: "desc" },
    select: { countryCode: true, severity: true },
  });
  return (
    <>
      <PageHeader
        eyebrow="Global visibility"
        title="Signal origins"
        description="Explore approximate, synthetic locations. These points do not represent real-world attacks."
      />
      <ThreatMap countries={data.countries} expanded />
      <div className="mt-5">
        <Panel
          title="Regional breakdown"
          subtitle="Severity is the highest active alert in each region"
        >
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Country</th>
                  <th>Events / 7 days</th>
                  <th>Active alert severity</th>
                  <th>Investigation</th>
                </tr>
              </thead>
              <tbody>
                {data.countries.map((c) => (
                  <tr key={c.code}>
                    <td>{countryName(c.code)}</td>
                    <td className="mono">{c.count.toLocaleString("en-US")}</td>
                    <td>
                      {alerts.find((a) => a.countryCode === c.code) ? (
                        <SeverityBadge
                          severity={alerts.find((a) => a.countryCode === c.code)!.severity}
                        />
                      ) : (
                        <span className="text-muted-foreground">No active alert</span>
                      )}
                    </td>
                    <td>
                      <Link className="text-primary" href={`/alerts?country=${c.code}`}>
                        View alerts →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}
