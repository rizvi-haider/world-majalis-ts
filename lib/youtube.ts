export interface FetchedVideo {
  id: string;
  title: string;
  channelName: string;
}

export async function getChannelVideos(channelId: string) {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  if (!API_KEY) throw new Error("YouTube API Key is missing");

  try {
    // 1. Fetch Live Streams
    // YouTube's 'search' endpoint allows us to filter by eventType=live
    const liveRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${API_KEY}`,
      { next: { revalidate: 300 } } // Cache for 5 minutes (300 seconds)
    );
    const liveData = await liveRes.json();

    // 2. Fetch Latest Recorded Videos
    // We fetch the 3 most recent uploads
    const recentRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&type=video&maxResults=3&key=${API_KEY}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour (3600 seconds)
    );
    const recentData = await recentRes.json();

    // Format the response
    const formatVideo = (item: any): FetchedVideo => ({
      id: item.id.videoId,
      title: item.snippet.title,
      channelName: item.snippet.channelTitle,
    });

    return {
      liveStreams: liveData.items?.map(formatVideo) || [],
      recordedVideos: recentData.items?.map(formatVideo) || [],
    };
  } catch (error) {
    console.error(`Error fetching data for channel ${channelId}:`, error);
    return { liveStreams: [], recordedVideos: [] };
  }
}