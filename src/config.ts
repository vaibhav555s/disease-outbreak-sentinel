// Single unified mode: Simulated clinical data + Live trends/social APIs
export const DATA_MODE = "unified" as const;

// Target cities as per scope
export const TARGET_CITIES = ["Mumbai", "Delhi", "Pune", "Bengaluru", "Chennai", "Kolkata"] as const;

// Target diseases/signals as per scope
export const TARGET_DISEASES = ["fever", "cough", "diarrhea", "dengue", "malaria", "flu"] as const;

export const CONFIG = {
  dataMode: DATA_MODE,
  targetCities: TARGET_CITIES,
  targetDiseases: TARGET_DISEASES,
  polling: {
    interval: 0, // Disable auto-refresh - use manual refresh instead
  },
  analytics: {
    anomalyThreshold: 2, // z-score threshold
    windowSize: 7, // days for rolling calculations
  },
} as const;