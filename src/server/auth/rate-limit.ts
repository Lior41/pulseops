import {db} from "@/server/db";
import {AppError} from "@/server/errors";
export async function rateLimit(key:string,limit:number,seconds:number) {
  const start=Math.floor(Date.now()/(seconds*1000));
  const bucket=await db.rateLimitBucket.upsert({where:{key:`${key}:${start}`},create:{key:`${key}:${start}`,count:1,expiresAt:new Date((start+1)*seconds*1000)},update:{count:{increment:1}}});
  if(bucket.count>limit)throw new AppError("RATE_LIMIT","Too many requests. Please try again shortly.",429);
}
