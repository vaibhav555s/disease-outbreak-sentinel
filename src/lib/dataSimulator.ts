import { CONFIG } from "@/config";

// Types for synthetic data generation
export interface SyntheticHospitalRecord {
  date: string;
  patient_id: string;
  symptoms: string[];
  diagnosis: string;
  age: number;
  gender: "Male" | "Female";
  city: string;
  state: string;
}

export interface SyntheticPharmacyRecord {
  date: string;
  medicine_name: string;
  category: string;
  quantity_sold: number;
  city: string;
  state: string;
}

// Disease patterns and symptoms mapping
const DISEASE_PATTERNS = {
  fever: {
    symptoms: ["fever", "headache", "body_ache", "fatigue"],
    medicines: ["paracetamol", "ibuprofen", "aspirin"],
    category: "fever_medicine",
    baseRate: 0.3,
    outbreakMultiplier: 2.5
  },
  diarrhea: {
    symptoms: ["diarrhea", "vomiting", "dehydration", "abdominal_pain"],
    medicines: ["ors", "loperamide", "zinc_tablets"],
    category: "diarrhea_medicine", 
    baseRate: 0.15,
    outbreakMultiplier: 4.0
  },
  dengue: {
    symptoms: ["fever", "headache", "muscle_pain", "rash", "nausea"],
    medicines: ["paracetamol", "platelet_boosters", "iv_fluids"],
    category: "dengue_medicine",
    baseRate: 0.05,
    outbreakMultiplier: 8.0
  },
  malaria: {
    symptoms: ["fever", "chills", "sweating", "headache", "vomiting"],
    medicines: ["artemether", "chloroquine", "doxycycline"],
    category: "malaria_medicine",
    baseRate: 0.08,
    outbreakMultiplier: 6.0
  },
  flu: {
    symptoms: ["fever", "cough", "sore_throat", "runny_nose", "body_ache"],
    medicines: ["oseltamivir", "paracetamol", "cough_syrup"],
    category: "flu_medicine",
    baseRate: 0.2,
    outbreakMultiplier: 3.0
  },
  cough: {
    symptoms: ["cough", "sore_throat", "chest_congestion"],
    medicines: ["cough_syrup", "expectorant", "throat_lozenges"],
    category: "cough_medicine",
    baseRate: 0.25,
    outbreakMultiplier: 2.0
  }
};

// City-state mapping for target locations
const CITY_STATE_MAP = {
  "Mumbai": "Maharashtra",
  "Pune": "Maharashtra", 
  "Delhi": "Delhi",
  "Bengaluru": "Karnataka",
  "Chennai": "Tamil Nadu",
  "Kolkata": "West Bengal"
};

// Utility functions
const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const generatePatientId = (date: string, index: number): string => {
  const dateStr = date.replace(/-/g, '');
  return `P${dateStr}${String(index).padStart(3, '0')}`;
};

const isOutbreakPeriod = (dayIndex: number): boolean => {
  return dayIndex >= 10 && dayIndex <= 15; // Days 10-15 for outbreak simulation
};

const getSeasonalMultiplier = (dayIndex: number, disease: string): number => {
  // Simulate seasonal patterns
  const seasonalFactors: Record<string, number> = {
    dengue: 1 + 0.3 * Math.sin((dayIndex / 30) * Math.PI * 2), // Monsoon pattern
    malaria: 1 + 0.4 * Math.sin((dayIndex / 30) * Math.PI * 2 + Math.PI/4),
    diarrhea: 1 + 0.2 * Math.sin((dayIndex / 30) * Math.PI * 2 + Math.PI/2),
    flu: 1 + 0.3 * Math.cos((dayIndex / 30) * Math.PI * 2), // Winter pattern
    fever: 1 + 0.1 * Math.sin((dayIndex / 30) * Math.PI * 2),
    cough: 1 + 0.2 * Math.cos((dayIndex / 30) * Math.PI * 2)
  };
  return seasonalFactors[disease] || 1;
};

