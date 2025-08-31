import { PharmacyData, HospitalData, SearchTrendData, SocialMentionData } from "./data";
import { CONFIG } from "@/config";

export interface Anomaly {
  type: "pharmacy" | "hospital" | "search" | "social";
  location: string;
  metric: string;
  value: number;
  zscore: number;
  severity: "low" | "medium" | "high" | "critical";
}

export interface RiskScore {
  state: string;
  city: string;
  score: number;
  confidence: number;
  factors: string[];
}

export interface AlertData {
  id: string;
  type: "outbreak" | "anomaly" | "trend" | "correlation";
  severity: "low" | "medium" | "high" | "critical";
  disease: string;
  location: string;
  confidence: number;
  description: string;
  timestamp: Date;
  acknowledged: boolean;
  estimatedDays: number;
}

// Statistical utilities
export const rollingMean = (values: number[], window: number = CONFIG.analytics.windowSize): number[] => {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const windowValues = values.slice(start, i + 1);
    const mean = windowValues.reduce((sum, val) => sum + val, 0) / windowValues.length;
    result.push(mean);
  }
  return result;
};

export const calculateZScore = (value: number, mean: number, std: number): number => {
  return std === 0 ? 0 : (value - mean) / std;
};

export const standardDeviation = (values: number[], mean: number): number => {
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
};

