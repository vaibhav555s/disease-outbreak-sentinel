import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, MapPin, Clock, CheckCircle } from "lucide-react";
import { usePharmacyData, useHospitalData, useSearchTrendData, useSocialMentionData } from "@/lib/data";
import { generateAlerts, calculateRiskScores, detectPharmacyAnomalies, detectHospitalAnomalies } from "@/lib/analytics";
import { CONFIG } from "@/config";

interface Alert {
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

export const AlertSystem = () => {
  const { data: pharmacyData } = usePharmacyData();
  const { data: hospitalData } = useHospitalData();
  const { data: searchData } = useSearchTrendData();
  const { data: socialData } = useSocialMentionData();
  
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set());

  // Generate alerts from real data
  const generatedAlerts = useMemo(() => {
    if (CONFIG.dataMode === "simulated" || !pharmacyData || !hospitalData || !searchData || !socialData) {
      // Return static alerts for simulated mode
      return [
        {
          id: "sim-1",
          type: "outbreak" as const,
          severity: "critical" as const,
          disease: "Dengue",
          location: "Pune, Maharashtra",
          confidence: 94,
          description: "Dengue outbreak predicted based on pharmacy sales spike (fever medicines +35%), increased hospital OPD visits, and rising Google searches for 'dengue symptoms'",
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          acknowledged: false,
          estimatedDays: 3
        },
        {
          id: "sim-2",
          type: "anomaly" as const,
          severity: "high" as const,
          disease: "Fever Pattern",
          location: "Delhi NCR",
          confidence: 85,
          description: "Unusual spike in fever medication sales detected. 20% increase from baseline over the past 3 days",
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          acknowledged: false,
          estimatedDays: 2
        },
        {
          id: "sim-3",
          type: "correlation" as const,
          severity: "medium" as const,
          disease: "Viral Fever",
          location: "Chennai, Tamil Nadu",
          confidence: 72,
          description: "Correlation detected between social media mentions and hospital visit patterns",
          timestamp: new Date(Date.now() - 45 * 60 * 1000),
          acknowledged: true,
          estimatedDays: 5
        }
      ];
    }

    // Generate alerts from real data
    const riskScores = calculateRiskScores(pharmacyData, hospitalData, searchData, socialData);
    const pharmacyAnomalies = detectPharmacyAnomalies(pharmacyData);
    const hospitalAnomalies = detectHospitalAnomalies(hospitalData);
    
    return generateAlerts(riskScores, [...pharmacyAnomalies, ...hospitalAnomalies]);
  }, [pharmacyData, hospitalData, searchData, socialData]);

  // Apply acknowledgment state
  const alerts = generatedAlerts.map(alert => ({
    ...alert,
    acknowledged: acknowledgedAlerts.has(alert.id)
  }));

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low": return "text-health-safe border-health-safe bg-health-safe/10";
      case "medium": return "text-health-warning border-health-warning bg-health-warning/10";
      case "high": return "text-health-danger border-health-danger bg-health-danger/10";
      case "critical": return "text-destructive border-destructive bg-destructive/10";
      default: return "text-muted-foreground border-border bg-muted/10";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "outbreak": return <AlertTriangle className="w-4 h-4" />;
      case "anomaly": return <TrendingUp className="w-4 h-4" />;
      case "trend": return <Clock className="w-4 h-4" />;
      case "correlation": return <MapPin className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const acknowledgeAlert = (id: string) => {
    setAcknowledgedAlerts(prev => new Set([...prev, id]));
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Early Warning Alerts</h3>
        <div className="flex items-center gap-2">
          <div className="pulse-health">
            <div className="w-2 h-2 bg-health-danger rounded-full"></div>
          </div>
          <span className="text-sm text-muted-foreground">
            {CONFIG.dataMode === "simulated" ? "Simulated" : "Live"} monitoring
          </span>
        </div>
      </div>
      
      <div className="space-y-3">
        {alerts.map((alert) => (
          <Card 
            key={alert.id} 
            className={`p-4 transition-health ${
              alert.acknowledged ? "opacity-60" : "shadow-card"
            } ${alert.severity === "critical" && !alert.acknowledged ? "border-destructive" : "border-border"}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-full ${getSeverityColor(alert.severity)}`}>
                  {getTypeIcon(alert.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-card-foreground">{alert.disease} - {alert.location}</h4>
                </div>
              </div>
              
              {alert.acknowledged ? (
                <CheckCircle className="w-5 h-5 text-health-safe" />
              ) : (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="text-xs"
                >
                  Acknowledge
                </Button>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">{alert.description}</p>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{alert.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>ETA: {alert.estimatedDays} days</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span>Confidence: {alert.confidence}%</span>
                <span>•</span>
                <span>{formatTimeAgo(alert.timestamp)}</span>
              </div>
            </div>
            
            <div className="mt-2">
              <div className="w-full bg-secondary rounded-full h-1">
                <div 
                  className={`h-1 rounded-full transition-all duration-300 ${
                    alert.confidence > 80 ? "bg-health-danger" :
                    alert.confidence > 60 ? "bg-health-warning" : "bg-health-safe"
                  }`}
                  style={{ width: `${alert.confidence}%` }}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};