"use client";
import {useState} from "react";
import {signIn} from "next-auth/react";
import {useRouter} from "next/navigation";
import {ArrowRight,Loader2,ShieldCheck} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Field} from "@/components/soc-ui";
import {loginSchema} from "@/lib/domain";
export function LoginForm({demoPassword}:{demoPassword:string|null}){
  const router=useRouter();const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [error,setError]=useState("");const [pending,setPending]=useState(false);
  async function login(demo=false){
    const input={email:demo?"demo@pulseops.dev":email,password:demo?demoPassword??"":password};
    const parsed=loginSchema.safeParse(input);if(!parsed.success){setError("Enter a valid email and a password of at least 8 characters.");return;}
    setPending(true);setError("");
    try{const result=await signIn("credentials",{...parsed.data,redirect:false});if(result?.error){setError("Sign-in failed. Check your credentials or try again shortly.");}else{router.push("/dashboard");router.refresh();}}catch{setError("Unable to reach PulseOps. Please try again.");}finally{setPending(false);}
  }
  return <div className="w-full max-w-[380px]"><div className="mb-8"><div className="mb-6 inline-flex rounded-xl border bg-primary/5 p-3 text-primary"><ShieldCheck size={26}/></div><h1 className="text-3xl font-semibold tracking-tight">Welcome back.</h1><p className="mt-3 text-sm text-muted-foreground">Your security operations, in focus.</p></div><form onSubmit={e=>{e.preventDefault();void login();}} className="space-y-5"><Field label="Work email"><Input required type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" className="h-11"/></Field><Field label="Password"><Input required minLength={8} maxLength={128} type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" className="h-11"/></Field>{error&&<p role="alert" className="rounded-md border border-rose-500/25 bg-rose-500/5 p-3 text-xs text-rose-400">{error}</p>}<Button disabled={pending} className="h-11 w-full">{pending?<Loader2 className="animate-spin"/>:<>Sign in to PulseOps<ArrowRight size={16}/></>}</Button></form>{demoPassword&&<div className="mt-6 border-t pt-6"><Button variant="outline" disabled={pending} onClick={()=>void login(true)} className="h-11 w-full">Try demo account<ArrowRight size={15}/></Button><p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">Explore as an analyst. Shared workspace.<br/>All security telemetry is simulated.</p></div>}<p className="mt-8 text-center text-[10px] text-muted-foreground">Protected sessions · Server-enforced permissions</p></div>;
}
