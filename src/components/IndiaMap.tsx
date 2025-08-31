import { useState, useMemo } from "react";
import indiaMapImage from "@/assets/india-map.png";
import { usePharmacyData, useHospitalData, useSearchTrendData, useSocialMentionData } from "@/lib/data";
import { calculateRiskScores } from "@/lib/analytics";
// Removed CONFIG import - using unified mode

interface Hotspot {
  id: string;
  state: string;
  city: string;
  x: number; // percentage from left
  y: number; // percentage from top
  severity: "low" | "medium" | "high" | "critical";
  disease: string;
  confidence: number;
}

// City coordinates lookup for target cities only (approximate positions on India map)
const cityCoordinates: Record<string, { x: number; y: number }> = {
  "Mumbai": { x: 25, y: 55 },
  "Delhi": { x: 35, y: 25 },
  "Pune": { x: 28, y: 58 },
  "Bengaluru": { x: 30, y: 75 },
  "Chennai": { x: 45, y: 80 },
  "Kolkata": { x: 65, y: 45 },
  // Additional cities for more hotspot coverage
  "Hyderabad": { x: 40, y: 70 },
  "Ahmedabad": { x: 20, y: 40 },
  "Jaipur": { x: 30, y: 35 },
  "Lucknow": { x: 50, y: 35 },
  "Kochi": { x: 25, y: 85 },
  "Indore": { x: 25, y: 45 }
};