// Anomaly detection
export const detectPharmacyAnomalies = (data: PharmacyData[]): Anomaly[] => {
  const anomalies: Anomaly[] = [];
  
  // Group by location
  const groupedData = data.reduce((acc, item) => {
    const key = `${item.state}-${item.city}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, PharmacyData[]>);

  Object.entries(groupedData).forEach(([location, items]) => {
    const values = items.map(item => item.total_sales);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const std = standardDeviation(values, mean);
    
    const latest = items[items.length - 1];
    const zscore = calculateZScore(latest.total_sales, mean, std);
    
    if (Math.abs(zscore) > CONFIG.analytics.anomalyThreshold) {
      anomalies.push({
        type: "pharmacy",
        location,
        metric: "total_sales",
        value: latest.total_sales,
        zscore,
        severity: Math.abs(zscore) > 3 ? "critical" : Math.abs(zscore) > 2.5 ? "high" : "medium"
      });
    }
  });

  return anomalies;
};

export const detectHospitalAnomalies = (data: HospitalData[]): Anomaly[] => {
  const anomalies: Anomaly[] = [];
  
  const groupedData = data.reduce((acc, item) => {
    const key = `${item.state}-${item.city}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, HospitalData[]>);

  Object.entries(groupedData).forEach(([location, items]) => {
    const values = items.map(item => item.total_cases);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const std = standardDeviation(values, mean);
    
    const latest = items[items.length - 1];
    const zscore = calculateZScore(latest.total_cases, mean, std);
    
    if (Math.abs(zscore) > CONFIG.analytics.anomalyThreshold) {
      anomalies.push({
        type: "hospital",
        location,
        metric: "total_cases",
        value: latest.total_cases,
        zscore,
        severity: Math.abs(zscore) > 3 ? "critical" : Math.abs(zscore) > 2.5 ? "high" : "medium"
      });
    }
  });

  return anomalies;
};

export const detectSearchAnomalies = (data: SearchTrendData[]): Anomaly[] => {
  const anomalies: Anomaly[] = [];

  console.log('🔍 Search Anomaly Detection:', { dataLength: data.length, sampleData: data.slice(0, 2) });

  // Group by location
  const groupedData = data.reduce((acc, item) => {
    const key = `${item.state}-${item.city}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, SearchTrendData[]>);

  Object.entries(groupedData).forEach(([location, items]) => {
    // Check for anomalies in total search activity
    const values = items.map(item => item.fever + item.cough + item.diarrhea + item.dengue + item.malaria + item.flu);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const std = standardDeviation(values, mean);

    const latest = items[items.length - 1];
    const totalSearches = latest.fever + latest.cough + latest.diarrhea + latest.dengue + latest.malaria + latest.flu;
    const zscore = calculateZScore(totalSearches, mean, std);

    console.log(`🔍 Search Analysis for ${location}:`, {
      totalSearches,
      mean: mean.toFixed(2),
      std: std.toFixed(2),
      zscore: zscore.toFixed(2),
      threshold: CONFIG.analytics.anomalyThreshold
    });

    // Use original threshold for consistent behavior across modes
    const threshold = CONFIG.analytics.anomalyThreshold;
    if (Math.abs(zscore) > threshold) {
      anomalies.push({
        type: "search",
        location,
        metric: "total_searches",
        value: totalSearches,
        zscore,
        severity: Math.abs(zscore) > 3 ? "critical" : Math.abs(zscore) > 2.5 ? "high" : "medium"
      });
    }
  });

  console.log('🔍 Search Anomalies Found:', anomalies.length);
  return anomalies;
};

export const detectSocialAnomalies = (data: SocialMentionData[]): Anomaly[] => {
  const anomalies: Anomaly[] = [];

  console.log('📱 Social Anomaly Detection:', { dataLength: data.length, sampleData: data.slice(0, 2) });

  // Group by location
  const groupedData = data.reduce((acc, item) => {
    const key = `${item.state}-${item.city}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, SocialMentionData[]>);

  Object.entries(groupedData).forEach(([location, items]) => {
    const values = items.map(item => item.health_mentions);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const std = standardDeviation(values, mean);

    const latest = items[items.length - 1];
    const zscore = calculateZScore(latest.health_mentions, mean, std);

    console.log(`📱 Social Analysis for ${location}:`, {
      healthMentions: latest.health_mentions,
      mean: mean.toFixed(2),
      std: std.toFixed(2),
      zscore: zscore.toFixed(2),
      threshold: 1.5
    });

    // Use original threshold for consistent behavior across modes
    const threshold = CONFIG.analytics.anomalyThreshold;
    if (Math.abs(zscore) > threshold) {
      anomalies.push({
        type: "social",
        location,
        metric: "health_mentions",
        value: latest.health_mentions,
        zscore,
        severity: Math.abs(zscore) > 3 ? "critical" : Math.abs(zscore) > 2.5 ? "high" : "medium"
      });
    }
  });

  console.log('📱 Social Anomalies Found:', anomalies.length);
  return anomalies;
};

// Risk score calculation
export const calculateRiskScores = (
  pharmacyData: PharmacyData[],
  hospitalData: HospitalData[],
  searchData: SearchTrendData[],
  socialData: SocialMentionData[]
): RiskScore[] => {
  const scores: RiskScore[] = [];
  
  // Get unique locations from all available data sources
  const locations = new Set([
    ...pharmacyData.map(d => `${d.state}-${d.city}`),
    ...hospitalData.map(d => `${d.state}-${d.city}`),
    ...searchData.map(d => `${d.state}-${d.city}`),
    ...socialData.map(d => `${d.state}-${d.city}`),
  ]);

  locations.forEach(location => {
    const [state, city] = location.split('-');
    
    const pharmacyItems = pharmacyData.filter(d => d.state === state && d.city === city);
    const hospitalItems = hospitalData.filter(d => d.state === state && d.city === city);
    const searchItems = searchData.filter(d => d.state === state);
    const socialItems = socialData.filter(d => d.state === state);
    
    let score = 0;
    let confidence = 0;
    const factors: string[] = [];

    // Pharmacy signal (40% weight)
    if (pharmacyItems.length > 0) {
      const latest = pharmacyItems[pharmacyItems.length - 1];
      const avgSales = pharmacyItems.reduce((sum, item) => sum + item.total_sales, 0) / pharmacyItems.length;
      if (latest.total_sales > avgSales * 1.2) {
        score += 0.4;
        factors.push("High pharmacy sales");
      }
      confidence += 0.25;
    }

    // Hospital signal (35% weight)
    if (hospitalItems.length > 0) {
      const latest = hospitalItems[hospitalItems.length - 1];
      const avgCases = hospitalItems.reduce((sum, item) => sum + item.total_cases, 0) / hospitalItems.length;
      if (latest.total_cases > avgCases * 1.15) {
        score += 0.35;
        factors.push("Increased hospital visits");
      }
      confidence += 0.25;
    }

    // Search trends (15% weight)
    if (searchItems.length > 0) {
      const latest = searchItems[searchItems.length - 1];
      const totalSearches = latest.fever + latest.cough + latest.diarrhea + latest.dengue + latest.malaria + latest.flu;
      if (totalSearches > 50) {
        score += 0.15;
        factors.push("High search activity");
      }
      confidence += 0.25;
    }

    // Social mentions (10% weight)
    if (socialItems.length > 0) {
      const latest = socialItems[socialItems.length - 1];
      if (latest.health_mentions > 20) {
        score += 0.1;
        factors.push("Social media buzz");
      }
      confidence += 0.25;
    }
    
    if (confidence > 0) {
      scores.push({
        state,
        city,
        score: Math.min(score, 1),
        confidence,
        factors
      });
    }
  });
  
  return scores.sort((a, b) => b.score - a.score);
};

// Alert generation
export const generateAlerts = (riskScores: RiskScore[], anomalies: Anomaly[]): AlertData[] => {
  const alerts: AlertData[] = [];

  console.log('🚨 Alert Generation:', {
    riskScoresCount: riskScores.length,
    anomaliesCount: anomalies.length,
    riskScoreValues: riskScores.map(r => r.score)
  });

  // High-risk locations (original threshold)
  riskScores.filter(score => score.score > 0.6).forEach((score, index) => {
    const severity = score.score > 0.8 ? "critical" : score.score > 0.7 ? "high" : "medium";
    const diseases = ["Dengue", "Malaria", "Diarrhea", "Flu", "Fever", "Cough"];

    alerts.push({
      id: `risk-${index}`,
      type: "outbreak",
      severity,
      disease: diseases[Math.floor(Math.random() * diseases.length)],
      location: `${score.city}, ${score.state}`,
      confidence: Math.round(score.confidence * 100),
      description: `Multi-source correlation indicates potential outbreak. Factors: ${score.factors.join(", ")}`,
      timestamp: new Date(),
      acknowledged: false,
      estimatedDays: Math.ceil(3 + Math.random() * 4)
    });
  });
  
  // Anomaly-based alerts
  anomalies.filter(anomaly => anomaly.severity === "critical" || anomaly.severity === "high").forEach((anomaly, index) => {
    alerts.push({
      id: `anomaly-${index}`,
      type: "anomaly",
      severity: anomaly.severity,
      disease: "Unknown Pattern",
      location: anomaly.location.replace('-', ', '),
      confidence: Math.round(Math.min(Math.abs(anomaly.zscore) * 25, 95)),
      description: `Unusual ${anomaly.type} activity detected. ${anomaly.metric}: ${Math.round(anomaly.value)} (z-score: ${anomaly.zscore.toFixed(1)})`,
      timestamp: new Date(),
      acknowledged: false,
      estimatedDays: Math.ceil(1 + Math.random() * 3)
    });
  });
  
  return alerts.slice(0, 8); // Limit to 8 alerts
};