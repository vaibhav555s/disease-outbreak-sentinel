import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, Database, Calendar, MapPin, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  generateCityDataset, 
  generateAllCitiesDataset,
  convertToCSV,
  SyntheticHospitalRecord,
  SyntheticPharmacyRecord
} from "@/lib/dataSimulator";

const TARGET_CITIES = ["Mumbai", "Delhi", "Pune", "Bengaluru", "Chennai", "Kolkata"];

export const DataSimulationPanel = () => {
  const { toast } = useToast();
  const [selectedCity, setSelectedCity] = useState<string>("Mumbai");
  const [days, setDays] = useState<number>(30);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [lastGenerated, setLastGenerated] = useState<{
    city: string;
    days: number;
    hospitalRecords: number;
    pharmacyRecords: number;
    timestamp: Date;
  } | null>(null);

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateSingleCityData = async () => {
    setIsGenerating(true);
    
    try {
      // Simulate processing time for realistic feel
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const dataset = generateCityDataset(selectedCity, days);
      
      // Download hospital data
      downloadCSV(
        dataset.hospitalCSV, 
        `hospital_data_${selectedCity.toLowerCase()}_${days}days.csv`
      );
      
      // Download pharmacy data  
      downloadCSV(
        dataset.pharmacyCSV,
        `pharmacy_data_${selectedCity.toLowerCase()}_${days}days.csv`
      );
      
      setLastGenerated({
        city: selectedCity,
        days,
        hospitalRecords: dataset.hospital.length,
        pharmacyRecords: dataset.pharmacy.length,
        timestamp: new Date()
      });
      
      toast({
        title: "Data Generated Successfully!",
        description: `Generated ${dataset.hospital.length} hospital records and ${dataset.pharmacy.length} pharmacy records for ${selectedCity}`,
      });
      
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "There was an error generating the synthetic data.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAllCitiesData = async () => {
    setIsGenerating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const allDatasets = generateAllCitiesDataset(days);
      let totalHospital = 0;
      let totalPharmacy = 0;
      
      // Download data for each city
      Object.entries(allDatasets).forEach(([city, dataset]) => {
        downloadCSV(
          dataset.hospitalCSV,
          `hospital_data_${city.toLowerCase()}_${days}days.csv`
        );
        downloadCSV(
          dataset.pharmacyCSV,
          `pharmacy_data_${city.toLowerCase()}_${days}days.csv`
        );
        
        totalHospital += dataset.hospital.length;
        totalPharmacy += dataset.pharmacy.length;
      });
      
      setLastGenerated({
        city: "All Cities",
        days,
        hospitalRecords: totalHospital,
        pharmacyRecords: totalPharmacy,
        timestamp: new Date()
      });
      
      toast({
        title: "All Cities Data Generated!",
        description: `Generated data for all ${TARGET_CITIES.length} cities with outbreak patterns`,
      });
      
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "There was an error generating the synthetic data.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="p-6 bg-card border-border shadow-card">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-2 flex items-center gap-2">
          <Database className="w-5 h-5 text-health-primary" />
          Synthetic Data Generator
        </h3>
        <p className="text-sm text-muted-foreground">
          Generate realistic hospital and pharmacy datasets with outbreak patterns for testing and demo purposes.
        </p>
      </div>

      <div className="space-y-4">
        {/* Configuration Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city-select">Target City</Label>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger>
                <SelectValue placeholder="Select a city" />
              </SelectTrigger>
              <SelectContent>
                {TARGET_CITIES.map(city => (
                  <SelectItem key={city} value={city}>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {city}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="days-input">Number of Days</Label>
            <Input
              id="days-input"
              type="number"
              min="7"
              max="90"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value) || 30)}
              className="w-full"
            />
          </div>
        </div>

        {/* Data Specifications */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Dataset Specifications
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <strong>Hospital Data:</strong>
              <ul className="mt-1 space-y-1">
                <li>• 50-150 daily visits (base)</li>
                <li>• Outbreak spike on days 10-15</li>
                <li>• 6 disease categories</li>
                <li>• Patient demographics</li>
              </ul>
            </div>
            <div>
              <strong>Pharmacy Data:</strong>
              <ul className="mt-1 space-y-1">
                <li>• 200-600 daily sales (base)</li>
                <li>• Correlated with hospital patterns</li>
                <li>• Disease-specific medicines</li>
                <li>• Seasonal variations</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Generation Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={generateSingleCityData}
            disabled={isGenerating}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            {isGenerating ? "Generating..." : `Generate ${selectedCity} Data`}
          </Button>
          
          <Button 
            onClick={generateAllCitiesData}
            disabled={isGenerating}
            variant="outline"
            className="flex-1"
          >
            <Database className="w-4 h-4 mr-2" />
            {isGenerating ? "Generating..." : "Generate All Cities"}
          </Button>
        </div>

        {/* Last Generation Info */}
        {lastGenerated && (
          <div className="bg-health-safe/10 border border-health-safe/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                Last Generated
              </Badge>
              <span className="text-xs text-muted-foreground">
                {lastGenerated.timestamp.toLocaleString()}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-card-foreground">{lastGenerated.city}</div>
                <div className="text-xs text-muted-foreground">Location</div>
              </div>
              <div>
                <div className="font-medium text-card-foreground">{lastGenerated.days} days</div>
                <div className="text-xs text-muted-foreground">Duration</div>
              </div>
              <div>
                <div className="font-medium text-health-primary">{lastGenerated.hospitalRecords}</div>
                <div className="text-xs text-muted-foreground">Hospital Records</div>
              </div>
              <div>
                <div className="font-medium text-health-secondary">{lastGenerated.pharmacyRecords}</div>
                <div className="text-xs text-muted-foreground">Pharmacy Records</div>
              </div>
            </div>
          </div>
        )}

        {/* Usage Instructions */}
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
          <strong>Usage:</strong> Generated CSV files will be automatically downloaded. 
          Hospital data includes patient_id, symptoms, diagnosis, age, gender. 
          Pharmacy data includes medicine_name, category, quantity_sold. 
          Outbreak patterns are built into days 10-15 for realistic anomaly detection testing.
        </div>
      </div>
    </Card>
  );
};
