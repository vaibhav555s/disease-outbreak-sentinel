import { useQuery } from "@tanstack/react-query";
import { CONFIG } from "@/config";
import { generateCityDataset } from "./dataSimulator";
import { apiClient, isAPIAvailable } from "./api";

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
  const isClinicData = endpoint === "pharmacy" || endpoint === "hospital";

  try {
    // Check if FastAPI backend is available
    const apiAvailable = await isAPIAvailable();

    if (apiAvailable) {
      // Use FastAPI backend
      console.log(`🔄 Fetching ${endpoint} data from FastAPI backend (unified mode)`);

      // Unified mode: Synthetic for clinical, Live for trends/social
      const dataSource = isClinicData ? 'synthetic' : 'live';

      // Fetch from FastAPI
      const response = await apiClient.get(`/api/${endpoint}`, {
        days: 7,
        data_source: dataSource,
        include_outbreak: true
      });

      // Transform API response to match existing interfaces
      return transformAPIResponseToLegacyFormat<T>(response.data, endpoint);

    } else {
      // Fallback to local generation if API is not available
      console.warn(`⚠️ FastAPI backend not available, falling back to local data generation`);
      return generateSimulatedData<T>(endpoint);
    }

  } catch (error) {
    console.error(`❌ Error fetching ${endpoint} data:`, error);

    // Fallback to local generation on any error
    console.log(`🔄 Falling back to local data generation for ${endpoint}`);
    return generateSimulatedData<T>(endpoint);
  }
};

/**
 * Transform FastAPI response data to match existing frontend interfaces
 */
const transformAPIResponseToLegacyFormat = <T>(
  apiData: any[],
  endpoint: string
): T[] => {
  if (endpoint === "trends") {
    // Aggregate trends data by date and location
    const aggregated: Record<string, SearchTrendData> = {};

    apiData.forEach(point => {
      const date = point.timestamp.split('T')[0];
      const key = `${date}-${point.location}`;

      if (!aggregated[key]) {
        aggregated[key] = {
          date,
          city: point.location,
          state: getStateFromCity(point.location),
          fever: 0,
          cough: 0,
          diarrhea: 0,
          dengue: 0,
          malaria: 0,
          flu: 0
        };
      }

      // Add disease-specific search interest
      const disease = point.disease as keyof SearchTrendData;
      if (disease in aggregated[key] && typeof aggregated[key][disease] === 'number') {
        (aggregated[key][disease] as number) += Math.floor(point.value);
      }
    });

    return Object.values(aggregated) as T[];
  } else if (endpoint === "social") {
    // Aggregate social data by date and location
    const aggregated: Record<string, SocialMentionData> = {};

    apiData.forEach(point => {
      const date = point.timestamp.split('T')[0];
      const key = `${date}-${point.location}`;

      if (!aggregated[key]) {
        aggregated[key] = {
          date,
          city: point.location,
          state: getStateFromCity(point.location),
          platform: point.metadata?.platform || "twitter",
          health_mentions: 0,
          sentiment_score: 0,
          trending_topics: []
        };
      }

      // Add mentions
      aggregated[key].health_mentions += Math.floor(point.metadata?.raw_value || point.value);
    });

    return Object.values(aggregated) as T[];
  }

  // For pharmacy and hospital, use individual record mapping
  return apiData.map(point => {
    const baseTransform = {
      date: point.timestamp.split('T')[0],
      city: point.location,
      state: getStateFromCity(point.location)
    };

    if (endpoint === "hospital") {
      return {
        ...baseTransform,
        patient_id: point.metadata?.hospital_id || `P${Math.random().toString(36).substr(2, 9)}`,
        symptoms: [point.disease],
        diagnosis: point.disease.charAt(0).toUpperCase() + point.disease.slice(1),
        age: Math.floor(Math.random() * 70) + 5,
        gender: Math.random() > 0.5 ? "Male" : "Female"
      } as T;
    } else if (endpoint === "pharmacy") {
      return {
        ...baseTransform,
        medicine_name: point.metadata?.medicine || point.disease,
        category: point.disease,
        quantity_sold: Math.floor(point.metadata?.raw_value || point.value * 5)
      } as T;
    }

    return baseTransform as T;
  });
};

/**
 * Helper function to get state from city name
 */
const getStateFromCity = (city: string): string => {
  const cityStateMap: Record<string, string> = {
    "Mumbai": "Maharashtra",
    "Delhi": "Delhi",
    "Pune": "Maharashtra",
    "Bengaluru": "Karnataka",
    "Chennai": "Tamil Nadu",
    "Kolkata": "West Bengal"
  };

  return cityStateMap[city] || "Unknown";
};

// Generate simulated data that matches our interfaces
const generateSimulatedData = <T extends PharmacyData | HospitalData | SearchTrendData | SocialMentionData>(
  endpoint: string
): T[] => {
  const cities = CONFIG?.targetCities || ["Mumbai", "Delhi", "Pune", "Bengaluru", "Chennai", "Kolkata"];
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
    refetchInterval: CONFIG?.polling?.interval || 30000,
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