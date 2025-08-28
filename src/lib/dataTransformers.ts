import { 
  HealthDataPoint, 
  RawHospitalData, 
  RawPharmacyData, 
  RawTrendsData, 
  RawSocialData 
} from './types';

/**
 * Transforms raw hospital data into standardized HealthDataPoint format
 * @param rawData - Raw hospital data from API/simulation
 * @returns Array of standardized health data points
 */
export const transformHospitalData = (rawData: RawHospitalData[]): HealthDataPoint[] => {
  const transformed: HealthDataPoint[] = [];
  
  rawData.forEach(record => {
    // Create data points for each disease type
    const diseases = [
      { name: 'fever', cases: record.fever_cases },
      { name: 'cough', cases: record.cough_cases },
      { name: 'diarrhea', cases: record.diarrhea_cases },
      { name: 'dengue', cases: record.dengue_cases },
      { name: 'malaria', cases: record.malaria_cases },
      { name: 'flu', cases: record.flu_cases }
    ];
    
    diseases.forEach(disease => {
      if (disease.cases > 0) {
        // Normalize cases to 0-100 scale based on total cases
        const normalizedValue = record.total_cases > 0 
          ? Math.min(100, (disease.cases / record.total_cases) * 100)
          : 0;
        
        transformed.push({
          timestamp: new Date(record.date).toISOString(),
          location: record.city,
          disease: disease.name,
          source: 'hospital',
          value: Math.round(normalizedValue * 100) / 100, // Round to 2 decimal places
          metadata: {
            rawValue: disease.cases,
            totalCases: record.total_cases,
            unit: 'cases',
            state: record.state
          }
        });
      }
    });
  });
  
  return transformed;
};

/**
 * Transforms raw pharmacy data into standardized HealthDataPoint format
 * @param rawData - Raw pharmacy data from API/simulation
 * @returns Array of standardized health data points
 */
export const transformPharmacyData = (rawData: RawPharmacyData[]): HealthDataPoint[] => {
  const transformed: HealthDataPoint[] = [];
  
  rawData.forEach(record => {
    // Create data points for each medicine type
    const medicines = [
      { name: 'fever', sales: record.fever_medicine },
      { name: 'cough', sales: record.cough_medicine },
      { name: 'diarrhea', sales: record.diarrhea_medicine },
      { name: 'dengue', sales: record.dengue_medicine },
      { name: 'malaria', sales: record.malaria_medicine },
      { name: 'flu', sales: record.flu_medicine }
    ];
    
    medicines.forEach(medicine => {
      if (medicine.sales > 0) {
        // Normalize sales to 0-100 scale based on total sales
        const normalizedValue = record.total_sales > 0 
          ? Math.min(100, (medicine.sales / record.total_sales) * 100)
          : 0;
        
        transformed.push({
          timestamp: new Date(record.date).toISOString(),
          location: record.city,
          disease: medicine.name,
          source: 'pharmacy',
          value: Math.round(normalizedValue * 100) / 100,
          metadata: {
            rawValue: medicine.sales,
            totalSales: record.total_sales,
            unit: 'units_sold',
            state: record.state
          }
        });
      }
    });
  });
  
  return transformed;
};

/**
 * Transforms raw Google Trends data into standardized HealthDataPoint format
 * @param rawData - Raw trends data from Google Trends API
 * @returns Array of standardized health data points
 */
export const transformTrendsData = (rawData: RawTrendsData[]): HealthDataPoint[] => {
  const transformed: HealthDataPoint[] = [];
  
  rawData.forEach(record => {
    // Create data points for each disease trend
    const trends = [
      { name: 'fever', value: record.fever },
      { name: 'cough', value: record.cough },
      { name: 'diarrhea', value: record.diarrhea },
      { name: 'dengue', value: record.dengue },
      { name: 'malaria', value: record.malaria },
      { name: 'flu', value: record.flu }
    ];
    
    trends.forEach(trend => {
      if (trend.value > 0) {
        // Google Trends data is already normalized to 0-100
        transformed.push({
          timestamp: new Date(record.date).toISOString(),
          location: record.state, // Trends data is typically state-level
          disease: trend.name,
          source: 'trends',
          value: Math.round(trend.value * 100) / 100,
          metadata: {
            rawValue: trend.value,
            unit: 'search_index',
            state: record.state,
            confidence: 0.8 // Google Trends has high confidence
          }
        });
      }
    });
  });
  
  return transformed;
};

