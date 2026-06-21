export interface FetchedVideo {
  id: string;
  title: string;
  channelName: string;
  publishedAt: string; // <-- Strongly typed timestamp requirement added!
  thumbnail?: string;
  viewerCount?: number;
}

export interface Channel {
  name: string;
  channelId: string;
  liveStreams: FetchedVideo[];
  recordedVideos: FetchedVideo[];
}

export interface ChannelVideos {
  liveStreams: FetchedVideo[];
  recordedVideos: FetchedVideo[];
}

export interface CountryData {
  id: string;
  name: string;
  cityName: string;
  timeZone: string;
  channels: Channel[];
}