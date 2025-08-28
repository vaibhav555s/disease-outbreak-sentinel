import { Button } from "@/components/ui/button";
import { CONFIG } from "@/config";
import { useToast } from "@/hooks/use-toast";

/**
 * Simple Data Mode Toggle Component
 * Backward-compatible version for the main dashboard
 * Provides basic mode switching without advanced configuration
 */
export const SimpleDataModeToggle = () => {
  const { toast } = useToast();

  const handleModeChange = (newMode: "simulated" | "live" | "mixed") => {
    try {
      localStorage.setItem("dataMode", newMode);
    } catch (error) {
      console.warn('Failed to save mode to localStorage:', error);
    }
    
    const modeDescriptions = {
      simulated: "All data simulated with realistic patterns",
      live: "Live Google Trends & Social Media data only",
      mixed: "Simulated clinical + Live trends/social (Recommended)"
    };
    
    toast({
      title: `Switched to ${newMode} mode`,
      description: modeDescriptions[newMode],
    });
    
    // Refresh to apply the change
    setTimeout(() => window.location.reload(), 1000);
  };

  // Get current mode with fallback
  const currentMode = CONFIG?.dataMode || "mixed";

  return (
    <div className="flex items-center space-x-1">
      <Button
        variant={currentMode === "simulated" ? "default" : "outline"}
        size="sm"
        onClick={() => handleModeChange("simulated")}
        className="text-xs px-2 py-1"
      >
        Simulated
      </Button>
      <Button
        variant={currentMode === "mixed" ? "default" : "outline"}
        size="sm"
        onClick={() => handleModeChange("mixed")}
        className="text-xs px-2 py-1"
      >
        Mixed
      </Button>
      <Button
        variant={currentMode === "live" ? "default" : "outline"}
        size="sm"
        onClick={() => handleModeChange("live")}
        className="text-xs px-2 py-1"
      >
        Live
      </Button>
    </div>
  );
};
