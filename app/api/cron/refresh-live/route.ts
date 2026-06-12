// import { NextResponse } from "next/server";
// import { getLiveVideosForChannels } from "@/lib/youtube";
// import countriesData from "@/data/channels.json";
// import { Redis } from '@upstash/redis';

// const redis = new Redis({
//   url: process.env.UPSTASH_REDIS_REST_URL!,
//   token: process.env.UPSTASH_REDIS_REST_TOKEN!,
// });

// export async function GET(request: Request) {
//   try {
//     for (const country of countriesData) {
//       const channelIds = country.channels.map(c => c.channelId);
//       const freshLive = await getLiveVideosForChannels(channelIds);
      
//       // Saves specifically to the "live" key for this country
//       await redis.set(`majalis:live:${country.id}`, freshLive);
//     }
    
//     return NextResponse.json({ success: true, message: "Live cache refreshed" });
//   } catch (error) {
//     return NextResponse.json({ success: false, error: "Live cache failed" }, { status: 500 });
//   }
// }

import { NextResponse } from "next/server";
import { getLiveVideosForChannels } from "@/lib/youtube";
import countriesData from "@/data/channels.json";
import { Redis } from "@upstash/redis";

// Ensure this route is never statically cached and gets headroom on Vercel.
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

type CountryResult = {
  country: string;
  ok: boolean;
  live?: number;
  error?: string;
};

export async function GET(request: Request) {
  // Each country is fetched and cached independently. One country failing
  // (quota, bad channel ID, transient API error) no longer aborts the rest —
  // previously a sequential loop with a single try/catch meant only the first
  // country (India) was written before any failure or timeout stopped the run.
  const results: CountryResult[] = await Promise.all(
    countriesData.map(async (country): Promise<CountryResult> => {
      try {
        const channelIds = country.channels.map((c) => c.channelId);
        const freshLive = await getLiveVideosForChannels(channelIds);

        // Saves specifically to the "live" key for this country
        await redis.set(`majalis:live:${country.id}`, freshLive);

        return {
          country: country.id,
          ok: true,
          live: Array.isArray(freshLive) ? freshLive.length : undefined,
        };
      } catch (error) {
        return {
          country: country.id,
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    })
  );

  const failed = results.filter((r) => !r.ok);
  const allFailed = failed.length === results.length;

  return NextResponse.json(
    {
      success: !allFailed,
      message: allFailed
        ? "Live cache failed for all countries"
        : failed.length > 0
          ? `Live cache refreshed with ${failed.length} failure(s)`
          : "Live cache refreshed",
      results,
    },
    { status: allFailed ? 500 : 200 }
  );
}
