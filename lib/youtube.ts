import { Redis } from '@upstash/redis';

const API_KEY = process.env.YOUTUBE_API_KEY!;
const BASE = "https://www.googleapis.com/youtube/v3";
const RECENT_PER_CHANNEL = 10;

export interface FetchedVideo {
  id: string;
  title: string;
  channelName: string;
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
  if (!res.ok) throw new Error(`YouTube ${endpoint} failed`);
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
    if (err instanceof Error && err.message.includes("404")) return [];
    throw err;
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

// Aligned back to your frontend shape!
function toFetchedVideo(v: VideosListItem): FetchedVideo {
  return {
    id: v.id,
    title: v.snippet.title,
    channelName: v.snippet.channelTitle,
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
export async function getLiveAndRecordedForChannels(channelIds: string[]) {
  const videos = await getRecentVideosWithStatus(channelIds);
  return {
    live: videos
      .filter((v) => v.snippet.liveBroadcastContent === "live")
      .map(toFetchedVideo),
    recorded: videos
      .filter((v) => v.snippet.liveBroadcastContent === "none")
      .map(toFetchedVideo)
      .sort((a, b) => b.id.localeCompare(a.id)) // temporary sort fallback
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