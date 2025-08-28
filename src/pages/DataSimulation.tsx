import { DataSimulationPanel } from "@/components/DataSimulationPanel";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Database, FileText, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const DataSimulation = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-health rounded-lg">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Data Simulation Lab</h1>
                  <p className="text-sm text-muted-foreground">Generate synthetic datasets for testing and development</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Data Generator Panel */}
          <div className="lg:col-span-2">
            <DataSimulationPanel />
          </div>
          
          {/* Information Panel */}
          <div className="space-y-6">
            
            {/* Dataset Overview */}
            <div className="bg-card border border-border rounded-lg p-6 shadow-card">
              <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-health-primary" />
                Dataset Overview
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">Hospital Data Structure</h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div><code>date</code> - Visit date (YYYY-MM-DD)</div>
                    <div><code>patient_id</code> - Unique patient identifier</div>
                    <div><code>symptoms</code> - Semicolon-separated symptoms</div>
                    <div><code>diagnosis</code> - Primary diagnosis</div>
                    <div><code>age</code> - Patient age (5-75)</div>
                    <div><code>gender</code> - Male/Female</div>
                    <div><code>city</code> - Target city</div>
                    <div><code>state</code> - Corresponding state</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-2">Pharmacy Data Structure</h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div><code>date</code> - Sale date (YYYY-MM-DD)</div>
                    <div><code>medicine_name</code> - Specific medicine</div>
                    <div><code>category</code> - Medicine category</div>
                    <div><code>quantity_sold</code> - Units sold</div>
                    <div><code>city</code> - Target city</div>
                    <div><code>state</code> - Corresponding state</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Disease Patterns */}
            <div className="bg-card border border-border rounded-lg p-6 shadow-card">
              <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-health-secondary" />
                Disease Patterns
              </h3>
              
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Fever</span>
                  <span className="text-muted-foreground">30% base rate</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Cough</span>
                  <span className="text-muted-foreground">25% base rate</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Flu</span>
                  <span className="text-muted-foreground">20% base rate</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Diarrhea</span>
                  <span className="text-muted-foreground">15% base rate</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Malaria</span>
                  <span className="text-muted-foreground">8% base rate</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Dengue</span>
                  <span className="text-muted-foreground">5% base rate</span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-health-warning/10 rounded-lg">
                <div className="text-xs text-muted-foreground">
                  <strong>Outbreak Simulation:</strong> Days 10-15 show 2-8x increase in disease rates with realistic correlation between hospital visits and pharmacy sales.
                </div>
              </div>
            </div>

            {/* Usage Tips */}
            <div className="bg-card border border-border rounded-lg p-6 shadow-card">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Usage Tips</h3>
              
              <div className="space-y-3 text-xs text-muted-foreground">
                <div>
                  <strong>Anomaly Detection:</strong> Use the outbreak period (days 10-15) to test your anomaly detection algorithms.
                </div>
                <div>
                  <strong>Correlation Analysis:</strong> Hospital and pharmacy data are correlated - spikes in hospital visits should correspond to increased medicine sales.
                </div>
                <div>
                  <strong>Seasonal Patterns:</strong> Data includes realistic seasonal variations for different diseases.
                </div>
                <div>
                  <strong>Demographics:</strong> Age and gender distributions follow realistic patterns for each disease type.
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default DataSimulation;
