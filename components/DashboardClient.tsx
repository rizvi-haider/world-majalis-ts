"use client";

import { useState, useCallback } from "react";
import WorldClock from "@/components/WorldClock";
import LinkDropModal from "@/components/LinkDropModal";
import { CountryData, FetchedVideo } from "@/types";

export default function DashboardClient({ countries }: { countries: CountryData[] }) {
  const [activeCountryId, setActiveCountryId] = useState<string>(countries[0]?.id);
  // Extra streams submitted via the link-drop modal, keyed by countryId
  const [droppedStreams, setDroppedStreams] = useState<Record<string, FetchedVideo[]>>({});

  // Called by LinkDropModal after a successful submission — re-fetches dropped streams
  const handleStreamAdded = useCallback(async (countryId: string) => {
    try {
      const res = await fetch(`/api/submit-stream?countryId=${countryId}`);
      const data = await res.json();
      setDroppedStreams((prev) => ({
        ...prev,
        [countryId]: data.streams || [],
      }));
      // Switch to the country the stream was submitted for
      setActiveCountryId(countryId);
    } catch {
      // Silently fail — stream was still submitted
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto my-8 px-4">
      {/* Clocks Section */}
      <div className="flex justify-center gap-8 md:gap-12 mb-12 flex-wrap">
        {countries.map((country) => (
          <WorldClock
            key={country.id}
            cityName={country.cityName}
            timeZone={country.timeZone}
            isActive={activeCountryId === country.id}
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
          {countries.map((country) => {
            const allLiveStreams = [
              ...country.channels.flatMap((ch) => ch.liveStreams || []),
              ...(droppedStreams[country.id] || []),
            ];
            const allRecordedVideos = country.channels.flatMap((ch) => ch.recordedVideos || []);

            return (
              <div
                key={country.id}
                className={activeCountryId === country.id ? "block" : "hidden"}
              >
                <h2 className="text-3xl font-black mb-6 text-gray-800 uppercase tracking-wide">
                  {country.name} Broadcasting
                </h2>

                {/* LIVE SECTION */}
                <div className="mb-10 border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-red-600 border-b pb-3">
                    <span className="w-4 h-4 bg-red-600 rounded-full animate-pulse" />
                    Live Now
                    {allLiveStreams.length > 0 && (
                      <span className="ml-auto text-sm font-normal bg-red-50 text-red-600 border border-red-200 px-2.5 py-0.5 rounded-full">
                        {allLiveStreams.length} stream{allLiveStreams.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </h3>

                  {allLiveStreams.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 italic mb-3">
                        No active live streams currently broadcasting in {country.name}.
                      </p>
                      <p className="text-sm text-gray-400">
                        Know of one? Use the <span className="font-semibold text-red-500">Drop a Live Link</span> button below.
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
                    Recent Recordings
                  </h3>

                  {allRecordedVideos.length === 0 ? (
                    <p className="text-gray-500 italic">No recent recordings available in {country.name}.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {allRecordedVideos.map((video) => (
                        <RecordedVideoCard key={`rec-${video.id}`} video={video} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating link-drop button + modal */}
      <LinkDropModal countries={countries} onStreamAdded={handleStreamAdded} />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LiveStreamCard({ video }: { video: FetchedVideo }) {
  return (
    <div className="rounded-lg overflow-hidden border bg-gray-50 shadow-sm flex flex-col">
      <div className="relative">
        <iframe
          className="w-full aspect-video"
          src={`https://www.youtube.com/embed/${video.id}?autoplay=1&mute=1`}
          title={video.title}
          allowFullScreen
        />
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          LIVE
        </div>
        {video.viewerCount !== undefined && video.viewerCount > 0 && (
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
            👁 {video.viewerCount.toLocaleString()}
          </div>
        )}
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
  return (
    <div className="rounded-lg overflow-hidden border bg-gray-50 shadow-sm flex flex-col">
      <iframe
        className="w-full aspect-video"
        src={`https://www.youtube.com/embed/${video.id}`}
        title={video.title}
        allowFullScreen
      />
      <div className="p-4">
        <h4 className="font-bold text-sm leading-tight mb-1 line-clamp-2" title={video.title}>
          {video.title}
        </h4>
        <p className="text-xs text-gray-600 font-medium">{video.channelName}</p>
      </div>
    </div>
  );
}
