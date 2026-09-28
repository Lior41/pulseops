import {severityWeight,type Severity} from "@/lib/domain";
export function riskScore(alerts:{severity:Severity}[]){return Math.min(100,alerts.reduce((score,a)=>score+severityWeight[a.severity]*4,0));}
export function riskLevel(score:number):Severity{return score>=75?"CRITICAL":score>=45?"HIGH":score>=20?"MEDIUM":"LOW";}
