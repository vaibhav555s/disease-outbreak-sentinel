const getDataMode = (): "simulated" | "live" => {
  // Check localStorage first, then env variable, then default to live
  const stored = localStorage.getItem("dataMode") as "simulated" | "live" | null;
  if (stored) return stored;
  return (import.meta.env.VITE_DATA_MODE as "simulated" | "live") || "live";
};

export const DATA_MODE = getDataMode();

export const CONFIG = {
  dataMode: DATA_MODE,
  polling: {
    interval: 4000, // 4 seconds
  },
  analytics: {
    anomalyThreshold: 2, // z-score threshold
    windowSize: 7, // days for rolling calculations
  },
} as const;