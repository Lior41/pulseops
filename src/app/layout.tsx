import type {Metadata} from "next";
import "./globals.css";
export const metadata:Metadata={title:{default:"PulseOps · Security Operations",template:"%s · PulseOps"},description:"Investigate simulated security telemetry with evidence-based detection and structured AI assistance.",robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en" className="dark" suppressHydrationWarning><body>{children}</body></html>;}
