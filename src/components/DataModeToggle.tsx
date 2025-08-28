import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings, Info, Zap, Database, TrendingUp, MessageSquare } from "lucide-react";
import { CONFIG } from "@/config";
import { useToast } from "@/hooks/use-toast";
import { DashboardMode, DataSourceConfig } from "@/lib/types";

interface DataModeToggleProps {
  currentMode: DashboardMode;
  onModeChange: (mode: DashboardMode) => void;
  streamStatus?: Array<{ source: string; isConnected: boolean; totalRecords: number }>;
}

export const DataModeToggle = ({
  currentMode,
  onModeChange,
  streamStatus = []
}: DataModeToggleProps) => {
  const { toast } = useToast();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tempMode, setTempMode] = useState<DashboardMode>(currentMode);

  // Update temp mode when current mode changes
  useEffect(() => {
    setTempMode(currentMode);
  }, [currentMode]);

  /**
   * Handles basic mode switching (simulated/live/mixed)
   */
  const handleBasicModeChange = (newMode: "simulated" | "live" | "mixed") => {
    const updatedMode: DashboardMode = {
      mode: newMode,
      sources: getDefaultSourceConfig(newMode)
    };

    setTempMode(updatedMode);
    onModeChange(updatedMode);

    const modeDescriptions = {
      simulated: "All data simulated with realistic patterns",
      live: "Live Google Trends & Social Media data only",
      mixed: "Simulated clinical + Live trends/social (Recommended)"
    };

    toast({
      title: `Switched to ${newMode} mode`,
      description: modeDescriptions[newMode],
    });
  };

  /**
   * Gets default source configuration for each mode
   */
  const getDefaultSourceConfig = (mode: "simulated" | "live" | "mixed"): DashboardMode['sources'] => {
    const baseConfig = {
      hospital: { enabled: false, weight: 0.35, refreshInterval: 30000 },
      pharmacy: { enabled: false, weight: 0.40, refreshInterval: 30000 },
      trends: { enabled: false, weight: 0.15, refreshInterval: 60000 },
      social: { enabled: false, weight: 0.10, refreshInterval: 45000 }
    };

    switch (mode) {
      case 'simulated':
        return {
          ...baseConfig,
          hospital: { ...baseConfig.hospital, enabled: true },
          pharmacy: { ...baseConfig.pharmacy, enabled: true },
          trends: { ...baseConfig.trends, enabled: true },
          social: { ...baseConfig.social, enabled: true }
        };
      case 'live':
        return {
          ...baseConfig,
          trends: { ...baseConfig.trends, enabled: true },
          social: { ...baseConfig.social, enabled: true }
        };
      case 'mixed':
        return {
          hospital: { ...baseConfig.hospital, enabled: true },
          pharmacy: { ...baseConfig.pharmacy, enabled: true },
          trends: { ...baseConfig.trends, enabled: true },
          social: { ...baseConfig.social, enabled: true }
        };
      default:
        return baseConfig;
    }
  };

  /**
   * Handles advanced source configuration changes
   */
  const handleSourceConfigChange = (
    source: keyof DashboardMode['sources'],
    config: Partial<DataSourceConfig>
  ) => {
    const updatedMode = {
      ...tempMode,
      sources: {
        ...tempMode.sources,
        [source]: { ...tempMode.sources[source], ...config }
      }
    };

    setTempMode(updatedMode);
  };

  /**
   * Applies advanced configuration changes
   */
  const applyAdvancedChanges = () => {
    onModeChange(tempMode);
    setShowAdvanced(false);

    toast({
      title: "Configuration updated",
      description: "Advanced data source settings have been applied",
    });
  };

  /**
   * Gets status indicator for a data source
   */
  const getSourceStatus = (source: string) => {
    const status = streamStatus.find(s => s.source === source);
    if (!status) return { color: "gray", text: "Unknown" };

    if (status.isConnected && status.totalRecords > 0) {
      return { color: "green", text: `${status.totalRecords} records` };
    } else if (status.isConnected) {
      return { color: "yellow", text: "Connected" };
    } else {
      return { color: "red", text: "Disconnected" };
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Basic Mode Toggle */}
      <div className="flex items-center space-x-1">
        <Button
          variant={currentMode.mode === "simulated" ? "default" : "outline"}
          size="sm"
          onClick={() => handleBasicModeChange("simulated")}
          className="text-xs px-2 py-1"
        >
          <Database className="w-3 h-3 mr-1" />
          Simulated
        </Button>
        <Button
          variant={currentMode.mode === "mixed" ? "default" : "outline"}
          size="sm"
          onClick={() => handleBasicModeChange("mixed")}
          className="text-xs px-2 py-1"
        >
          <Zap className="w-3 h-3 mr-1" />
          Mixed
        </Button>
        <Button
          variant={currentMode.mode === "live" ? "default" : "outline"}
          size="sm"
          onClick={() => handleBasicModeChange("live")}
          className="text-xs px-2 py-1"
        >
          <TrendingUp className="w-3 h-3 mr-1" />
          Live
        </Button>
      </div>

      {/* Advanced Settings */}
      <Popover open={showAdvanced} onOpenChange={setShowAdvanced}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="p-1">
            <Settings className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Advanced Data Source Configuration</h4>
              <Badge variant="outline" className="text-xs">
                {tempMode.mode.toUpperCase()}
              </Badge>
            </div>

            {/* Source Configuration */}
            <div className="space-y-3">
              {Object.entries(tempMode.sources).map(([source, config]) => {
                const status = getSourceStatus(source);
                const icons = {
                  hospital: <Database className="w-4 h-4" />,
                  pharmacy: <Database className="w-4 h-4" />,
                  trends: <TrendingUp className="w-4 h-4" />,
                  social: <MessageSquare className="w-4 h-4" />
                };

                return (
                  <Card key={source} className="p-3">
                    <div className="space-y-2">
                      {/* Source Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {icons[source as keyof typeof icons]}
                          <span className="font-medium capitalize">{source}</span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              status.color === 'green' ? 'border-green-500 text-green-700' :
                              status.color === 'yellow' ? 'border-yellow-500 text-yellow-700' :
                              status.color === 'red' ? 'border-red-500 text-red-700' :
                              'border-gray-500 text-gray-700'
                            }`}
                          >
                            {status.text}
                          </Badge>
                        </div>
                        <Switch
                          checked={config.enabled}
                          onCheckedChange={(enabled) =>
                            handleSourceConfigChange(source as any, { enabled })
                          }
                        />
                      </div>

                      {/* Weight Configuration */}
                      {config.enabled && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">Weight: {Math.round(config.weight * 100)}%</Label>
                          </div>
                          <Slider
                            value={[config.weight * 100]}
                            onValueChange={([value]) =>
                              handleSourceConfigChange(source as any, { weight: value / 100 })
                            }
                            max={100}
                            step={5}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Weight Summary */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Info className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Weight Distribution</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Total weight: {Math.round(
                  Object.values(tempMode.sources)
                    .filter(s => s.enabled)
                    .reduce((sum, s) => sum + s.weight, 0) * 100
                )}%
              </div>
            </div>

            {/* Apply Button */}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={applyAdvancedChanges}>
                Apply Changes
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};