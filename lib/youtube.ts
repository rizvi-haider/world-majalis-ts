import { Redis } from '@upstash/redis';

const API_KEY = process.env.YOUTUBE_API_KEY!;
const BASE = "https://www.googleapis.com/youtube/v3";
const RECENT_PER_CHANNEL = 10;

export interface FetchedVideo {
  id: string;
  title: string;
  channelName: string;
  publishedAt: string; // <-- Strongly typed timestamp requirement added!
  thumbnail?: string;
  viewerCount?: number;
}

export interface ChannelVideos {
  liveStreams: FetchedVideo[];
  recordedVideos: FetchedVideo[];
}

type VideosListItem = {
  id: string;
  snippet: {
    title: string;
    channelId: string;
    channelTitle: string;
    publishedAt: string;
    liveBroadcastContent: "live" | "upcoming" | "none";
    thumbnails?: { medium?: { url: string } };
  };
  liveStreamingDetails?: {
    concurrentViewers?: string;
  };
};

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const uploadsPlaylistId = (channelId: string) => "UU" + channelId.slice(2);

async function ytFetch(endpoint: string, params: Record<string, string>) {
  const url = new URL(`${BASE}/${endpoint}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("key", API_KEY);
  const res = await fetch(url, { cache: "no-store" });
  
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`YouTube ${endpoint} failed (${res.status}): ${errText}`);
  }
  return res.json();
}

async function getRecentVideoIds(channelId: string): Promise<string[]> {
  try {
    const data = await ytFetch("playlistItems", {
      part: "contentDetails",
      playlistId: uploadsPlaylistId(channelId),
      maxResults: String(RECENT_PER_CHANNEL),
    });
    return (data.items ?? []).map((i: any) => i.contentDetails.videoId);
  } catch (err) {
    console.warn(`⚠️ Skipping broken channel ${channelId}:`, err instanceof Error ? err.message : err);
    return [];
  }
}

async function getVideoDetails(videoIds: string[]): Promise<VideosListItem[]> {
  const out: VideosListItem[] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const data = await ytFetch("videos", {
      part: "snippet,liveStreamingDetails",
      id: batch.join(","),
      maxResults: "50",
    });
    out.push(...(data.items ?? []));
  }
  return out;
}

function toFetchedVideo(v: VideosListItem): FetchedVideo {
  return {
    id: v.id,
    title: v.snippet.title,
    channelName: v.snippet.channelTitle,
    publishedAt: v.snippet.publishedAt, // <-- Grabbing the timestamp for sorting
    thumbnail: v.snippet.thumbnails?.medium?.url ?? "",
    viewerCount: parseInt(v.liveStreamingDetails?.concurrentViewers || "0", 10),
  };
}

async function getRecentVideosWithStatus(channelIds: string[]): Promise<VideosListItem[]> {
  const idLists = await Promise.all(channelIds.map(getRecentVideoIds));
  const allIds = [...new Set(idLists.flat())];
  if (allIds.length === 0) return [];
  return getVideoDetails(allIds);
}

// Single-pass master fetch for both Live and Recorded
// Single-pass master fetch for both Live and Recorded
export async function getLiveAndRecordedForChannels(channelIds: string[]) {
  const videos = await getRecentVideosWithStatus(channelIds);

  const majalisVideos: typeof videos = [];
  const discardedVideos: { Channel: string; Title: string; VideoID: string }[] = [];

  // Separate the videos based on the regex
  videos.forEach((v) => {
    if (v.snippet.title.match(/majalis|majlis|majaalis|majales|majles|majaales|mejlis|moharram|muharram/i)) {
      majalisVideos.push(v);
    } else {
      discardedVideos.push({
        Channel: v.snippet.channelTitle,
        Title: v.snippet.title,
        VideoID: v.id,
      });
    }
  });

  // Print a neatly formatted table to your terminal/Vercel logs
  if (discardedVideos.length > 0) {
    console.log(`\n🚫 SILENT AUDIT: Filtered out ${discardedVideos.length} videos`);
    console.table(discardedVideos);
  }

  // Continue saving ONLY the majalis videos to the database
  return {
    live: majalisVideos
      .filter((v) => v.snippet.liveBroadcastContent === "live")
      .map(toFetchedVideo),
    recorded: majalisVideos
      .filter((v) => v.snippet.liveBroadcastContent === "none")
      .map(toFetchedVideo)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()) 
  };
}

// Keep cache reader clean for page.tsx
export async function getVideosFromCache(countryId: string): Promise<ChannelVideos> {
  try {
    const [liveStreams, recordedVideos] = await Promise.all([
      redis.get<FetchedVideo[]>(`majalis:live:${countryId}`),
      redis.get<FetchedVideo[]>(`majalis:recorded:${countryId}`)
    ]);
    return { liveStreams: liveStreams || [], recordedVideos: recordedVideos || [] };
  } catch (error) {
    return { liveStreams: [], recordedVideos: [] };
  }
}

// ─── HELPER FUNCTIONS FOR USER SUBMISSIONS ─────────────────────────────

export function extractYouTubeVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export async function validateAndCheckLiveUrl(url: string) {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return { valid: false, error: "Invalid YouTube URL" };

  try {
    const API_KEY = process.env.YOUTUBE_API_KEY;
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails&id=${videoId}&key=${API_KEY}`
    );
    const data = await res.json();

    if (!data.items?.length) return { valid: false, error: "Video not found or is private" };

    const item = data.items[0];
    const isLive = item.snippet.liveBroadcastContent === "live";

    return {
      valid: true,
      isLive,
      videoId,
      title: item.snippet.title,
      channelName: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt, // <-- Capture timestamp for manual drops too
      thumbnail: item.snippet.thumbnails?.medium?.url ?? "",
    };
  } catch (err) {
    console.error("Validation error:", err);
    return { valid: false, error: "Failed to validate with YouTube" };
  }
}