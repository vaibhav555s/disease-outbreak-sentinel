import { useQuery } from "@tanstack/react-query";
import { CONFIG } from "@/config";
import { generateCityDataset } from "./dataSimulator";

export interface PharmacyData {
  date: string;
  state: string;
  city: string;
  fever_medicine: number;
  cough_medicine: number;
  diarrhea_medicine: number;
  dengue_medicine: number;
  malaria_medicine: number;
  flu_medicine: number;
  total_sales: number;
}

export interface HospitalData {
  date: string;
  state: string;
  city: string;
  opd_visits: number;
  fever_cases: number;
  cough_cases: number;
  diarrhea_cases: number;
  dengue_cases: number;
  malaria_cases: number;
  flu_cases: number;
  total_cases: number;
}

export interface SearchTrendData {
  date: string;
  state: string;
  fever: number;
  cough: number;
  diarrhea: number;
  dengue: number;
  malaria: number;
  flu: number;
}

export interface SocialMentionData {
  date: string;
  state: string;
  platform: string;
  health_mentions: number;
  disease_mentions: number;
  sentiment_score: number;
}

// Data fetching functions with new mode logic
const fetchData = async <T>(endpoint: string): Promise<T[]> => {
  // Mode-specific data fetching logic:
  // Simulated: Sim pharmacy + sim hospital + (live Trends & Social if available, else fallback to sim)
  // Live: Only live Trends & Social (clinical data returns empty)
  // Mixed: Sim pharmacy + sim hospital + live Trends & Social

  const isClinicData = endpoint === "pharmacy" || endpoint === "hospital";
  const isTrendSocialData = endpoint === "trends" || endpoint === "social";

  if (CONFIG.dataMode === "simulated") {
    // All simulated data - generate realistic synthetic data
    return generateSimulatedData<T>(endpoint);
  } else if (CONFIG.dataMode === "live") {
    if (isClinicData) {
      // Live mode: hide clinical data
      return [];
    }
    // Try to fetch live trends/social data
    try {
      const response = await fetch(`/data/${endpoint}.json`);
      if (!response.ok) throw new Error(`Failed to fetch ${endpoint} data`);
      return response.json();
    } catch (error) {
      console.warn(`Live data not available for ${endpoint}, using simulated fallback`);
      return [];
    }
  } else if (CONFIG.dataMode === "mixed") {
    if (isClinicData) {
      // Mixed mode: use simulated clinical data
      return generateSimulatedData<T>(endpoint);
    }
    // Try to fetch live trends/social data, fallback to simulated
    try {
      const response = await fetch(`/data/${endpoint}.json`);
      if (!response.ok) throw new Error(`Failed to fetch ${endpoint} data`);
      return response.json();
    } catch (error) {
      console.warn(`Live data not available for ${endpoint}, using simulated fallback`);
      return [];
    }
  }

  return [];
};

// Generate simulated data that matches our interfaces
const generateSimulatedData = <T extends PharmacyData | HospitalData | SearchTrendData | SocialMentionData>(
  endpoint: string
): T[] => {
  const cities = CONFIG.targetCities;
  const data: T[] = [];

  if (endpoint === "pharmacy") {
    cities.forEach(city => {
      const cityData = generateCityDataset(city, 15);
      cityData.pharmacy.forEach(record => {
        // Convert synthetic pharmacy data to PharmacyData interface
        const existingRecord = data.find(d =>
          (d as PharmacyData).date === record.date &&
          (d as PharmacyData).city === record.city
        ) as PharmacyData;

        if (existingRecord) {
          // Aggregate medicine sales by category
          if (record.category === "fever_medicine") existingRecord.fever_medicine += record.quantity_sold;
          if (record.category === "cough_medicine") existingRecord.cough_medicine += record.quantity_sold;
          if (record.category === "diarrhea_medicine") existingRecord.diarrhea_medicine += record.quantity_sold;
          if (record.category === "dengue_medicine") existingRecord.dengue_medicine += record.quantity_sold;
          if (record.category === "malaria_medicine") existingRecord.malaria_medicine += record.quantity_sold;
          if (record.category === "flu_medicine") existingRecord.flu_medicine += record.quantity_sold;
          existingRecord.total_sales += record.quantity_sold;
        } else {
          const newRecord: PharmacyData = {
            date: record.date,
            state: record.state,
            city: record.city,
            fever_medicine: record.category === "fever_medicine" ? record.quantity_sold : 0,
            cough_medicine: record.category === "cough_medicine" ? record.quantity_sold : 0,
            diarrhea_medicine: record.category === "diarrhea_medicine" ? record.quantity_sold : 0,
            dengue_medicine: record.category === "dengue_medicine" ? record.quantity_sold : 0,
            malaria_medicine: record.category === "malaria_medicine" ? record.quantity_sold : 0,
            flu_medicine: record.category === "flu_medicine" ? record.quantity_sold : 0,
            total_sales: record.quantity_sold
          };
          data.push(newRecord as T);
        }
      });
    });
  } else if (endpoint === "hospital") {
    cities.forEach(city => {
      const cityData = generateCityDataset(city, 15);
      const hospitalByDate: Record<string, HospitalData> = {};

      cityData.hospital.forEach(record => {
        const key = `${record.date}-${record.city}`;
        if (!hospitalByDate[key]) {
          hospitalByDate[key] = {
            date: record.date,
            state: record.state,
            city: record.city,
            opd_visits: 0,
            fever_cases: 0,
            cough_cases: 0,
            diarrhea_cases: 0,
            dengue_cases: 0,
            malaria_cases: 0,
            flu_cases: 0,
            total_cases: 0
          };
        }

        const hospitalRecord = hospitalByDate[key];
        hospitalRecord.opd_visits++;
        hospitalRecord.total_cases++;

        // Count cases by diagnosis
        const diagnosis = record.diagnosis.toLowerCase();
        if (diagnosis.includes("fever")) hospitalRecord.fever_cases++;
        if (diagnosis.includes("cough")) hospitalRecord.cough_cases++;
        if (diagnosis.includes("diarrhea")) hospitalRecord.diarrhea_cases++;
        if (diagnosis.includes("dengue")) hospitalRecord.dengue_cases++;
        if (diagnosis.includes("malaria")) hospitalRecord.malaria_cases++;
        if (diagnosis.includes("flu")) hospitalRecord.flu_cases++;
      });

      Object.values(hospitalByDate).forEach(record => {
        data.push(record as T);
      });
    });
  }

  return data;
};

export const usePharmacyData = () => {
  return useQuery({
    queryKey: ["pharmacy-data"],
    queryFn: () => fetchData<PharmacyData>("pharmacy"),
    refetchInterval: CONFIG.polling.interval,
    staleTime: 2000,
  });
};

export const useHospitalData = () => {
  return useQuery({
    queryKey: ["hospital-data"],
    queryFn: () => fetchData<HospitalData>("hospital"),
    refetchInterval: CONFIG.polling.interval,
    staleTime: 2000,
  });
};

export const useSearchTrendData = () => {
  return useQuery({
    queryKey: ["search-trends"],
    queryFn: () => fetchData<SearchTrendData>("trends"),
    refetchInterval: CONFIG.polling.interval,
    staleTime: 2000,
  });
};

export const useSocialMentionData = () => {
  return useQuery({
    queryKey: ["social-mentions"],
    queryFn: () => fetchData<SocialMentionData>("social"),
    refetchInterval: CONFIG.polling.interval,
    staleTime: 2000,
  });
};