import { CONFIG } from "@/config";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle } from "lucide-react";

/**
 * Configuration Test Component
 * Displays current configuration status for debugging
 */
export const ConfigTest = () => {
  const configStatus = {
    available: !!CONFIG,
    dataMode: CONFIG?.dataMode || "unknown",
    targetCities: CONFIG?.targetCities?.length || 0,
    polling: !!CONFIG?.polling
  };

  return (
    <Card className="p-4 m-4">
      <h3 className="font-medium mb-3 flex items-center gap-2">
        {configStatus.available ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-red-500" />
        )}
        Configuration Status
      </h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Config Available:</span>
          <Badge variant={configStatus.available ? "default" : "destructive"}>
            {configStatus.available ? "Yes" : "No"}
          </Badge>
        </div>
        
        <div className="flex justify-between">
          <span>Data Mode:</span>
          <Badge variant="outline">{configStatus.dataMode}</Badge>
        </div>
        
        <div className="flex justify-between">
          <span>Target Cities:</span>
          <span>{configStatus.targetCities}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Polling Config:</span>
          <Badge variant={configStatus.polling ? "default" : "secondary"}>
            {configStatus.polling ? "Available" : "Missing"}
          </Badge>
        </div>
      </div>
      
      {CONFIG && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium">Raw Config</summary>
          <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto">
            {JSON.stringify(CONFIG, null, 2)}
          </pre>
        </details>
      )}
    </Card>
  );
};
