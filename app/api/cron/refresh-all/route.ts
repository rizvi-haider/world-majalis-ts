import { NextResponse } from "next/server";
import { getLiveAndRecordedForChannels } from "@/lib/youtube";
import countriesData from "@/data/channels.json";
import { Redis } from '@upstash/redis';

export const maxDuration = 300; 

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(request: Request) {
  const summary: any[] = [];

  for (const country of countriesData) {
    try {
      const channelIds = country.channels.map(c => c.channelId);
      
      // Fetch data using the optimized UU method
      const { live, recorded } = await getLiveAndRecordedForChannels(channelIds);
      
      // Save data independently to Redis
      await redis.set(`majalis:live:${country.id}`, live);
      await redis.set(`majalis:recorded:${country.id}`, recorded);

      summary.push({ country: country.id, ok: true, liveCount: live.length, recordedCount: recorded.length });
    } catch (error) {
      // ISOLATION: If Pakistan fails, log it, record it, but DO NOT stop the loop!
      console.error(`Failed to sync country layer for ${country.name}:`, error);
      summary.push({ country: country.id, ok: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }
  
  return NextResponse.json({ 
    success: true, 
    message: "Global Pro Cache scan completed with isolation tracking.",
    results: summary 
  });
}