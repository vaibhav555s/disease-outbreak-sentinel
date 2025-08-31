import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  HealthDataPoint, 
  DashboardMode, 
  MergedDataResult, 
  DataSourceConfig 
} from '@/lib/types';
import { transformData } from '@/lib/dataTransformers';
import { mergeDataStreams, filterMergedData } from '@/lib/dataMerger';
import { CONFIG } from '@/config';
import { apiClient, isAPIAvailable } from '@/lib/api';

/**
 * Custom hook for managing multiple data streams with real-time merging
 * Handles simulated, live, and mixed modes with automatic data transformation and merging
 */
export const useDataStreamManager = (mode: DashboardMode) => {
  // State for merged data and stream status
  const [mergedData, setMergedData] = useState<MergedDataResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for managing intervals and preventing memory leaks
  const intervalRefs = useRef<Record<string, NodeJS.Timeout>>({});
  const lastUpdateRef = useRef<Record<string, string>>({});
  
  /**
   * Fetches data from a specific source endpoint
   * @param source - Data source name
   * @param endpoint - API endpoint or data source
   * @returns Promise with raw data
   */
  const fetchSourceData = useCallback(async (source: string, endpoint?: string): Promise<HealthDataPoint[]> => {
    try {
      console.log(`🔄 Fetching ${source} data (mode: ${mode.mode})`);

      // Check if FastAPI backend is available
      const apiAvailable = await isAPIAvailable();

      if (apiAvailable) {
        // Use FastAPI backend
        console.log(`✅ Using FastAPI backend for ${source} data`);

        // Determine data source based on mode
        let dataSource: 'synthetic' | 'static' | 'live' = 'synthetic';

        if (mode.mode === 'live') {
          if (['hospital', 'pharmacy'].includes(source)) {
            // Live mode: no clinical data
            console.log(`🚫 Hiding clinical data (${source}) in live mode`);
            return [];
          }
          dataSource = 'live'; // Live trends/social
        } else if (mode.mode === 'mixed') {
          dataSource = ['hospital', 'pharmacy'].includes(source) ? 'synthetic' : 'live';
        } else {
          dataSource = 'synthetic'; // All synthetic for simulated mode
        }

        // Fetch from appropriate API endpoint
        let apiResponse;
        const cities = CONFIG?.targetCities || ["Mumbai", "Delhi", "Pune", "Bengaluru", "Chennai", "Kolkata"];
        const states = ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "West Bengal"];

        switch (source) {
          case 'hospital':
            apiResponse = await apiClient.getHospitalData({
              days: 7,
              cities: cities,
              data_source: dataSource as 'synthetic' | 'static',
              include_outbreak: true
            });
            break;

          case 'pharmacy':
            apiResponse = await apiClient.getPharmacyData({
              days: 7,
              cities: cities,
              data_source: dataSource as 'synthetic' | 'static',
              include_outbreak: true
            });
            break;

          case 'trends':
            apiResponse = await apiClient.getTrendsData({
              days: 7,
              states: states,
              data_source: dataSource,
              keywords: ["fever", "dengue", "malaria", "flu", "cough", "diarrhea"]
            });
            break;

          case 'social':
            apiResponse = await apiClient.getSocialData({
              days: 7,
              states: states,
              data_source: dataSource,
              platforms: ["twitter"]
            });
            break;

          default:
            throw new Error(`Unknown source: ${source}`);
        }

        // Return the standardized data points directly
        return apiResponse.data;

      } else {
        // Fallback to local data generation if API is not available
        console.warn(`⚠️ FastAPI backend not available, falling back to local generation for ${source}`);
        return await generateLocalFallbackData(source);
      }

    } catch (error) {
      console.error(`❌ Error fetching ${source} data:`, error);

      // Fallback to local generation on any error
      console.log(`🔄 Falling back to local generation for ${source}`);
      return await generateLocalFallbackData(source);
    }
  }, [mode]);

  /**
   * Generate local fallback data when API is not available
   */
  const generateLocalFallbackData = async (source: string): Promise<HealthDataPoint[]> => {
    try {
      const cities = CONFIG?.targetCities || ["Mumbai", "Delhi", "Pune", "Bengaluru", "Chennai", "Kolkata"];
      const diseases = CONFIG?.targetDiseases || ["fever", "cough", "diarrhea", "dengue", "malaria", "flu"];
      const allData: HealthDataPoint[] = [];

      cities.forEach(city => {
        diseases.forEach(disease => {
          for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);

            // Generate realistic values based on source type
            let value = 0;
            let metadata: any = {};

            if (source === 'hospital') {
              value = Math.floor(Math.random() * 80) + 20; // 20-100
              metadata = {
                raw_value: value * 2,
                unit: "visits",
                hospital_id: `H${Math.abs(city.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 1000}`
              };
            } else if (source === 'pharmacy') {
              value = Math.floor(Math.random() * 70) + 30; // 30-100
              metadata = {
                raw_value: value * 5,
                unit: "units_sold",
                medicine: `${disease}_medicine`,
                pharmacy_id: `P${Math.abs(city.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 1000}`
              };
            } else if (source === 'trends') {
              value = Math.floor(Math.random() * 60) + 20; // 20-80
              metadata = {
                raw_value: value,
                unit: "search_interest",
                search_term: `${disease} symptoms`,
                region: getStateFromCity(city)
              };
            } else if (source === 'social') {
              value = Math.floor(Math.random() * 50) + 10; // 10-60
              metadata = {
                raw_value: Math.floor(value / 2),
                unit: "mentions",
                keyword: disease,
                platform: "twitter",
                sentiment: ["positive", "negative", "neutral"][Math.floor(Math.random() * 3)]
              };
            }

            allData.push({
              timestamp: date.toISOString(),
              location: source === 'trends' || source === 'social' ? getStateFromCity(city) : city,
              disease: disease,
              source: source as any,
              value: value,
              metadata: metadata
            });
          }
        });
      });

      return allData;
    } catch (error) {
      console.error(`Failed to generate local fallback data for ${source}:`, error);
      return [];
    }
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
  
  /**
   * Processes and transforms raw data from all enabled sources
   */
  const processAllSources = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const dataStreams: Record<string, HealthDataPoint[]> = {};
      const promises: Promise<void>[] = [];
      
      // Process each enabled source
      Object.entries(mode.sources).forEach(([sourceName, config]) => {
        if (config.enabled) {
          const promise = fetchSourceData(sourceName, config.endpoint)
            .then(standardizedData => {
              // Data is already in standardized format from FastAPI or fallback
              dataStreams[sourceName] = standardizedData;
            })
            .catch(error => {
              console.error(`Failed to process ${sourceName}:`, error);
              dataStreams[sourceName] = []; // Empty array on error
            });

          promises.push(promise);
        }
      });
      
      // Wait for all sources to complete
      await Promise.all(promises);
      
      // Merge all data streams
      const mergedResult = mergeDataStreams(dataStreams, mode.sources);
      
      setMergedData(mergedResult);
      
      // Update last update timestamps
      Object.keys(dataStreams).forEach(source => {
        lastUpdateRef.current[source] = new Date().toISOString();
      });
      
    } catch (error) {
      console.error('Error processing data sources:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [mode, fetchSourceData]);
  
  /**
   * Sets up real-time data streaming for enabled sources
   */
  const setupDataStreaming = useCallback(() => {
    // Clear existing intervals
    Object.values(intervalRefs.current).forEach(interval => {
      clearInterval(interval);
    });
    intervalRefs.current = {};
    
    // Set up new intervals for enabled sources
    Object.entries(mode.sources).forEach(([sourceName, config]) => {
      if (config.enabled && config.refreshInterval) {
        const interval = setInterval(() => {
          processAllSources();
        }, config.refreshInterval);
        
        intervalRefs.current[sourceName] = interval;
      }
    });
  }, [mode, processAllSources]);
  
  /**
   * Filters the merged data based on provided criteria
   */
  const filterData = useCallback((filters: {
    locations?: string[];
    diseases?: string[];
    sources?: string[];
    dateRange?: { start: string; end: string };
    minValue?: number;
    maxValue?: number;
  }) => {
    if (!mergedData) return null;
    
    return filterMergedData(mergedData, filters);
  }, [mergedData]);
  
  /**
   * Gets real-time statistics about the data streams
   */
  const getStreamStatistics = useCallback(() => {
    if (!mergedData) return null;
    
    const stats = {
      totalRecords: mergedData.totalRecords,
      duplicatesRemoved: mergedData.duplicatesRemoved,
      sourceBreakdown: {} as Record<string, number>,
      diseaseBreakdown: {} as Record<string, number>,
      locationBreakdown: {} as Record<string, number>,
      lastUpdate: mergedData.mergedAt,
      dataFreshness: {} as Record<string, string>
    };
    
    // Calculate breakdowns
    mergedData.data.forEach(point => {
      // Source breakdown
      stats.sourceBreakdown[point.source] = (stats.sourceBreakdown[point.source] || 0) + 1;
      
      // Disease breakdown
      stats.diseaseBreakdown[point.disease] = (stats.diseaseBreakdown[point.disease] || 0) + 1;
      
      // Location breakdown
      stats.locationBreakdown[point.location] = (stats.locationBreakdown[point.location] || 0) + 1;
    });
    
    // Data freshness
    Object.entries(lastUpdateRef.current).forEach(([source, timestamp]) => {
      const minutesAgo = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
      stats.dataFreshness[source] = `${minutesAgo} minutes ago`;
    });
    
    return stats;
  }, [mergedData]);
  
  // Effect to initialize and manage data streaming
  useEffect(() => {
    // Initial data load
    processAllSources();
    
    // Setup streaming if any source has refresh interval
    setupDataStreaming();
    
    // Cleanup on unmount or mode change
    return () => {
      Object.values(intervalRefs.current).forEach(interval => {
        clearInterval(interval);
      });
    };
  }, [processAllSources, setupDataStreaming]);
  
  // Effect to handle mode changes
  useEffect(() => {
    // Reset state when mode changes
    setMergedData(null);
    setError(null);
    lastUpdateRef.current = {};
    
    // Reload data with new mode
    processAllSources();
  }, [mode.mode]);
  
  return {
    // Data and state
    mergedData,
    isLoading,
    error,
    
    // Actions
    refreshData: processAllSources,
    filterData,
    
    // Statistics and monitoring
    statistics: getStreamStatistics(),
    streamStatus: mergedData?.sources || [],
    
    // Utilities
    lastUpdated: mergedData?.mergedAt || null,
    dataCount: mergedData?.totalRecords || 0
  };
};
