import { NextResponse } from "next/server";
import { getLiveVideosForChannels, getRecordedVideosForChannels } from "@/lib/youtube";
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
      
      // 1. Fetch both live and recorded data
      const freshLive = await getLiveVideosForChannels(channelIds);
      const freshRecorded = await getRecordedVideosForChannels(channelIds);
      
      // 2. Save them to their respective Redis keys
      await redis.set(`majalis:live:${country.id}`, freshLive);
      await redis.set(`majalis:recorded:${country.id}`, freshRecorded);
    }
    
    return NextResponse.json({ success: true, message: "Daily master cache refreshed" });
  } catch (error) {
    console.error("Master cron error:", error);
    return NextResponse.json({ success: false, error: "Master cache failed" }, { status: 500 });
  }
}