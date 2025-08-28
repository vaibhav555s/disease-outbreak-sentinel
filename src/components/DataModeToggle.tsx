import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CONFIG } from "@/config";
import { useToast } from "@/hooks/use-toast";

export const DataModeToggle = () => {
  const { toast } = useToast();
  
  const handleToggle = (checked: boolean) => {
    const newMode = checked ? "live" : "simulated";
    localStorage.setItem("dataMode", newMode);
    
    toast({
      title: `Switched to ${newMode} mode`,
      description: "Refreshing page to apply changes...",
    });
    
    // Refresh to apply the change
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor="data-mode" className="text-sm text-muted-foreground">
        Simulated
      </Label>
      <Switch
        id="data-mode"
        checked={CONFIG.dataMode === "live"}
        onCheckedChange={handleToggle}
      />
      <Label htmlFor="data-mode" className="text-sm text-muted-foreground">
        Live
      </Label>
    </div>
  );
};