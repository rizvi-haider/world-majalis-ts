import { NextResponse } from "next/server";
import { getVideosForChannels } from "@/lib/youtube";
import countriesData from "@/data/channels.json";
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(request: Request) {
  // Optional: Check CRON_SECRET authorization here before executing if you set it up in Vercel

  try {
    for (const country of countriesData) {
      const channelIds = country.channels.map(c => c.channelId);
      
      // 1. Fetch fresh data directly from YouTube
      const freshData = await getVideosForChannels(channelIds);
      
      // 2. Overwrite the old Redis cache with the fresh data
      await redis.set(`majalis:country:${country.id}`, freshData);
    }
    
    return NextResponse.json({ success: true, message: "Redis cache successfully refreshed" });
  } catch (error) {
    console.error("Cron refresh error:", error);
    return NextResponse.json({ success: false, error: "Cache refresh failed" }, { status: 500 });
  }
}