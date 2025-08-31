import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Server, 
  Wifi, 
  WifiOff,
  Clock
} from "lucide-react";
import { getAPIStatus, API_CONFIG } from "@/lib/api";

interface APIStatusProps {
  /** Show detailed status in popover */
  showDetails?: boolean;
  /** Compact mode for header display */
  compact?: boolean;
}

export const APIStatus = ({ showDetails = true, compact = false }: APIStatusProps) => {
  const [status, setStatus] = useState<{
    available: boolean;
    error?: string;
    timestamp: string;
    status?: any;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  /**
   * Check API status
   */
  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const result = await getAPIStatus();
      setStatus(result);
    } catch (error) {
      setStatus({
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Check status on mount and periodically
  useEffect(() => {
    checkStatus();
    
    // Check every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Get status indicator
   */
  const getStatusIndicator = () => {
    if (isChecking) {
      return {
        icon: <RefreshCw className="w-4 h-4 animate-spin" />,
        color: "bg-blue-100 text-blue-800 border-blue-200",
        text: "Checking..."
      };
    }
    
    if (!status) {
      return {
        icon: <Clock className="w-4 h-4" />,
        color: "bg-gray-100 text-gray-800 border-gray-200",
        text: "Unknown"
      };
    }
    
    if (status.available) {
      return {
        icon: <CheckCircle className="w-4 h-4" />,
        color: "bg-green-100 text-green-800 border-green-200",
        text: "API Connected"
      };
    } else {
      return {
        icon: <AlertTriangle className="w-4 h-4" />,
        color: "bg-red-100 text-red-800 border-red-200",
        text: "API Offline"
      };
    }
  };

  const indicator = getStatusIndicator();

  if (compact) {
    return (
      <Badge className={`${indicator.color} text-xs flex items-center gap-1`}>
        {status?.available ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
        <span>{status?.available ? "API" : "Local"}</span>
      </Badge>
    );
  }

  if (!showDetails) {
    return (
      <Badge className={`${indicator.color} text-xs flex items-center gap-1`}>
        {indicator.icon}
        <span>{indicator.text}</span>
      </Badge>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="p-1">
          <Badge className={`${indicator.color} text-xs flex items-center gap-1 cursor-pointer`}>
            {indicator.icon}
            <span>{indicator.text}</span>
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <Server className="w-4 h-4" />
              API Backend Status
            </h4>
            <Button onClick={checkStatus} variant="outline" size="sm" disabled={isChecking}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Connection Status */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Connection:</span>
              <Badge className={indicator.color}>
                {indicator.icon}
                <span className="ml-1">{status?.available ? "Connected" : "Disconnected"}</span>
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Backend URL:</span>
              <span className="text-xs font-mono">{API_CONFIG.BASE_URL}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Last Check:</span>
              <span className="text-xs">
                {status?.timestamp ? new Date(status.timestamp).toLocaleTimeString() : 'Never'}
              </span>
            </div>
          </div>

          {/* Error Details */}
          {status?.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <h5 className="text-sm font-medium text-red-800 mb-1">Connection Error</h5>
              <p className="text-xs text-red-600">{status.error}</p>
            </div>
          )}

          {/* API Endpoints */}
          {status?.available && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <h5 className="text-sm font-medium text-green-800 mb-2">Available Endpoints</h5>
              <div className="space-y-1 text-xs text-green-700">
                <div>✓ /api/hospital - Hospital OPD data</div>
                <div>✓ /api/pharmacy - Pharmacy sales data</div>
                <div>✓ /api/trends - Google Trends data</div>
                <div>✓ /api/social - Social media data</div>
                <div>✓ /api/unified - Multi-source data</div>
              </div>
            </div>
          )}

          {/* Fallback Mode */}
          {!status?.available && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h5 className="text-sm font-medium text-yellow-800 mb-1">Fallback Mode</h5>
              <p className="text-xs text-yellow-700">
                Using local data generation. Start the FastAPI backend to enable real API endpoints.
              </p>
              <div className="mt-2 text-xs text-yellow-600">
                <code>cd backend && python start_dev.py</code>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
