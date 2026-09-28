"use client";
import {ThemeProvider} from "next-themes";
import {Toaster} from "sonner";
export function Providers({children,nonce}:{children:React.ReactNode;nonce?:string}){return <ThemeProvider nonce={nonce} attribute="class" defaultTheme="dark" enableSystem={false}><Toaster richColors theme="dark" position="bottom-right"/>{children}</ThemeProvider>;}
