import {describe,it,expect} from "vitest";
import {detect} from "@/server/detection/rules";
import {can} from "@/server/auth/permissions";
import {securityScore,type DetectionEvent} from "@/lib/domain";
const now=new Date("2026-06-01T12:00:00Z");
function event(i:number,overrides:Partial<DetectionEvent>={}):DetectionEvent{return {id:`e-${i}`,source:"test",sourceEventId:`e-${i}`,type:"FAILED_LOGIN",category:"AUTHENTICATION",severity:"LOW",identityId:"sarah",assetId:null,ipAddress:"192.0.2.42",countryCode:"DE",occurredAt:new Date(now.getTime()-i*1000),metadata:{},...overrides};}
describe("detection windows",()=>{
  it("triggers on the fifth failure, not the fourth",()=>{
    expect(detect(event(0),[event(1),event(2),event(3)])).toHaveLength(0);
    expect(detect(event(0),[event(1),event(2),event(3),event(4)])[0]?.ruleId).toBe("AUTH-001");
  });
  it("uses a shared source IP across distinct identities",()=>{
    const previous=Array.from({length:14},(_,i)=>event(i+1,{identityId:`person-${i}`}));
    expect(detect(event(0),previous).some(r=>r.ruleId==="AUTH-002")).toBe(true);
  });
  it("excludes stale and future evidence",()=>{
    const stale=Array.from({length:20},(_,i)=>event(i,{occurredAt:new Date(now.getTime()-300001)}));
    expect(detect(event(0),stale)).toHaveLength(0);
    expect(detect(event(0),stale.map(e=>({...e,occurredAt:new Date(now.getTime()+1)})))).toHaveLength(0);
  });
  it("correlates unfamiliar-country success with 10 prior failures",()=>{
    const failures=Array.from({length:10},(_,i)=>event(i+1));
    const success=event(0,{type:"NORMAL_LOGIN",metadata:{newCountry:true}});
    expect(detect(success,failures)[0]).toMatchObject({ruleId:"AUTH-003",severity:"CRITICAL"});
    expect(detect({...success,metadata:{}},failures)).toHaveLength(0);
    expect(detect(success,failures.slice(0,9))).toHaveLength(0);
  });
  it("does not count an event twice when present in history",()=>expect(detect(event(0),[event(0),event(1),event(2),event(3)])).toHaveLength(0));
});
describe("policy",()=>{
  it("denies viewer writes and analyst administration",()=>{expect(can("VIEWER","investigate")).toBe(false);expect(can("ANALYST","admin")).toBe(false);expect(can("ADMIN","admin")).toBe(true);});
  it("counts active alerts only and clamps score",()=>{expect(securityScore([{severity:"HIGH",status:"OPEN"},{severity:"CRITICAL",status:"RESOLVED"}])).toBe(93);expect(securityScore(Array.from({length:20},()=>({severity:"CRITICAL",status:"OPEN"})))).toBe(0);});
});
