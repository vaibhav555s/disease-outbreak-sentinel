import { useEffect, useState } from "react";
import indiaMapImage from "@/assets/india-map.png";

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

export const IndiaMap = () => {
  const [hotspots, setHotspots] = useState<Hotspot[]>([
    {
      id: "1",
      state: "Delhi",
      city: "New Delhi",
      x: 35,
      y: 25,
      severity: "high",
      disease: "Dengue",
      confidence: 85
    },
    {
      id: "2",
      state: "Maharashtra",
      city: "Mumbai",
      x: 25,
      y: 55,
      severity: "medium",
      disease: "Malaria",
      confidence: 72
    },
    {
      id: "3",
      state: "Maharashtra",
      city: "Pune",
      x: 28,
      y: 58,
      severity: "critical",
      disease: "Dengue",
      confidence: 94
    },
    {
      id: "4",
      state: "West Bengal",
      city: "Kolkata",
      x: 65,
      y: 45,
      severity: "medium",
      disease: "Chikungunya",
      confidence: 68
    },
    {
      id: "5",
      state: "Tamil Nadu",
      city: "Chennai",
      x: 45,
      y: 80,
      severity: "low",
      disease: "Viral Fever",
      confidence: 55
    }
  ]);

  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setHotspots(prev => prev.map(hotspot => ({
        ...hotspot,
        confidence: Math.max(30, Math.min(100, hotspot.confidence + (Math.random() - 0.5) * 10))
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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
      case "low": return "w-3 h-3";
      case "medium": return "w-4 h-4";
      case "high": return "w-5 h-5";
      case "critical": return "w-6 h-6";
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