import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, Search, Brain, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

interface Agent {
  id: number;
  name: string;
  status: "active" | "processing" | "idle" | "alert";
  icon: React.ReactNode;
  description: string;
  lastUpdate: string;
  progress?: number;
}

export const AgentStatus = () => {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: 1,
      name: "Data Collector",
      status: "active",
      icon: <Database className="w-4 h-4" />,
      description: "Fetching pharmacy sales & hospital records",
      lastUpdate: "2 min ago",
      progress: 85
    },
    {
      id: 2,
      name: "Data Cleaner",
      status: "processing",
      icon: <Activity className="w-4 h-4" />,
      description: "Normalizing time-series data streams",
      lastUpdate: "1 min ago",
      progress: 65
    },
    {
      id: 3,
      name: "Trend Detector",
      status: "alert",
      icon: <Search className="w-4 h-4" />,
      description: "Anomaly detected: Fever medicine spike in Delhi",
      lastUpdate: "30 sec ago"
    },
    {
      id: 4,
      name: "Predictor",
      status: "processing",
      icon: <Brain className="w-4 h-4" />,
      description: "Running LSTM model for outbreak forecasting",
      lastUpdate: "1 min ago",
      progress: 40
    },
    {
      id: 5,
      name: "Alert Generator",
      status: "active",
      icon: <AlertTriangle className="w-4 h-4" />,
      description: "Generating early warning signals",
      lastUpdate: "45 sec ago"
    }
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prev => prev.map(agent => ({
        ...agent,
        lastUpdate: Math.random() > 0.7 ? "Just now" : agent.lastUpdate,
        progress: agent.progress ? Math.min(100, agent.progress + Math.random() * 10) : undefined
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-health-safe";
      case "processing": return "bg-health-primary";
      case "alert": return "bg-health-danger";
      default: return "bg-muted";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "Active";
      case "processing": return "Processing";
      case "alert": return "Alert";
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