/**
 * Transforms raw social media data into standardized HealthDataPoint format
 * @param rawData - Raw social media data from Twitter/X API
 * @returns Array of standardized health data points
 */
export const transformSocialData = (rawData: RawSocialData[]): HealthDataPoint[] => {
  const transformed: HealthDataPoint[] = [];
  
  rawData.forEach(record => {
    // Create a general health mention data point
    if (record.health_mentions > 0) {
      // Normalize mentions to 0-100 scale (assuming max 1000 mentions per day)
      const normalizedValue = Math.min(100, (record.health_mentions / 1000) * 100);
      
      transformed.push({
        timestamp: new Date(record.date).toISOString(),
        location: record.state,
        disease: 'general_health', // Social data is often general health mentions
        source: 'social',
        value: Math.round(normalizedValue * 100) / 100,
        metadata: {
          rawValue: record.health_mentions,
          diseaseMentions: record.disease_mentions,
          sentimentScore: record.sentiment_score,
          platform: record.platform,
          unit: 'mentions',
          state: record.state,
          confidence: Math.abs(record.sentiment_score) // Higher sentiment = higher confidence
        }
      });
    }
    
    // If we have specific disease mentions, create separate data points
    if (record.disease_mentions > 0) {
      const normalizedValue = Math.min(100, (record.disease_mentions / 500) * 100);
      
      transformed.push({
        timestamp: new Date(record.date).toISOString(),
        location: record.state,
        disease: 'disease_specific', // Could be enhanced to detect specific diseases
        source: 'social',
        value: Math.round(normalizedValue * 100) / 100,
        metadata: {
          rawValue: record.disease_mentions,
          healthMentions: record.health_mentions,
          sentimentScore: record.sentiment_score,
          platform: record.platform,
          unit: 'disease_mentions',
          state: record.state,
          confidence: Math.abs(record.sentiment_score)
        }
      });
    }
  });
  
  return transformed;
};

/**
 * Generic transformer that routes data to appropriate transformer based on source
 * @param rawData - Raw data from any source
 * @param source - Data source type
 * @returns Array of standardized health data points
 */
export const transformData = (
  rawData: any[], 
  source: 'hospital' | 'pharmacy' | 'trends' | 'social'
): HealthDataPoint[] => {
  try {
    switch (source) {
      case 'hospital':
        return transformHospitalData(rawData as RawHospitalData[]);
      case 'pharmacy':
        return transformPharmacyData(rawData as RawPharmacyData[]);
      case 'trends':
        return transformTrendsData(rawData as RawTrendsData[]);
      case 'social':
        return transformSocialData(rawData as RawSocialData[]);
      default:
        console.warn(`Unknown data source: ${source}`);
        return [];
    }
  } catch (error) {
    console.error(`Error transforming ${source} data:`, error);
    return [];
  }
};

/**
 * Validates that a data point conforms to the HealthDataPoint interface
 * @param dataPoint - Data point to validate
 * @returns Boolean indicating if data point is valid
 */
export const validateHealthDataPoint = (dataPoint: any): dataPoint is HealthDataPoint => {
  return (
    typeof dataPoint === 'object' &&
    typeof dataPoint.timestamp === 'string' &&
    typeof dataPoint.location === 'string' &&
    typeof dataPoint.disease === 'string' &&
    ['hospital', 'pharmacy', 'trends', 'social'].includes(dataPoint.source) &&
    typeof dataPoint.value === 'number' &&
    dataPoint.value >= 0 &&
    dataPoint.value <= 100
  );
};

/**
 * Filters and validates an array of health data points
 * @param dataPoints - Array of data points to validate
 * @returns Array of valid health data points
 */
export const validateAndFilterData = (dataPoints: any[]): HealthDataPoint[] => {
  return dataPoints.filter(validateHealthDataPoint);
};
