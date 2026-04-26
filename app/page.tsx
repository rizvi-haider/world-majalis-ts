import { getChannelVideos } from "@/lib/youtube";
import DashboardClient from "@/components/DashboardClient";
import countriesData from "@/data/channels.json";
import { CountryData } from "@/types";

export default async function Home() {
  // 1. Fetch all YouTube data on the server securely
  const enrichedCountries: CountryData[] = await Promise.all(
    countriesData.map(async (country) => {
      
      const enrichedChannels = await Promise.all(
        country.channels.map(async (channel) => {
          const videos = await getChannelVideos(channel.channelId);
          return { 
            ...channel, 
            liveStreams: videos.liveStreams, 
            recordedVideos: videos.recordedVideos 
          };
        })
      );

      return { ...country, channels: enrichedChannels };
    })
  );

  // 2. Pass the fully fetched data to the interactive client component
  return <DashboardClient countries={enrichedCountries} />;
}