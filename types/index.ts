export interface FetchedVideo {
  id: string;
  title: string;
  channelName: string;
}

export interface Channel {
  name: string;
  channelId: string;
  liveStreams?: FetchedVideo[];
  recordedVideos?: FetchedVideo[];
}

export interface CountryData {
  id: string;
  name: string;
  cityName: string;
  timeZone: string;
  channels: Channel[];
}