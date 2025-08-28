const getDataMode = (): "simulated" | "live" | "mixed" => {
  // Check localStorage first, then env variable, then default to mixed (recommended demo mode)
  const stored = localStorage.getItem("dataMode") as "simulated" | "live" | "mixed" | null;
  if (stored) return stored;
  return (import.meta.env.VITE_DATA_MODE as "simulated" | "live" | "mixed") || "mixed";
};

export const DATA_MODE = getDataMode();

// Target cities as per scope
export const TARGET_CITIES = ["Mumbai", "Delhi", "Pune", "Bengaluru", "Chennai", "Kolkata"] as const;

// Target diseases/signals as per scope
export const TARGET_DISEASES = ["fever", "cough", "diarrhea", "dengue", "malaria", "flu"] as const;

export const CONFIG = {
  dataMode: DATA_MODE,
  targetCities: TARGET_CITIES,
  targetDiseases: TARGET_DISEASES,
  polling: {
    interval: 4000, // 4 seconds
  },
  analytics: {
    anomalyThreshold: 2, // z-score threshold
    windowSize: 7, // days for rolling calculations
  },
} as const;