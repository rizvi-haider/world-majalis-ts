"use client";

import { useState, useCallback } from "react";
import WorldClock from "@/components/WorldClock";
import LinkDropModal from "@/components/LinkDropModal";
import { CountryData, FetchedVideo } from "@/types";

const showLinkDrop = false;

export default function DashboardClient({ countries }: { countries: CountryData[] }) {
  const [activeCountryId, setActiveCountryId] = useState<string>(countries[0]?.id);
  const [droppedStreams, setDroppedStreams] = useState<Record<string, FetchedVideo[]>>({});

  const handleStreamAdded = useCallback(async (countryId: string) => {
    try {
      const res = await fetch(`/api/submit-stream?countryId=${countryId}`);
      const data = await res.json();
      setDroppedStreams((prev) => ({
        ...prev,
        [countryId]: data.streams || [],
      }));
      setActiveCountryId(countryId);
    } catch {
      // Silently fail
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto my-8 px-4">
      {/* Clocks Section - Single Active Clock Optimization */}
      <div className="flex justify-center mb-12">
        {countries
          .filter((country) => country.id === activeCountryId)
          .map((country) => (
            <WorldClock
              key={country.id}
              cityName={country.cityName}
              timeZone={country.timeZone}
              isActive={true} 
            />
          ))}
      </div>

      {/* Main Content Block */}
      <div className="border-4 border-gray-800 bg-gray-50 p-4 md:p-8 rounded-lg shadow-sm">

        {/* Tabs */}
        <div className="flex border-2 border-gray-800 mb-8 rounded overflow-hidden flex-wrap bg-white">
          {countries.map((country) => (
            <button
              key={country.id}
              onClick={() => setActiveCountryId(country.id)}
              className={`tab-btn ${activeCountryId === country.id ? "active" : ""}`}
            >
              {country.name}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="animate-fadeIn">
          {(() => {
            const country = countries.find((c) => c.id === activeCountryId) || countries[0];
            if (!country) return null;
          
            // 1. Fetch raw flattened arrays
            const rawLiveStreams = [
              ...country.channels.flatMap((ch) => ch.liveStreams || []),
              ...(showLinkDrop ? droppedStreams[country.id] || [] : []),
            ];
            const rawRecordedVideos = country.channels.flatMap((ch) => ch.recordedVideos || []);

            // 2. FILTER: Only keep videos with "majalis" in the title (case-insensitive)
            // 2. FILTER: Catch a massive net of spelling variations (case-insensitive)
            const isMajalis = (video: FetchedVideo) => 
              !!video.title.match(/majalis|majlis|majaalis|majales|majles|majaales|mejlis|moharram|muharram/i);
            const filteredLive = rawLiveStreams.filter(isMajalis);
            const filteredRecorded = rawRecordedVideos.filter(isMajalis);

            // 3. Deduplicate
            const uniqueLive = Array.from(new Map(filteredLive.map(v => [v.id, v])).values());
            const uniqueRecorded = Array.from(new Map(filteredRecorded.map(v => [v.id, v])).values());

            // 4. SORT: Try to sort by newest if a publishedAt date exists
            const sortByNewest = (a: FetchedVideo, b: FetchedVideo) => {
              // @ts-ignore - Assuming publishedAt might exist on your backend payload
              if (a.publishedAt && b.publishedAt) {
                 // @ts-ignore
                return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
              }
              return 0; // Fallback to original order
            };

            const allLiveStreams = uniqueLive.sort(sortByNewest);
            // Increased slice slightly to allow for a better spread across separated channels
            const allRecordedVideos = uniqueRecorded.sort(sortByNewest).slice(0, 20);

            // 5. GROUPING: Separate recorded videos by Channel Name
            const groupedRecordedVideos = allRecordedVideos.reduce((acc, video) => {
              if (!acc[video.channelName]) acc[video.channelName] = [];
              acc[video.channelName].push(video);
              return acc;
            }, {} as Record<string, FetchedVideo[]>);

            return (
              <div key={country.id} className="block animate-fadeIn">
                <h2 className="text-3xl font-black mb-6 text-gray-800 uppercase tracking-wide">
                  {country.name} Broadcasting
                </h2>

                {/* LIVE SECTION */}
                <div className="mb-10 border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-red-600 border-b pb-3">
                    <span className="w-4 h-4 bg-red-600 rounded-full animate-pulse" />
                    Live Majalis
                    {allLiveStreams.length > 0 && (
                      <span className="ml-auto text-sm font-normal bg-red-50 text-red-600 border border-red-200 px-2.5 py-0.5 rounded-full">
                        {allLiveStreams.length} stream{allLiveStreams.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </h3>

                  {allLiveStreams.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 italic mb-3">
                        No active Majalis streams currently broadcasting in {country.name}.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {allLiveStreams.map((video) => (
                        <LiveStreamCard key={`live-${video.id}`} video={video} />
                      ))}
                    </div>
                  )}
                </div>

                {/* RECORDED SECTION */}
                <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-gray-800 border-b pb-3">
                    <span className="text-gray-700">📼</span>
                    Recent Majalis Recordings
                  </h3>

                  {Object.keys(groupedRecordedVideos).length === 0 ? (
                    <p className="text-gray-500 italic">No recent Majalis recordings available in {country.name}.</p>
                  ) : (
                    <div className="flex flex-col gap-10">
                      {Object.entries(groupedRecordedVideos).map(([channelName, videos]) => (
                        <div key={channelName}>
                          {/* Channel Header */}
                          <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                            <div className="w-2 h-6 bg-gray-800 rounded-sm"></div>
                            <h4 className="font-bold text-lg text-gray-800">
                              {channelName}
                            </h4>
                          </div>
                          
                          {/* Channel Videos Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {videos.map((video) => (
                              <RecordedVideoCard key={`rec-${video.id}`} video={video} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {showLinkDrop && (
        <LinkDropModal countries={countries} onStreamAdded={handleStreamAdded} />
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LiveStreamCard({ video }: { video: FetchedVideo }) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="rounded-lg overflow-hidden border bg-gray-50 shadow-sm flex flex-col">
      <div 
        className="relative w-full aspect-video bg-black cursor-pointer group"
        onClick={() => setIsLoaded(true)}
      >
        {isLoaded ? (
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1&mute=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            <img
              src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
              alt={video.title}
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-12 bg-black/80 group-hover:bg-red-600 transition-colors rounded-xl flex items-center justify-center backdrop-blur-sm">
                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-white border-b-[10px] border-b-transparent ml-1" />
              </div>
            </div>
          </>
        )}

        <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded pointer-events-none shadow-md">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          LIVE
        </div>
      </div>
      
      <div className="p-4">
        <h4 className="font-bold text-md leading-tight mb-1 truncate" title={video.title}>
          {video.title}
        </h4>
        <p className="text-sm text-gray-600 font-medium">{video.channelName}</p>
      </div>
    </div>
  );
}

function RecordedVideoCard({ video }: { video: FetchedVideo }) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="rounded-lg overflow-hidden border bg-gray-50 shadow-sm flex flex-col">
      <div 
        className="relative w-full aspect-video bg-black cursor-pointer group"
        onClick={() => setIsLoaded(true)}
      >
        {isLoaded ? (
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            <img
              src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
              alt={video.title}
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-12 bg-black/80 group-hover:bg-red-600 transition-colors rounded-xl flex items-center justify-center backdrop-blur-sm">
                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-white border-b-[10px] border-b-transparent ml-1" />
              </div>
            </div>
          </>
        )}
      </div>
      
      <div className="p-4">
        <h4 className="font-bold text-sm leading-tight mb-1 line-clamp-2" title={video.title}>
          {video.title}
        </h4>
      </div>
    </div>
  );
}