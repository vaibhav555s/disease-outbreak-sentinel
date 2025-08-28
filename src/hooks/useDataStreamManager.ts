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
  const fetchSourceData = useCallback(async (source: string, endpoint?: string): Promise<any[]> => {
    try {
      // For simulated mode, use existing data generation
      if (mode.mode === 'simulated' || (mode.mode === 'mixed' && ['hospital', 'pharmacy'].includes(source))) {
        // Import and use existing data generation functions
        try {
          const { generateCityDataset } = await import('@/lib/dataSimulator');
        const cities = CONFIG?.targetCities || ["Mumbai", "Delhi", "Pune", "Bengaluru", "Chennai", "Kolkata"];
        const allData: any[] = [];
        
        cities.forEach(city => {
          const dataset = generateCityDataset(city, 7); // Last 7 days
          if (source === 'hospital') {
            allData.push(...dataset.hospital.map(h => ({
              date: h.date,
              state: h.state,
              city: h.city,
              opd_visits: Math.floor(Math.random() * 100) + 50,
              fever_cases: Math.floor(Math.random() * 30) + 10,
              cough_cases: Math.floor(Math.random() * 25) + 8,
              diarrhea_cases: Math.floor(Math.random() * 20) + 5,
              dengue_cases: Math.floor(Math.random() * 15) + 3,
              malaria_cases: Math.floor(Math.random() * 12) + 2,
              flu_cases: Math.floor(Math.random() * 18) + 6,
              total_cases: Math.floor(Math.random() * 150) + 100
            })));
          } else if (source === 'pharmacy') {
            allData.push(...dataset.pharmacy.map(p => ({
              date: p.date,
              state: p.state,
              city: p.city,
              fever_medicine: Math.floor(Math.random() * 50) + 20,
              cough_medicine: Math.floor(Math.random() * 40) + 15,
              diarrhea_medicine: Math.floor(Math.random() * 30) + 10,
              dengue_medicine: Math.floor(Math.random() * 25) + 8,
              malaria_medicine: Math.floor(Math.random() * 20) + 5,
              flu_medicine: Math.floor(Math.random() * 35) + 12,
              total_sales: Math.floor(Math.random() * 200) + 100
            })));
          }
        });

        return allData;
        } catch (importError) {
          console.error('Failed to import data simulator:', importError);
          return [];
        }
      }
      
      // For live mode, fetch from actual endpoints
      if (endpoint) {
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      }
      
      // Fallback to existing JSON files
      const response = await fetch(`/data/${source}.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${source} data`);
      }
      return await response.json();
      
    } catch (error) {
      console.error(`Error fetching ${source} data:`, error);
      throw error;
    }
  }, [mode]);
  
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
            .then(rawData => {
              // Transform raw data to standardized format
              const transformedData = transformData(rawData, sourceName as any);
              dataStreams[sourceName] = transformedData;
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
