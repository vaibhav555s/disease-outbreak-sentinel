import { Button } from "@/components/ui/button";
import { CONFIG } from "@/config";
import { useToast } from "@/hooks/use-toast";

export const DataModeToggle = () => {
  const { toast } = useToast();

  const handleModeChange = (newMode: "simulated" | "live" | "mixed") => {
    localStorage.setItem("dataMode", newMode);

    const modeDescriptions = {
      simulated: "All data simulated",
      live: "Only live Trends & Social data",
      mixed: "Sim clinical + live trends (Recommended)"
    };

    toast({
      title: `Switched to ${newMode} mode`,
      description: `${modeDescriptions[newMode]}. Refreshing page...`,
    });

    // Refresh to apply the change
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="flex items-center space-x-1">
      <Button
        variant={CONFIG.dataMode === "simulated" ? "default" : "outline"}
        size="sm"
        onClick={() => handleModeChange("simulated")}
        className="text-xs px-2 py-1"
      >
        Simulated
      </Button>
      <Button
        variant={CONFIG.dataMode === "mixed" ? "default" : "outline"}
        size="sm"
        onClick={() => handleModeChange("mixed")}
        className="text-xs px-2 py-1"
      >
        Mixed
      </Button>
      <Button
        variant={CONFIG.dataMode === "live" ? "default" : "outline"}
        size="sm"
        onClick={() => handleModeChange("live")}
        className="text-xs px-2 py-1"
      >
        Live
      </Button>
    </div>
  );
};