import { getVideosForChannels } from "@/lib/youtube";
import DashboardClient from "@/components/DashboardClient";
import countriesData from "@/data/channels.json";
import { CountryData } from "@/types";

export default async function Home() {
  // Fetch YouTube data per country — all channels in a country fetched in parallel,
  // results merged. This replaces the old per-channel sequential approach.
  const enrichedCountries: CountryData[] = await Promise.all(
    countriesData.map(async (country) => {
      const channelIds = country.channels.map((c) => c.channelId);
      const { liveStreams, recordedVideos } = await getVideosForChannels(channelIds);

      // Attach results to a single synthetic "aggregated" channel per country.
      // The DashboardClient already does flatMap so this is compatible.
      const enrichedChannels = country.channels.map((channel, i) => ({
        ...channel,
        // First channel carries all results; rest are empty (avoids duplicates)
        liveStreams: i === 0 ? liveStreams : [],
        recordedVideos: i === 0 ? recordedVideos : [],
      }));

      return { ...country, channels: enrichedChannels };
    })
  );

  return <DashboardClient countries={enrichedCountries} />;
}
