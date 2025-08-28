// Standardized data schema for all health monitoring data
export interface HealthDataPoint {
  timestamp: string; // ISO 8601 format
  location: string; // City or region
  disease: string; // Disease type (fever, dengue, etc.)
  source: 'hospital' | 'pharmacy' | 'trends' | 'social'; // Data source
  value: number; // Normalized value (0-100)
  metadata?: {
    confidence?: number;
    rawValue?: number;
    unit?: string;
    [key: string]: any;
  };
}

// Data source configuration
export interface DataSourceConfig {
  enabled: boolean;
  weight: number; // For weighted merging (0-1)
  endpoint?: string;
  refreshInterval?: number; // milliseconds
}

// Dashboard mode configuration
export interface DashboardMode {
  mode: 'simulated' | 'live' | 'mixed';
  sources: {
    hospital: DataSourceConfig;
    pharmacy: DataSourceConfig;
    trends: DataSourceConfig;
    social: DataSourceConfig;
  };
}

// Data stream status
export interface DataStreamStatus {
  source: string;
  isConnected: boolean;
  lastUpdate: string | null;
  errorCount: number;
  totalRecords: number;
}

// Merged data result
export interface MergedDataResult {
  data: HealthDataPoint[];
  sources: DataStreamStatus[];
  mergedAt: string;
  totalRecords: number;
  duplicatesRemoved: number;
}

// Raw data interfaces for transformation
export interface RawHospitalData {
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

export interface RawPharmacyData {
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

export interface RawTrendsData {
  date: string;
  state: string;
  fever: number;
  cough: number;
  diarrhea: number;
  dengue: number;
  malaria: number;
  flu: number;
}

export interface RawSocialData {
  date: string;
  state: string;
  platform: string;
  health_mentions: number;
  disease_mentions: number;
  sentiment_score: number;
}
