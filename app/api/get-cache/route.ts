import { NextRequest, NextResponse } from "next/server";
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(request: NextRequest) {
  // Get the country ID from the URL (e.g., ?countryId=india)
  const searchParams = request.nextUrl.searchParams;
  const countryId = searchParams.get("countryId");

  if (!countryId) {
    return NextResponse.json({ error: "Missing countryId parameter" }, { status: 400 });
  }

  try {
    // Fetch both live and recorded data from Redis simultaneously
    const [liveStreams, recordedVideos] = await Promise.all([
      redis.get(`majalis:live:${countryId}`),
      redis.get(`majalis:recorded:${countryId}`)
    ]);

    // Return the sanitized payload to the desktop app
    return NextResponse.json({
      success: true,
      live: liveStreams || [],
      recorded: recordedVideos || []
    });

  } catch (error) {
    console.error("Cache read error:", error);
    return NextResponse.json({ error: "Failed to read cache" }, { status: 500 });
  }
}