"use client";

import { useEffect, useState } from "react";

interface WorldClockProps {
  cityName: string;
  timeZone: string;
  isActive: boolean;
}

export default function WorldClock({ cityName, timeZone, isActive }: WorldClockProps) {
  const [time, setTime] = useState<string>("--:--:--");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateClock = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          timeZone: timeZone,
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };

    updateClock(); // Initial call
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [timeZone]);

  // Prevent hydration mismatch on first render
  if (!mounted) return <div className={`clock ${isActive ? "active" : ""}`}><h3>{cityName}</h3><div className="font-mono text-xl font-bold">--:--:--</div></div>;

  return (
    <div className={`clock ${isActive ? "active" : ""}`}>
      <h3 className="m-0 mb-2 text-gray-600 text-lg">{cityName}</h3>
      <div className="font-mono text-xl font-bold">{time}</div>
    </div>
  );
}