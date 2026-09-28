"use client";
import {ThemeProvider} from "next-themes";
import {Toaster} from "sonner";
export function Providers({children}:{children:React.ReactNode}){return <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}><Toaster richColors theme="dark" position="bottom-right"/>{children}</ThemeProvider>;}
