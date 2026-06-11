import { getVideosFromCache } from "@/lib/youtube";
import DashboardClient from "@/components/DashboardClient";
import countriesData from "@/data/channels.json";
import { CountryData } from "@/types";

export const revalidate = 0; // Ensures Next.js doesn't cache the page statically, relying on Redis instead

export default async function Home() {
  const enrichedCountries: CountryData[] = await Promise.all(
    countriesData.map(async (country) => {
      
      // READ FROM REDIS INSTEAD OF YOUTUBE
      const { liveStreams, recordedVideos } = await getVideosFromCache(country.id);

      const enrichedChannels = country.channels.map((channel, i) => ({
        ...channel,
        liveStreams: i === 0 ? liveStreams : [],
        recordedVideos: i === 0 ? recordedVideos : [],
      }));

      return { ...country, channels: enrichedChannels };
    })
  );

  return <DashboardClient countries={enrichedCountries} />;
}