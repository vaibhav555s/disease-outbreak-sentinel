import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Activity, 
  Database, 
  TrendingUp, 
  MessageSquare, 
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from "lucide-react";
import { DashboardMode, DataSourceConfig } from "@/lib/types";
import { useDataStreamManager } from "@/hooks/useDataStreamManager";
import { DataModeToggle } from "./DataModeToggle";
import { DataPreviewTable } from "./DataPreviewTable";
import { CONFIG } from "@/config";

/**
 * Integrated Dashboard Component
 * Manages the complete data flow from multiple sources with real-time merging
 * Supports Simulated, Live, and Mixed modes with advanced configuration
 */
export const IntegratedDashboard = () => {
  // Dashboard mode state with default configuration
  const [dashboardMode, setDashboardMode] = useState<DashboardMode>({
    mode: CONFIG.dataMode as 'simulated' | 'live' | 'mixed',
    sources: {
      hospital: { 
        enabled: true, 
        weight: 0.35, 
        refreshInterval: 30000,
        endpoint: '/api/hospital' 
      },
      pharmacy: { 
        enabled: true, 
        weight: 0.40, 
        refreshInterval: 30000,
        endpoint: '/api/pharmacy' 
      },
      trends: { 
        enabled: true, 
        weight: 0.15, 
        refreshInterval: 60000,
        endpoint: '/api/trends' 
      },
      social: { 
        enabled: true, 
        weight: 0.10, 
        refreshInterval: 45000,
        endpoint: '/api/social' 
      }
    }
  });

  // Use the data stream manager hook
  const {
    mergedData,
    isLoading,
    error,
    refreshData,
    filterData,
    statistics,
    streamStatus,
    lastUpdated,
    dataCount
  } = useDataStreamManager(dashboardMode);

  /**
   * Handle mode changes from the toggle component
   */
  const handleModeChange = (newMode: DashboardMode) => {
    setDashboardMode(newMode);
  };

  /**
   * Get overall system health status
   */
  const systemHealth = useMemo(() => {
    if (!streamStatus.length) return { status: 'unknown', message: 'No data sources configured' };
    
    const connectedSources = streamStatus.filter(s => s.isConnected).length;
    const totalSources = streamStatus.length;
    const healthPercentage = (connectedSources / totalSources) * 100;
    
    if (healthPercentage === 100) {
      return { status: 'healthy', message: 'All data sources connected' };
    } else if (healthPercentage >= 50) {
      return { status: 'warning', message: `${connectedSources}/${totalSources} sources connected` };
    } else {
      return { status: 'error', message: `Only ${connectedSources}/${totalSources} sources connected` };
    }
  }, [streamStatus]);

  /**
   * Get source-specific statistics
   */
  const sourceStats = useMemo(() => {
    if (!mergedData) return {};
    
    const stats: Record<string, { count: number; percentage: number; avgValue: number }> = {};
    
    mergedData.data.forEach(point => {
      if (!stats[point.source]) {
        stats[point.source] = { count: 0, percentage: 0, avgValue: 0 };
      }
      stats[point.source].count++;
      stats[point.source].avgValue += point.value;
    });
    
    // Calculate percentages and averages
    Object.keys(stats).forEach(source => {
      stats[source].percentage = (stats[source].count / mergedData.totalRecords) * 100;
      stats[source].avgValue = stats[source].avgValue / stats[source].count;
    });
    
    return stats;
  }, [mergedData]);

  /**
   * Get icon for system health status
   */
  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  /**
   * Get icon for data source
   */
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'hospital':
      case 'pharmacy':
        return <Database className="w-4 h-4" />;
      case 'trends':
        return <TrendingUp className="w-4 h-4" />;
      case 'social':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Mode Toggle and System Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="w-6 h-6 text-health-primary" />
              Integrated Health Data Dashboard
            </h2>
            <p className="text-muted-foreground">
              Real-time multi-source health surveillance with intelligent data merging
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* System Health Indicator */}
            <div className="flex items-center space-x-2">
              {getHealthIcon(systemHealth.status)}
              <span className="text-sm font-medium">{systemHealth.message}</span>
            </div>
            
            {/* Mode Toggle */}
            <DataModeToggle 
              currentMode={dashboardMode}
              onModeChange={handleModeChange}
              streamStatus={streamStatus}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold">{dataCount.toLocaleString()}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-health-primary" />
            </div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Sources</p>
                <p className="text-2xl font-bold">
                  {streamStatus.filter(s => s.isConnected).length}/{streamStatus.length}
                </p>
              </div>
              <Database className="w-8 h-8 text-health-secondary" />
            </div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Duplicates Merged</p>
                <p className="text-2xl font-bold">{mergedData?.duplicatesRemoved || 0}</p>
              </div>
              <Zap className="w-8 h-8 text-health-warning" />
            </div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm font-medium">
                  {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Never'}
                </p>
              </div>
              <Clock className="w-8 h-8 text-health-danger" />
            </div>
          </div>
        </div>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="data-stream" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="data-stream">Data Stream</TabsTrigger>
          <TabsTrigger value="source-status">Source Status</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Data Stream Tab */}
        <TabsContent value="data-stream">
          <DataPreviewTable
            mergedData={mergedData}
            isLoading={isLoading}
            error={error}
            onRefresh={refreshData}
            maxRows={100}
            realTimeUpdates={true}
          />
        </TabsContent>

        {/* Source Status Tab */}
        <TabsContent value="source-status">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(dashboardMode.sources).map(([sourceName, config]) => {
              const status = streamStatus.find(s => s.source === sourceName);
              const stats = sourceStats[sourceName];
              
              return (
                <Card key={sourceName} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getSourceIcon(sourceName)}
                      <h3 className="font-medium capitalize">{sourceName}</h3>
                    </div>
                    <Badge 
                      variant={config.enabled ? (status?.isConnected ? "default" : "destructive") : "secondary"}
                      className="text-xs"
                    >
                      {!config.enabled ? 'Disabled' : status?.isConnected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Weight:</span>
                      <span>{Math.round(config.weight * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Records:</span>
                      <span>{status?.totalRecords || 0}</span>
                    </div>
                    {stats && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Contribution:</span>
                          <span>{stats.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Avg Value:</span>
                          <span>{stats.avgValue.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Update:</span>
                      <span>
                        {status?.lastUpdate 
                          ? new Date(status.lastUpdate).toLocaleTimeString()
                          : 'Never'
                        }
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Data Distribution */}
            <Card className="p-4">
              <h3 className="font-medium mb-3">Data Distribution by Source</h3>
              <div className="space-y-2">
                {Object.entries(sourceStats).map(([source, stats]) => (
                  <div key={source} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getSourceIcon(source)}
                      <span className="capitalize">{source}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{stats.count}</div>
                      <div className="text-xs text-muted-foreground">
                        {stats.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* System Performance */}
            <Card className="p-4">
              <h3 className="font-medium mb-3">System Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mode:</span>
                  <Badge variant="outline" className="capitalize">
                    {dashboardMode.mode}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Enabled Sources:</span>
                  <span>
                    {Object.values(dashboardMode.sources).filter(s => s.enabled).length}/
                    {Object.keys(dashboardMode.sources).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data Quality:</span>
                  <span>
                    {mergedData ? 
                      `${((mergedData.totalRecords - mergedData.duplicatesRemoved) / mergedData.totalRecords * 100).toFixed(1)}%`
                      : 'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Refresh Rate:</span>
                  <span>10s</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
