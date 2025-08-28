import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, Search, Brain, AlertTriangle, TrendingUp } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { usePharmacyData, useHospitalData, useSearchTrendData, useSocialMentionData } from "@/lib/data";
import { CONFIG } from "@/config";

interface Agent {
  id: number;
  name: string;
  status: "active" | "processing" | "idle" | "alert" | "error";
  icon: React.ReactNode;
  description: string;
  lastUpdate: string;
  progress?: number;
}

export const AgentStatus = () => {
  const { isLoading: pharmacyLoading, error: pharmacyError } = usePharmacyData();
  const { isLoading: hospitalLoading, error: hospitalError } = useHospitalData();
  const { isLoading: searchLoading, error: searchError } = useSearchTrendData();
  const { isLoading: socialLoading, error: socialError } = useSocialMentionData();

  const [agentProgress, setAgentProgress] = useState({
    collector: 75,
    normalizer: 85,
    detector: 60,
    predictor: 40,
    alerter: 90
  });

  // Track last update times for each agent
  const lastUpdateTimes = useRef({
    collector: Date.now() - 30000, // 30 seconds ago
    normalizer: Date.now() - 45000, // 45 seconds ago  
    detector: Date.now() - 20000,   // 20 seconds ago
    predictor: Date.now() - 60000,  // 1 minute ago
    alerter: Date.now() - 15000     // 15 seconds ago
  });

  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update agent progress and timestamps
  useEffect(() => {
    const updateProgress = () => {
      const now = Date.now();
      
      setAgentProgress(prev => {
        const currentMode = CONFIG?.dataMode || "mixed";
        const newProgress = {
          collector: currentMode === "simulated" ?
            Math.min(100, prev.collector + Math.random() * 3) :
            currentMode === "live" ?
            (!searchLoading && !socialLoading) ? 100 : Math.min(95, prev.collector + Math.random() * 5) :
            // Mixed mode
            (!searchLoading && !socialLoading) ? 100 : Math.min(95, prev.collector + Math.random() * 5),
          normalizer: Math.min(100, prev.normalizer + Math.random() * 2),
          detector: Math.min(100, prev.detector + Math.random() * 2.5),
          predictor: Math.min(100, prev.predictor + Math.random() * 1.5),
          alerter: Math.min(100, prev.alerter + Math.random() * 3)
        };

        // Update last update times when progress changes significantly
        Object.keys(newProgress).forEach(key => {
          const agentKey = key as keyof typeof newProgress;
          if (Math.abs(newProgress[agentKey] - prev[agentKey]) > 1) {
            lastUpdateTimes.current[agentKey] = now;
          }
        });

        return newProgress;
      });
      
      setCurrentTime(now);
    };

    const interval = setInterval(updateProgress, 2000);
    return () => clearInterval(interval);
  }, [pharmacyLoading, hospitalLoading, searchLoading, socialLoading]);

  // Update current time every 30 seconds for "time ago" updates
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);
    return () => clearInterval(timeInterval);
  }, []);

  const formatTimeAgo = (timestamp: number) => {
    const diffInMinutes = Math.floor((currentTime - timestamp) / (1000 * 60));
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}min ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const agents: Agent[] = [
    {
      id: 1,
      name: "Data Collector",
      status: (pharmacyError || hospitalError || searchError || socialError) ? "error" :
        (pharmacyLoading || hospitalLoading || searchLoading || socialLoading) ? "processing" : "active",
      icon: <Database className="w-4 h-4" />,
      description: (CONFIG?.dataMode || "mixed") === "simulated" ?
        "Generating simulated data streams" :
        (CONFIG?.dataMode || "mixed") === "live" ?
        "Fetching live trends & social signals only" :
        "Mixed: Simulated clinical + live trends/social",
      lastUpdate: formatTimeAgo(lastUpdateTimes.current.collector),
      progress: agentProgress.collector
    },
    {
      id: 2,
      name: "Cleaner & Normalizer",
      status: "processing",
      icon: <Activity className="w-4 h-4" />,
      description: "Standardizing time-series data and removing outliers",
      lastUpdate: formatTimeAgo(lastUpdateTimes.current.normalizer),
      progress: agentProgress.normalizer
    },
    {
      id: 3,
      name: "Trend Detector",
      status: agentProgress.detector > 90 ? "alert" : "processing",
      icon: <TrendingUp className="w-4 h-4" />,
      description: agentProgress.detector > 90 ? 
        "Anomaly detected: Unusual patterns in Mumbai & Delhi" :
        "Analyzing statistical patterns and anomalies",
      lastUpdate: formatTimeAgo(lastUpdateTimes.current.detector)
    },
    {
      id: 4,
      name: "Predictor",
      status: "processing",
      icon: <Brain className="w-4 h-4" />,
      description: "Running baseline ML forecasts and risk correlation",
      lastUpdate: formatTimeAgo(lastUpdateTimes.current.predictor),
      progress: agentProgress.predictor
    },
    {
      id: 5,
      name: "Alert Generator",
      status: "active",
      icon: <AlertTriangle className="w-4 h-4" />,
      description: "Producing early warning signals with confidence scores",
      lastUpdate: formatTimeAgo(lastUpdateTimes.current.alerter),
      progress: agentProgress.alerter
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-health-safe";
      case "processing": return "bg-health-primary";
      case "alert": return "bg-health-danger";
      case "error": return "bg-destructive";
      default: return "bg-muted";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "Active";
      case "processing": return "Processing";
      case "alert": return "Alert";
      case "error": return "Error";
      default: return "Idle";
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">AI Agent Status</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-3">
        {agents.map((agent) => (
          <Card key={agent.id} className="p-4 bg-card border-border shadow-card transition-health hover:shadow-health">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-full ${getStatusColor(agent.status)} text-white`}>
                  {agent.icon}
                </div>
                <div>
                  <h4 className="font-medium text-card-foreground">{agent.name}</h4>
                  <Badge 
                    variant={agent.status === "alert" ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {getStatusText(agent.status)}
                  </Badge>
                </div>
              </div>
              {agent.status === "active" && (
                <div className="pulse-health">
                  <div className="w-2 h-2 bg-health-safe rounded-full"></div>
                </div>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">{agent.description}</p>
            
            {agent.progress && (
              <div className="mb-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{Math.round(agent.progress)}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-1.5">
                  <div 
                    className="bg-health-primary h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${agent.progress}%` }}
                  />
                </div>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">Last update: {agent.lastUpdate}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};