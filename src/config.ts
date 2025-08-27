export const DATA_MODE = (import.meta.env.VITE_DATA_MODE as "simulated" | "live") || "live";

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