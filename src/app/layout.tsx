import type {Metadata} from "next";
import "./globals.css";
import {Providers} from "@/components/providers";
export const metadata:Metadata={title:{default:"PulseOps · Security Operations",template:"%s · PulseOps"},description:"Investigate simulated security telemetry with evidence-based detection and structured AI assistance.",robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en" suppressHydrationWarning><body><Providers>{children}</Providers></body></html>;}
