import { NextResponse } from "next/server";
import { getLiveVideosForChannels } from "@/lib/youtube";
import countriesData from "@/data/channels.json";
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(request: Request) {
  try {
    for (const country of countriesData) {
      const channelIds = country.channels.map(c => c.channelId);
      const freshLive = await getLiveVideosForChannels(channelIds);
      
      // Saves specifically to the "live" key for this country
      await redis.set(`majalis:live:${country.id}`, freshLive);
    }
    
    return NextResponse.json({ success: true, message: "Live cache refreshed" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Live cache failed" }, { status: 500 });
  }
}