import { useQuery } from "@tanstack/react-query";
import { CONFIG } from "@/config";

export interface PharmacyData {
  date: string;
  state: string;
  city: string;
  fever_medicine: number;
  cold_medicine: number;
  cough_medicine: number;
  total_sales: number;
}

export interface HospitalData {
  date: string;
  state: string;
  city: string;
  opd_visits: number;
  fever_cases: number;
  respiratory_cases: number;
  total_cases: number;
}

export interface SearchTrendData {
  date: string;
  state: string;
  fever: number;
  dengue: number;
  malaria: number;
  cough: number;
  covid: number;
}

export interface SocialMentionData {
  date: string;
  state: string;
  platform: string;
  health_mentions: number;
  disease_mentions: number;
  sentiment_score: number;
}

// Data fetching functions
const fetchData = async <T>(endpoint: string): Promise<T[]> => {
  if (CONFIG.dataMode === "simulated") {
    // Return simulated data for simulated mode
    return [];
  }
  
  const response = await fetch(`/data/${endpoint}.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint} data`);
  }
  return response.json();
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