export const IndiaMap = () => {
  const { data: pharmacyData } = usePharmacyData();
  const { data: hospitalData } = useHospitalData();
  const { data: searchData } = useSearchTrendData();
  const { data: socialData } = useSocialMentionData();
  
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);

  const hotspots = useMemo(() => {
    // Debug logging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('🗺️ IndiaMap Debug:', {
        searchDataLength: searchData?.length || 0,
        socialDataLength: socialData?.length || 0,
        pharmacyDataLength: pharmacyData?.length || 0,
        hospitalDataLength: hospitalData?.length || 0
      });
    }

    // Unified mode: Use all available data sources
    const hasRequiredData = pharmacyData && hospitalData && searchData && socialData;

    if (!hasRequiredData) {
      // Return simulated hotspots for simulated mode using target cities and diseases
      return [
        { id: "1", state: "Delhi", city: "Delhi", x: 35, y: 25, severity: "high" as const, disease: "Dengue", confidence: 85 },
        { id: "2", state: "Maharashtra", city: "Mumbai", x: 25, y: 55, severity: "medium" as const, disease: "Malaria", confidence: 72 },
        { id: "3", state: "Maharashtra", city: "Pune", x: 28, y: 58, severity: "critical" as const, disease: "Dengue", confidence: 94 },
        { id: "4", state: "West Bengal", city: "Kolkata", x: 65, y: 45, severity: "medium" as const, disease: "Diarrhea", confidence: 68 },
        { id: "5", state: "Tamil Nadu", city: "Chennai", x: 45, y: 80, severity: "low" as const, disease: "Flu", confidence: 55 },
        { id: "6", state: "Karnataka", city: "Bengaluru", x: 30, y: 75, severity: "medium" as const, disease: "Fever", confidence: 78 }
      ];
    }

    // Calculate risk scores from real data (unified mode uses all sources)
    const riskScores = calculateRiskScores(
      pharmacyData || [],
      hospitalData || [],
      searchData || [],
      socialData || []
    );

    // Debug logging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 Risk Scores:', riskScores);
    }
    
    // Convert risk scores to hotspots
    // Deduplicate by city and keep highest risk score
    const deduplicatedRisks = riskScores.reduce((acc, risk) => {
      const existing = acc.find(r => r.city === risk.city);
      if (!existing || risk.score > existing.score) {
        acc = acc.filter(r => r.city !== risk.city);
        acc.push(risk);
      }
      return acc;
    }, [] as typeof riskScores);

    return deduplicatedRisks
      .filter(risk => risk.score > 0.15) // Show low severity and above (green hotspots included)
      .map((risk, index) => {
        // Use fixed coordinates for cities, fallback to state center if city not found
        const coords = cityCoordinates[risk.city] ||
                      cityCoordinates[risk.state] ||
                      { x: 50, y: 50 }; // Fixed fallback position
        
        let severity: "low" | "medium" | "high" | "critical";
        if (risk.score >= 0.7) severity = "critical";
        else if (risk.score >= 0.5) severity = "high";
        else if (risk.score >= 0.3) severity = "medium";
        else severity = "low"; // Green hotspots for 0.15-0.3 range

        // Determine primary disease from contributing factors
        const primaryDisease = risk.factors.length > 0 ? 
          risk.factors[0].charAt(0).toUpperCase() + risk.factors[0].slice(1) : 
          "Health Alert";

        return {
          id: `risk-${index}`,
          state: risk.state,
          city: risk.city,
          x: coords.x,
          y: coords.y,
          severity,
          disease: primaryDisease,
          confidence: Math.round(risk.confidence)
        };
      });
  }, [pharmacyData, hospitalData, searchData, socialData]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low": return "bg-health-safe";
      case "medium": return "bg-health-warning";
      case "high": return "bg-health-danger";
      case "critical": return "bg-destructive";
      default: return "bg-health-primary";
    }
  };

  const getSeveritySize = (severity: string) => {
    switch (severity) {
      case "low": return "w-3 h-3"; // Small green dots for low risk
      case "medium": return "w-4 h-4"; // Medium yellow dots
      case "high": return "w-5 h-5"; // Large orange dots
      case "critical": return "w-6 h-6"; // Extra large red dots
      default: return "w-4 h-4";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Disease Outbreak Map</h3>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-health-safe rounded-full"></div>
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-health-warning rounded-full"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-health-danger rounded-full"></div>
            <span>High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-destructive rounded-full"></div>
            <span>Critical</span>
          </div>
        </div>
      </div>
      
      <div className="relative bg-gradient-map rounded-lg p-6 overflow-hidden">
        <div className="relative w-full max-w-md mx-auto">
          <img 
            src={indiaMapImage} 
            alt="India Map" 
            className="w-full h-auto opacity-80 filter brightness-75"
          />
          
          {/* Hotspots */}
          {hotspots.map((hotspot) => (
            <div
              key={hotspot.id}
              className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-health ${
                hotspot.severity === "critical" ? "hotspot-glow" : ""
              }`}
              style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
              onClick={() => setSelectedHotspot(hotspot)}
            >
              <div className={`${getSeverityColor(hotspot.severity)} ${getSeveritySize(hotspot.severity)} rounded-full pulse-health shadow-lg border-2 border-white/50`}>
              </div>
              
              {/* Hotspot label */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-xs text-white font-medium whitespace-nowrap">
                {hotspot.city}
              </div>
            </div>
          ))}
        </div>
        
        {/* Hotspot details panel */}
        {selectedHotspot && (
          <div className="absolute top-4 right-4 bg-card border border-border rounded-lg p-4 w-64 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-card-foreground">{selectedHotspot.city}, {selectedHotspot.state}</h4>
              <button 
                onClick={() => setSelectedHotspot(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Disease:</span>
                <span className="text-card-foreground font-medium">{selectedHotspot.disease}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Severity:</span>
                <span className={`font-medium capitalize ${
                  selectedHotspot.severity === "critical" ? "text-destructive" :
                  selectedHotspot.severity === "high" ? "text-health-danger" :
                  selectedHotspot.severity === "medium" ? "text-health-warning" :
                  "text-health-safe"
                }`}>
                  {selectedHotspot.severity}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Confidence:</span>
                <span className="text-card-foreground font-medium">{Math.round(selectedHotspot.confidence)}%</span>
              </div>
              
              <div className="mt-3">
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-health-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${selectedHotspot.confidence}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Prediction confidence</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};