"use client";

import { useState } from "react";
import WorldClock from "@/components/WorldClock";
import { CountryData } from "@/types";

export default function DashboardClient({ countries }: { countries: CountryData[] }) {
  const [activeCountryId, setActiveCountryId] = useState<string>(countries[0]?.id);

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
            // Aggregate all live streams and recorded videos for the active country
            const allLiveStreams = country.channels.flatMap(channel => channel.liveStreams || []);
            const allRecordedVideos = country.channels.flatMap(channel => channel.recordedVideos || []);

            return (
              <div 
                key={country.id} 
                className={activeCountryId === country.id ? "block" : "hidden"}
              >
                <h2 className="text-3xl font-black mb-6 text-gray-800 uppercase tracking-wide">
                  {country.name} Broadcasting
                </h2>
                
                {/* GLOBAL LIVE SECTION FOR THE COUNTRY */}
                <div className="mb-10 border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-red-600 border-b pb-3">
                    <span className="w-4 h-4 bg-red-600 rounded-full animate-pulse"></span>
                    Live Now
                  </h3>
                  
                  {allLiveStreams.length === 0 ? (
                    <p className="text-gray-500 italic">No active live streams currently broadcasting in {country.name}.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {allLiveStreams.map((video) => (
                        <div key={`live-${video.id}`} className="rounded-lg overflow-hidden border bg-gray-50 shadow-sm flex flex-col">
                          <iframe
                            className="w-full aspect-video"
                            src={`https://www.youtube.com/embed/${video.id}?autoplay=1&mute=1`}
                            title={video.title}
                            allowFullScreen
                          ></iframe>
                          <div className="p-4">
                            <h4 className="font-bold text-md leading-tight mb-1 truncate" title={video.title}>
                              {video.title}
                            </h4>
                            <p className="text-sm text-gray-600 font-medium">{video.channelName}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* GLOBAL RECORDED SECTION FOR THE COUNTRY */}
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
                        <div key={`rec-${video.id}`} className="rounded-lg overflow-hidden border bg-gray-50 shadow-sm flex flex-col">
                          <iframe
                            className="w-full aspect-video"
                            src={`https://www.youtube.com/embed/${video.id}`}
                            title={video.title}
                            allowFullScreen
                          ></iframe>
                          <div className="p-4">
                            <h4 className="font-bold text-sm leading-tight mb-1 line-clamp-2" title={video.title}>
                              {video.title}
                            </h4>
                            <p className="text-xs text-gray-600 font-medium">{video.channelName}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}