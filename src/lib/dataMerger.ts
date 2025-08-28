import { HealthDataPoint, MergedDataResult, DataSourceConfig, DataStreamStatus } from './types';

/**
 * Creates a unique key for deduplication based on timestamp, location, and disease
 * @param dataPoint - Health data point
 * @returns Unique string key
 */
const createDeduplicationKey = (dataPoint: HealthDataPoint): string => {
  // Normalize timestamp to date only for deduplication (ignore time)
  const date = new Date(dataPoint.timestamp).toISOString().split('T')[0];
  return `${date}|${dataPoint.location.toLowerCase()}|${dataPoint.disease.toLowerCase()}`;
};

/**
 * Applies weighted merging to duplicate data points
 * @param duplicates - Array of duplicate data points
 * @param sourceWeights - Weight configuration for each source
 * @returns Single merged data point
 */
const mergeWeightedDataPoints = (
  duplicates: HealthDataPoint[], 
  sourceWeights: Record<string, number>
): HealthDataPoint => {
  if (duplicates.length === 1) {
    return duplicates[0];
  }
  
  // Calculate weighted average value
  let totalWeightedValue = 0;
  let totalWeight = 0;
  let mergedMetadata: any = {};
  
  // Use the most recent timestamp
  const latestTimestamp = duplicates
    .map(d => new Date(d.timestamp))
    .sort((a, b) => b.getTime() - a.getTime())[0]
    .toISOString();
  
  duplicates.forEach(dataPoint => {
    const weight = sourceWeights[dataPoint.source] || 0;
    totalWeightedValue += dataPoint.value * weight;
    totalWeight += weight;
    
    // Merge metadata from all sources
    if (dataPoint.metadata) {
      mergedMetadata[`${dataPoint.source}_metadata`] = dataPoint.metadata;
    }
  });
  
  // Calculate final weighted value
  const finalValue = totalWeight > 0 ? totalWeightedValue / totalWeight : 0;
  
  // Use the first data point as base and update with merged values
  const baseDataPoint = duplicates[0];
  
  return {
    ...baseDataPoint,
    timestamp: latestTimestamp,
    value: Math.round(finalValue * 100) / 100, // Round to 2 decimal places
    metadata: {
      ...mergedMetadata,
      mergedFrom: duplicates.map(d => d.source),
      originalValues: duplicates.map(d => ({ source: d.source, value: d.value })),
      weights: sourceWeights,
      confidence: Math.min(1, totalWeight) // Confidence based on total weight
    }
  };
};

/**
 * Merges multiple data streams with deduplication and weighting
 * @param dataStreams - Object containing data arrays from different sources
 * @param sourceConfig - Configuration for each data source including weights
 * @returns Merged data result with statistics
 */
export const mergeDataStreams = (
  dataStreams: {
    hospital?: HealthDataPoint[];
    pharmacy?: HealthDataPoint[];
    trends?: HealthDataPoint[];
    social?: HealthDataPoint[];
  },
  sourceConfig: Record<string, DataSourceConfig>
): MergedDataResult => {
  const startTime = Date.now();
  
  // Flatten all data streams into a single array
  const allDataPoints: HealthDataPoint[] = [];
  const sourceStatuses: DataStreamStatus[] = [];
  
  // Extract weights from source configuration
  const sourceWeights: Record<string, number> = {};
  
  Object.entries(dataStreams).forEach(([source, data]) => {
    if (data && Array.isArray(data)) {
      // Add source data to combined array
      allDataPoints.push(...data);
      
      // Track source status
      sourceStatuses.push({
        source,
        isConnected: data.length > 0,
        lastUpdate: data.length > 0 
          ? data.reduce((latest, point) => 
              new Date(point.timestamp) > new Date(latest) ? point.timestamp : latest, 
              data[0].timestamp
            )
          : null,
        errorCount: 0, // Would be tracked by data collection layer
        totalRecords: data.length
      });
      
      // Extract weight configuration
      const config = sourceConfig[source];
      if (config && config.enabled) {
        sourceWeights[source] = config.weight;
      }
    }
  });
  
  // Group data points by deduplication key
  const groupedData = new Map<string, HealthDataPoint[]>();
  
  allDataPoints.forEach(dataPoint => {
    const key = createDeduplicationKey(dataPoint);
    
    if (!groupedData.has(key)) {
      groupedData.set(key, []);
    }
    
    groupedData.get(key)!.push(dataPoint);
  });
  
  // Merge duplicates using weighted averaging
  const mergedData: HealthDataPoint[] = [];
  let duplicatesRemoved = 0;
  
  groupedData.forEach(duplicates => {
    if (duplicates.length > 1) {
      // Multiple data points for same key - merge them
      const merged = mergeWeightedDataPoints(duplicates, sourceWeights);
      mergedData.push(merged);
      duplicatesRemoved += duplicates.length - 1;
    } else {
      // Single data point - keep as is
      mergedData.push(duplicates[0]);
    }
  });
  
  // Sort merged data by timestamp (newest first)
  mergedData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  const endTime = Date.now();
  
  return {
    data: mergedData,
    sources: sourceStatuses,
    mergedAt: new Date().toISOString(),
    totalRecords: mergedData.length,
    duplicatesRemoved
  };
};

