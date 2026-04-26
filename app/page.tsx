"use client";

import { useState } from "react";
import WorldClock from "@/components/WorldClock";
import countriesData from "@/data/channels.json";
import { CountryData } from "@/types";

export default function Home() {
  const countries: CountryData[] = countriesData;
  const [activeCountryId, setActiveCountryId] = useState<string>(countries[0].id);

  const activeCountry = countries.find((c) => c.id === activeCountryId);

  return (
    <main className="min-h-screen">
      <nav className="bg-gray-900 text-white p-4 text-center text-xl font-bold">
        Global Dashboard
      </nav>

      <div className="max-w-5xl mx-auto my-8 px-4">
        {/* Clocks Section */}
        <div className="flex justify-center gap-12 mb-12 flex-wrap">
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
        <div className="border-4 border-gray-800 bg-white p-8">
          <h2 className="text-2xl font-bold mb-4 border-b-2 pb-2">Countries</h2>

          {/* Tabs */}
          <div className="flex border-2 border-gray-800 mb-6 flex-wrap">
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
          <div className="border-2 border-gray-800 min-h-[300px] p-8 animate-fadeIn">
            <h3 className="text-xl font-semibold mb-4 border-b pb-2">
              Channels in {activeCountry?.name}
            </h3>
            
            {activeCountry?.channels.length === 0 ? (
              <p className="text-gray-500">No channels listed yet.</p>
            ) : (
              <ul className="space-y-3">
                {activeCountry?.channels.map((channel) => (
                  <li key={channel.id} className="bg-gray-50 p-4 rounded border hover:bg-gray-100 transition-colors">
                    <a 
                      href={channel.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-700 font-medium hover:underline flex items-center"
                    >
                      📺 {channel.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}