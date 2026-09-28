"use client";
import {useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {Dialog,DialogContent,DialogTitle,DialogDescription} from "@/components/ui/dialog";
import {Field} from "@/components/soc-ui";
import {updateAlertAction,createIncidentAction} from "@/app/actions";
import {alertStatuses,type Severity} from "@/lib/domain";
import {humanize} from "@/lib/utils";
import {FolderPlus,Loader2} from "lucide-react";
export function AlertControls({alert,allowed}:{alert:{id:string;version:number;title:string;description:string;severity:Severity;status:typeof alertStatuses[number];incidentId:string|null};allowed:boolean}){
  const router=useRouter();const [pending,start]=useTransition();const [open,setOpen]=useState(false);const [status,setStatus]=useState(alert.status);const [reason,setReason]=useState("");
  function save(){start(async()=>{const result=await updateAlertAction({id:alert.id,version:alert.version,status,reason});if(!result.ok)toast.error(result.error);else{toast.success("Alert updated");setOpen(false);router.refresh();}});}
  function create(){start(async()=>{const result=await createIncidentAction({alertId:alert.id,title:alert.title,description:alert.description,severity:alert.severity});if(!result.ok)toast.error(result.error);else{toast.success("Incident created");router.push(`/incidents/${result.data.id}`);}});}
  return <><div className="flex flex-wrap gap-2">{allowed&&<><Button variant="outline" onClick={()=>{setStatus(alert.status);setOpen(true);}} disabled={pending}>Update status</Button>{alert.status==="OPEN"&&<Button variant="outline" disabled={pending} onClick={()=>start(async()=>{const r=await updateAlertAction({id:alert.id,version:alert.version,status:"INVESTIGATING",reason:""});if(!r.ok)toast.error(r.error);else{toast.success("Marked as investigating");router.refresh();}})}>Mark investigating</Button>}</>}{alert.incidentId?<Link href={`/incidents/${alert.incidentId}`} className="rounded-md border px-3 py-2 text-xs text-primary">Open incident →</Link>:allowed&&<Button disabled={pending||["RESOLVED","FALSE_POSITIVE"].includes(alert.status)} onClick={create}>{pending?<Loader2 className="animate-spin" size={14}/>:<FolderPlus size={14}/>}Create incident</Button>}{!allowed&&<span className="text-xs text-muted-foreground">Read-only access</span>}</div><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogTitle>Update alert status</DialogTitle><DialogDescription>Every change is saved to the audit trail.</DialogDescription><Field label="Status"><select className="field" value={status} onChange={e=>setStatus(e.target.value as typeof status)}>{alertStatuses.map(s=><option key={s} value={s}>{humanize(s)}</option>)}</select></Field><Field label="Reason / resolution"><textarea className="field" rows={3} maxLength={1000} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Explain the decision. Required to close an alert."/></Field><Button disabled={pending} onClick={save}>{pending?"Saving…":"Save status"}</Button></DialogContent></Dialog></>;
}
