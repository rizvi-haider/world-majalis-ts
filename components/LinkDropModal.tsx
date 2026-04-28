"use client";

import { useState } from "react";
import { CountryData } from "@/types";

interface Props {
  countries: CountryData[];
  onStreamAdded: (countryId: string) => void;
}

type Step = "form" | "validating" | "success" | "error";

export default function LinkDropModal({ countries, onStreamAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [countryId, setCountryId] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<{ title: string; channelName: string; thumbnail: string } | null>(null);

  const reset = () => {
    setUrl("");
    setCountryId("");
    setStep("form");
    setMessage("");
    setPreview(null);
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(reset, 300); // reset after close animation
  };

  const handleSubmit = async () => {
    if (!url.trim() || !countryId) {
      setMessage("Please enter a YouTube URL and select a country.");
      return;
    }

    setStep("validating");
    setMessage("");

    try {
      const res = await fetch("/api/submit-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), countryId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStep("error");
        setMessage(data.error || "Something went wrong. Please try again.");
        return;
      }

      setPreview({
        title: data.stream.title,
        channelName: data.stream.channelName,
        thumbnail: data.stream.thumbnail,
      });
      setStep("success");
      onStreamAdded(countryId);
    } catch {
      setStep("error");
      setMessage("Network error. Please check your connection and try again.");
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
        aria-label="Drop a live stream link"
      >
        <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
        Drop a Live Majalis Link
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          {/* Modal */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            
            {/* Header */}
            <div className="bg-gray-900 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-lg flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                  Drop a Live Majalis Link
                </h2>
                <p className="text-gray-400 text-sm mt-0.5">
                  Know of a live Majalis? Share it with the world.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="p-6">

              {/* FORM STATE */}
              {(step === "form" || step === "validating" || step === "error") && (
                <div className="flex flex-col gap-4">
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      YouTube Live URL
                    </label>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => { setUrl(e.target.value); setStep("form"); setMessage(""); }}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-800 transition-colors"
                      disabled={step === "validating"}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Paste a YouTube live stream link. Only currently live streams will be accepted.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Country
                    </label>
                    <select
                      value={countryId}
                      onChange={(e) => setCountryId(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-800 transition-colors bg-white"
                      disabled={step === "validating"}
                    >
                      <option value="">Select a country...</option>
                      {countries.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Error message */}
                  {step === "error" && message && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                      {message}
                    </div>
                  )}

                  {/* Inline validation message (not an error) */}
                  {step === "form" && message && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
                      {message}
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={step === "validating"}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {step === "validating" ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Verifying link...
                      </>
                    ) : (
                      "Submit Stream"
                    )}
                  </button>

                  <p className="text-xs text-center text-gray-400">
                    All submissions are verified and must be actively live. Streams expire after 3 hours.
                  </p>
                </div>
              )}

              {/* SUCCESS STATE */}
              {step === "success" && preview && (
                <div className="flex flex-col items-center gap-4 text-center py-2">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Stream added!</h3>
                    <p className="text-gray-500 text-sm mt-1">It will appear on the map within 60 seconds.</p>
                  </div>
                  {preview.thumbnail && (
                    <img
                      src={preview.thumbnail}
                      alt={preview.title}
                      className="rounded-lg w-full object-cover border"
                    />
                  )}
                  <div className="text-left w-full bg-gray-50 rounded-lg p-3 border">
                    <p className="font-semibold text-sm text-gray-800 line-clamp-2">{preview.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{preview.channelName}</p>
                  </div>
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={reset}
                      className="flex-1 border-2 border-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg hover:border-gray-400 transition-colors text-sm"
                    >
                      Add another
                    </button>
                    <button
                      onClick={handleClose}
                      className="flex-1 bg-gray-900 text-white font-semibold py-2.5 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}
