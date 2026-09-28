import {NextResponse} from "next/server";
import {ZodError} from "zod";
import {AppError} from "./errors";
export function apiError(error:unknown){
  if(error instanceof AppError)return NextResponse.json({error:error.message,code:error.code},{status:error.status});
  if(error instanceof ZodError)return NextResponse.json({error:"Invalid request.",code:"VALIDATION"},{status:400});
  console.error("Request failed",error instanceof Error?error.name:"unknown");
  return NextResponse.json({error:"The request could not be completed. Try again.",code:"INTERNAL"},{status:500});
}
export function checkOrigin(request:Request){
  const expected=process.env.AUTH_URL?new URL(process.env.AUTH_URL).origin:new URL(request.url).origin;
  if(request.headers.get("origin")!==expected)throw new AppError("ORIGIN","Request origin rejected.",403);
}
