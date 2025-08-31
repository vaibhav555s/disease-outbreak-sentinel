import { AgentStatus } from "@/components/AgentStatus";
import { IndiaMap } from "@/components/IndiaMap";
import { TrendChart } from "@/components/TrendChart";
import { AlertSystem } from "@/components/AlertSystem";
// Removed mode toggle - using single unified mode
import { APIStatus } from "@/components/APIStatus";
import { RefreshButton } from "@/components/RefreshButton";
import { Activity, Brain, MapPin, TrendingUp, Settings } from "lucide-react";
import { CONFIG } from "@/config";
// Removed Badge and Button imports - no longer needed
// Removed Link import - no longer needed

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-health rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Agentic AI Health Monitor</h1>
                <p className="text-sm text-muted-foreground">Real-time Disease Outbreak Prediction Platform</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <APIStatus compact={true} />
                  <RefreshButton size="sm" variant="ghost" />
                </div>
                {/* Removed mode toggle - using single unified mode */}
              </div>
              
              <div className="flex items-center gap-2">
                <div className="pulse-health">
                  <div className="w-2 h-2 bg-health-safe rounded-full"></div>
                </div>
                <span className="text-muted-foreground">System Active</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-health-primary" />
                <span className="text-muted-foreground">5 Agents Running</span>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-health-warning" />
                <span className="text-muted-foreground">3 Active Alerts</span>
              </div>

              {/* Removed Data Lab and Integration Hub buttons - using single unified mode */}
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Column - Agent Status */}
          <div className="lg:col-span-1">
            <AgentStatus />
          </div>
          
          {/* Center Column - Map and Chart */}
          <div className="lg:col-span-2 space-y-6">
            {/* India Map */}
            <IndiaMap />
            
            {/* Trend Chart */}
            <TrendChart />
          </div>
          
          {/* Right Column - Alerts */}
          <div className="lg:col-span-1">
            <AlertSystem />
          </div>
        </div>
        
        {/* Bottom Stats Row */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4 text-center shadow-card">
            <div className="text-2xl font-bold text-health-primary mb-1">127</div>
            <div className="text-sm text-muted-foreground">Data Sources</div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4 text-center shadow-card">
            <div className="text-2xl font-bold text-health-secondary mb-1">94%</div>
            <div className="text-sm text-muted-foreground">Prediction Accuracy</div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4 text-center shadow-card">
            <div className="text-2xl font-bold text-health-warning mb-1">2.3</div>
            <div className="text-sm text-muted-foreground">Avg Alert Lead Time (days)</div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4 text-center shadow-card">
            <div className="text-2xl font-bold text-health-danger mb-1">15</div>
            <div className="text-sm text-muted-foreground">Outbreaks Prevented</div>
          </div>
        </div>
        
        {/* Data Sources Transparency */}
        <div className="mt-8 bg-card border border-border rounded-lg p-6 shadow-card">
          <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-health-primary" />
            Data Source Attribution
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm font-medium text-card-foreground mb-1">Pharmacy Sales</div>
              <div className="text-xs text-muted-foreground">Real-time medication purchase data</div>
              <div className="mt-2 text-health-primary font-medium">38% weight</div>
            </div>
            
            <div className="text-center">
              <div className="text-sm font-medium text-card-foreground mb-1">Hospital Records</div>
              <div className="text-xs text-muted-foreground">OPD visits and symptoms</div>
              <div className="mt-2 text-health-secondary font-medium">29% weight</div>
            </div>
            
            <div className="text-center">
              <div className="text-sm font-medium text-card-foreground mb-1">Google Trends</div>
              <div className="text-xs text-muted-foreground">Health-related search patterns</div>
              <div className="mt-2 text-health-warning font-medium">20% weight</div>
            </div>
            
            <div className="text-center">
              <div className="text-sm font-medium text-card-foreground mb-1">Social Media</div>
              <div className="text-xs text-muted-foreground">Twitter/Reddit health mentions</div>
              <div className="mt-2 text-health-danger font-medium">13% weight</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;