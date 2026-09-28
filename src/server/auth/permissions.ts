import type { UserRole } from "@/lib/domain";
export type Capability="read"|"investigate"|"analyze"|"admin";
export function can(role:UserRole,capability:Capability) {
  if(capability==="read") return true;
  if(capability==="admin") return role==="ADMIN";
  return role==="ADMIN"||role==="ANALYST";
}