/**
 * Filters merged data by various criteria
 * @param mergedResult - Result from mergeDataStreams
 * @param filters - Filter criteria
 * @returns Filtered data result
 */
export const filterMergedData = (
  mergedResult: MergedDataResult,
  filters: {
    locations?: string[];
    diseases?: string[];
    sources?: string[];
    dateRange?: { start: string; end: string };
    minValue?: number;
    maxValue?: number;
  }
): MergedDataResult => {
  let filteredData = [...mergedResult.data];
  
  // Filter by locations
  if (filters.locations && filters.locations.length > 0) {
    filteredData = filteredData.filter(point => 
      filters.locations!.some(location => 
        point.location.toLowerCase().includes(location.toLowerCase())
      )
    );
  }
  
  // Filter by diseases
  if (filters.diseases && filters.diseases.length > 0) {
    filteredData = filteredData.filter(point => 
      filters.diseases!.includes(point.disease)
    );
  }
  
  // Filter by sources
  if (filters.sources && filters.sources.length > 0) {
    filteredData = filteredData.filter(point => 
      filters.sources!.includes(point.source)
    );
  }
  
  // Filter by date range
  if (filters.dateRange) {
    const startDate = new Date(filters.dateRange.start);
    const endDate = new Date(filters.dateRange.end);
    
    filteredData = filteredData.filter(point => {
      const pointDate = new Date(point.timestamp);
      return pointDate >= startDate && pointDate <= endDate;
    });
  }
  
  // Filter by value range
  if (filters.minValue !== undefined) {
    filteredData = filteredData.filter(point => point.value >= filters.minValue!);
  }
  
  if (filters.maxValue !== undefined) {
    filteredData = filteredData.filter(point => point.value <= filters.maxValue!);
  }
  
  return {
    ...mergedResult,
    data: filteredData,
    totalRecords: filteredData.length
  };
};

/**
 * Aggregates merged data by various dimensions
 * @param mergedResult - Result from mergeDataStreams
 * @param aggregation - Aggregation configuration
 * @returns Aggregated data points
 */
export const aggregateMergedData = (
  mergedResult: MergedDataResult,
  aggregation: {
    groupBy: ('location' | 'disease' | 'source' | 'date')[];
    aggregateFunction: 'sum' | 'avg' | 'max' | 'min' | 'count';
  }
): HealthDataPoint[] => {
  const groups = new Map<string, HealthDataPoint[]>();
  
  // Group data points
  mergedResult.data.forEach(point => {
    const groupKey = aggregation.groupBy.map(field => {
      switch (field) {
        case 'date':
          return new Date(point.timestamp).toISOString().split('T')[0];
        case 'location':
          return point.location;
        case 'disease':
          return point.disease;
        case 'source':
          return point.source;
        default:
          return '';
      }
    }).join('|');
    
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    
    groups.get(groupKey)!.push(point);
  });
  
  // Aggregate each group
  const aggregatedData: HealthDataPoint[] = [];
  
  groups.forEach((groupPoints, groupKey) => {
    const values = groupPoints.map(p => p.value);
    let aggregatedValue: number;
    
    switch (aggregation.aggregateFunction) {
      case 'sum':
        aggregatedValue = values.reduce((sum, val) => sum + val, 0);
        break;
      case 'avg':
        aggregatedValue = values.reduce((sum, val) => sum + val, 0) / values.length;
        break;
      case 'max':
        aggregatedValue = Math.max(...values);
        break;
      case 'min':
        aggregatedValue = Math.min(...values);
        break;
      case 'count':
        aggregatedValue = values.length;
        break;
      default:
        aggregatedValue = 0;
    }
    
    // Use the most recent point as base for aggregated data
    const basePoint = groupPoints.reduce((latest, point) => 
      new Date(point.timestamp) > new Date(latest.timestamp) ? point : latest
    );
    
    aggregatedData.push({
      ...basePoint,
      value: Math.round(aggregatedValue * 100) / 100,
      metadata: {
        ...basePoint.metadata,
        aggregatedFrom: groupPoints.length,
        aggregationFunction: aggregation.aggregateFunction,
        groupKey
      }
    });
  });
  
  return aggregatedData;
};
