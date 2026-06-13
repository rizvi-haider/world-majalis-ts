import { NextResponse } from "next/server";
import { getLiveAndRecordedForChannels } from "@/lib/youtube";
import countriesData from "@/data/channels.json";
import { Redis } from '@upstash/redis';

export const maxDuration = 300; // Vercel Pro timeout bypass

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(request: Request) {
  try {
    for (const country of countriesData) {
      const channelIds = country.channels.map(c => c.channelId);
      
      // Hit YouTube once using the ultra-cheap 1-unit endpoints!
      const { live, recorded } = await getLiveAndRecordedForChannels(channelIds);
      
      // Save to both separate Redis drawers
      await redis.set(`majalis:live:${country.id}`, live);
      await redis.set(`majalis:recorded:${country.id}`, recorded);
    }
    
    return NextResponse.json({ success: true, message: "Global Pro Cache updated flawlessly" });
  } catch (error) {
    console.error("Cron Master Error:", error);
    return NextResponse.json({ success: false, error: "Sync failed" }, { status: 500 });
  }
}