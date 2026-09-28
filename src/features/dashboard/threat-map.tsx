import {geoNaturalEarth1,geoPath} from "d3-geo";
import {feature} from "topojson-client";
import type {Topology,GeometryCollection} from "topojson-specification";
import world from "world-atlas/countries-110m.json";
import {geography} from "@/lib/geo";
import {Panel,ViewLink} from "@/components/soc-ui";
import Link from "next/link";
import {number} from "@/lib/utils";
const projection=geoNaturalEarth1().scale(152).translate([440,212]);
const topo=world as unknown as Topology<{countries:GeometryCollection}>;
const land=geoPath(projection)(feature(topo,topo.objects.countries));
export function ThreatMap({countries,expanded=false}:{countries:{code:string;count:number}[];expanded?:boolean}){
  return <Panel title="Global telemetry" subtitle="Approximate synthetic origins · past 7 days" action={<ViewLink href={expanded?"/events":"/threat-map"}>{expanded?"Explore events":"Expand map"}</ViewLink>}><div className="relative overflow-hidden"><div className="grid-map absolute inset-0 opacity-[.13]"/><svg viewBox="0 0 880 410" className={`relative w-full ${expanded?"min-h-[280px]":""}`} role="img" aria-label="World map showing simulated event volumes. Country links are also available below."><path d={land??""} fill="var(--muted)" stroke="var(--border)" strokeWidth=".7"/>{countries.map(({code,count})=>{const country=geography[code];if(!country)return null;const point=projection(country.coordinates);if(!point)return null;const [x,y]=point;const radius=3+Math.log10(count+1);return <a key={code} href={`/alerts?country=${code}`} aria-label={`${country.name}: ${count} simulated events, view alerts`}><circle cx={x} cy={y} r={radius*2.1} fill="#78e8c3" opacity=".08"/><circle cx={x} cy={y} r={radius} fill="#78e8c3" opacity=".25"/><circle cx={x} cy={y} r="2.3" fill="#78e8c3"/><title>{country.name}: {count} simulated events</title></a>;})}</svg><div className="absolute bottom-4 left-5 flex items-center gap-2 text-[9px] text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-primary"/>SIMULATED EVENT ORIGINS<span className="ml-3">{countries.length} REGIONS</span></div></div><div className="grid grid-cols-2 border-t md:grid-cols-4">{countries.slice(0,4).map(({code,count})=><Link key={code} href={`/alerts?country=${code}`} className="border-r px-5 py-3 last:border-0 hover:bg-muted"><p className="text-[10px] text-muted-foreground">{geography[code]?.name??code}</p><p className="mono mt-1 text-sm">{number(count)}<span className="ml-1.5 font-sans text-[9px] text-muted-foreground">events</span></p></Link>)}</div></Panel>;
}
