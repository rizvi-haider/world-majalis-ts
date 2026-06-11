import { NextResponse } from "next/server";
import { getRecordedVideosForChannels } from "@/lib/youtube";
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
      const freshRecorded = await getRecordedVideosForChannels(channelIds);
      
      // Saves specifically to the "recorded" key for this country
      await redis.set(`majalis:recorded:${country.id}`, freshRecorded);
    }
    
    return NextResponse.json({ success: true, message: "Recorded cache refreshed" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Recorded cache failed" }, { status: 500 });
  }
}