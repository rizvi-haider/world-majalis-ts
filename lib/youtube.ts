import { Redis } from '@upstash/redis';

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

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * NEW: Reads the video data directly from the Upstash Redis cache.
 * This is what the frontend will call, costing 0 YouTube API quota.
 */
export async function getVideosFromCache(countryId: string): Promise<ChannelVideos> {
  try {
    const cached = await redis.get<ChannelVideos>(`majalis:country:${countryId}`);
    return cached || { liveStreams: [], recordedVideos: [] };
  } catch (error) {
    console.error(`Redis cache read error for ${countryId}:`, error);
    return { liveStreams: [], recordedVideos: [] };
  }
}

/**
 * Fetch live streams AND recent recordings.
 * This should NOW ONLY BE CALLED BY THE CRON JOB, not the frontend.
 */
export async function getVideosForChannels(channelIds: string[]): Promise<ChannelVideos> {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  if (!API_KEY) throw new Error("YouTube API Key is missing");
  if (channelIds.length === 0) return { liveStreams: [], recordedVideos: [] };

  const allLiveStreams: FetchedVideo[] = [];
  const allRecordedVideos: FetchedVideo[] = [];

  await Promise.all(
    channelIds.map(async (channelId) => {
      try {
        // Live streams for this channel (Removed next.js revalidate tags)
        const liveRes = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${API_KEY}`
        );
        const liveData = await liveRes.json();

        if (liveData.items?.length) {
          const liveIds = liveData.items.map((i: any) => i.id.videoId).join(",");
          const statsRes = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails&id=${liveIds}&key=${API_KEY}`
          );
          const statsData = await statsRes.json();

          statsData.items?.forEach((item: any) => {
            allLiveStreams.push({
              id: item.id,
              title: item.snippet.title,
              channelName: item.snippet.channelTitle,
              thumbnail: item.snippet.thumbnails?.medium?.url,
              viewerCount: parseInt(item.liveStreamingDetails?.concurrentViewers || "0", 10),
            });
          });
        }

        // Recent recordings (3 most recent per channel)
        const recentRes = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&type=video&maxResults=3&key=${API_KEY}`
        );
        const recentData = await recentRes.json();

        recentData.items?.forEach((item: any) => {
          allRecordedVideos.push({
            id: item.id.videoId,
            title: item.snippet.title,
            channelName: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails?.medium?.url,
          });
        });
      } catch (err) {
        console.error(`Error fetching channel ${channelId}:`, err);
      }
    })
  );

  return { liveStreams: allLiveStreams, recordedVideos: allRecordedVideos };
}

// ─────────────────────────────────────────────────────────────────────────────
// Validate a user-submitted YouTube URL and check if it is currently live.
// Returns null if invalid or not a YouTube link.
// ─────────────────────────────────────────────────────────────────────────────
export async function validateAndCheckLiveUrl(url: string): Promise<{
  valid: boolean;
  isLive: boolean;
  videoId?: string;
  title?: string;
  channelName?: string;
  thumbnail?: string;
  error?: string;
}> {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  if (!API_KEY) return { valid: false, isLive: false, error: "Server configuration error" };

  // Extract video ID from various YouTube URL formats
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    return { valid: false, isLive: false, error: "Not a valid YouTube URL" };
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails&id=${videoId}&key=${API_KEY}`
    );
    const data = await res.json();

    if (!data.items?.length) {
      return { valid: false, isLive: false, error: "Video not found" };
    }

    const item = data.items[0];
    const isLive = item.snippet?.liveBroadcastContent === "live";

    return {
      valid: true,
      isLive,
      videoId,
      title: item.snippet?.title,
      channelName: item.snippet?.channelTitle,
      thumbnail: item.snippet?.thumbnails?.medium?.url,
    };
  } catch {
    return { valid: false, isLive: false, error: "Failed to verify link" };
  }
}

// Supports: youtu.be/ID, youtube.com/watch?v=ID, youtube.com/live/ID
export function extractYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1);
    if (u.hostname.includes("youtube.com")) {
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      const pathParts = u.pathname.split("/");
      const liveIdx = pathParts.indexOf("live");
      if (liveIdx !== -1) return pathParts[liveIdx + 1];
    }
    return null;
  } catch {
    return null;
  }
}