// Generate synthetic hospital data
export const generateSyntheticHospitalData = (
  days: number = 30,
  city: string = "Mumbai"
): SyntheticHospitalRecord[] => {
  const records: SyntheticHospitalRecord[] = [];
  const state = CITY_STATE_MAP[city as keyof typeof CITY_STATE_MAP] || "Maharashtra";
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let dayIndex = 0; dayIndex < days; dayIndex++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + dayIndex);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // Base daily visits: 50-150 as specified
    const baseVisits = 50 + Math.random() * 100;
    const isOutbreak = isOutbreakPeriod(dayIndex);
    const dailyVisits = Math.floor(baseVisits * (isOutbreak ? 1.8 : 1));

    for (let visitIndex = 0; visitIndex < dailyVisits; visitIndex++) {
      // Determine disease based on patterns and outbreak status
      const diseases = Object.keys(DISEASE_PATTERNS);
      let selectedDisease = "";
      
      for (const disease of diseases) {
        const pattern = DISEASE_PATTERNS[disease as keyof typeof DISEASE_PATTERNS];
        const seasonalMult = getSeasonalMultiplier(dayIndex, disease);
        const outbreakMult = isOutbreak ? pattern.outbreakMultiplier : 1;
        const probability = pattern.baseRate * seasonalMult * outbreakMult;
        
        if (Math.random() < probability) {
          selectedDisease = disease;
          break;
        }
      }
      
      // Fallback to fever if no disease selected
      if (!selectedDisease) selectedDisease = "fever";
      
      const pattern = DISEASE_PATTERNS[selectedDisease as keyof typeof DISEASE_PATTERNS];
      
      records.push({
        date: dateStr,
        patient_id: generatePatientId(dateStr, visitIndex),
        symptoms: pattern.symptoms.slice(0, 2 + Math.floor(Math.random() * 2)), // 2-3 symptoms
        diagnosis: selectedDisease.charAt(0).toUpperCase() + selectedDisease.slice(1),
        age: 5 + Math.floor(Math.random() * 70), // Age 5-75
        gender: Math.random() > 0.5 ? "Male" : "Female",
        city,
        state
      });
    }
  }

  return records;
};

// Generate synthetic pharmacy data
export const generateSyntheticPharmacyData = (
  days: number = 30,
  city: string = "Mumbai"
): SyntheticPharmacyRecord[] => {
  const records: SyntheticPharmacyRecord[] = [];
  const state = CITY_STATE_MAP[city as keyof typeof CITY_STATE_MAP] || "Maharashtra";
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let dayIndex = 0; dayIndex < days; dayIndex++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + dayIndex);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const isOutbreak = isOutbreakPeriod(dayIndex);
    
    // Generate medicine sales for each disease category
    Object.entries(DISEASE_PATTERNS).forEach(([disease, pattern]) => {
      const seasonalMult = getSeasonalMultiplier(dayIndex, disease);
      const outbreakMult = isOutbreak ? pattern.outbreakMultiplier : 1;
      
      pattern.medicines.forEach(medicine => {
        // Base sales: 200-600 units/day distributed across medicines
        const baseSales = 20 + Math.random() * 80; // 20-100 per medicine
        const dailySales = Math.floor(baseSales * seasonalMult * outbreakMult);
        
        if (dailySales > 0) {
          records.push({
            date: dateStr,
            medicine_name: medicine,
            category: pattern.category,
            quantity_sold: dailySales,
            city,
            state
          });
        }
      });
    });
  }

  return records;
};

// Export functions for CSV generation
export const convertToCSV = (data: any[]): string => {
  if (data.length === 0) return "";
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (Array.isArray(value)) {
          return `"${value.join(';')}"`;
        }
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(",")
    )
  ].join("\n");
  
  return csvContent;
};

// Generate complete dataset for a city
export const generateCityDataset = (city: string, days: number = 30) => {
  const hospitalData = generateSyntheticHospitalData(days, city);
  const pharmacyData = generateSyntheticPharmacyData(days, city);
  
  return {
    hospital: hospitalData,
    pharmacy: pharmacyData,
    hospitalCSV: convertToCSV(hospitalData),
    pharmacyCSV: convertToCSV(pharmacyData)
  };
};

// Generate datasets for all target cities
export const generateAllCitiesDataset = (days: number = 30) => {
  const cities = Object.keys(CITY_STATE_MAP);
  const datasets: Record<string, ReturnType<typeof generateCityDataset>> = {};
  
  cities.forEach(city => {
    datasets[city] = generateCityDataset(city, days);
  });
  
  return datasets;
};
