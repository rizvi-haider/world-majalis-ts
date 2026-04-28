import { NextRequest, NextResponse } from "next/server";
import { validateAndCheckLiveUrl } from "@/lib/youtube";
import countriesData from "@/data/channels.json";

// ─────────────────────────────────────────────────────────────────────────────
// In-memory queue for submitted streams.
// 
// For production: replace this with a Supabase/Firebase/PlanetScale write.
// The interface is identical — just swap the push/read calls.
//
// Each submission expires after 3 hours automatically (checked on read).
// ─────────────────────────────────────────────────────────────────────────────

export interface SubmittedStream {
  id: string;           // YouTube video ID
  url: string;
  title: string;
  channelName: string;
  thumbnail: string;
  countryId: string;
  submittedAt: number;  // Unix ms
  expiresAt: number;    // Unix ms — auto-set to submittedAt + 3 hours
  approved: boolean;    // false = pending admin review
}

// Module-level store (persists across requests in same server instance)
// Replace with DB in production
const streamQueue: SubmittedStream[] = [];

const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

// GET — return all approved, non-expired submitted streams for a country
export async function GET(req: NextRequest) {
  const countryId = req.nextUrl.searchParams.get("countryId");
  const now = Date.now();

  const active = streamQueue.filter(
    (s) =>
      s.approved &&
      s.expiresAt > now &&
      (!countryId || s.countryId === countryId)
  );

  return NextResponse.json({ streams: active });
}

// POST — validate and queue a viewer-submitted stream link
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, countryId } = body as { url: string; countryId: string };

    // 1. Basic input validation
    if (!url || !countryId) {
      return NextResponse.json(
        { error: "URL and country are required" },
        { status: 400 }
      );
    }

    const validCountry = countriesData.find((c) => c.id === countryId);
    if (!validCountry) {
      return NextResponse.json({ error: "Invalid country" }, { status: 400 });
    }

    // 2. Rate limiting — simple: max 3 submissions per country per hour
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentFromCountry = streamQueue.filter(
      (s) => s.countryId === countryId && s.submittedAt > oneHourAgo
    ).length;

    if (recentFromCountry >= 10) {
      return NextResponse.json(
        { error: "Too many submissions for this country. Try again later." },
        { status: 429 }
      );
    }

    // 3. Duplicate check
    const isDuplicate = streamQueue.some((s) => s.url === url && s.expiresAt > Date.now());
    if (isDuplicate) {
      return NextResponse.json(
        { error: "This stream has already been submitted" },
        { status: 409 }
      );
    }

    // 4. Validate via YouTube API
    const result = await validateAndCheckLiveUrl(url);

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error || "Invalid YouTube URL" },
        { status: 422 }
      );
    }

    if (!result.isLive) {
      return NextResponse.json(
        { error: "This video is not currently live. Only live streams can be submitted." },
        { status: 422 }
      );
    }

    // 5. Queue the stream
    // Auto-approve for now. Change `approved: false` to require manual review.
    const now = Date.now();
    const stream: SubmittedStream = {
      id: result.videoId!,
      url,
      title: result.title || "Live Majlis",
      channelName: result.channelName || "Unknown",
      thumbnail: result.thumbnail || "",
      countryId,
      submittedAt: now,
      expiresAt: now + THREE_HOURS_MS,
      approved: true, // ← set to false to require admin approval
    };

    streamQueue.push(stream);

    return NextResponse.json({
      success: true,
      message: "Stream added to the map! It will appear within 60 seconds.",
      stream,
    });
  } catch (err) {
    console.error("submit-stream error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
