import { IntegratedDashboard } from "@/components/IntegratedDashboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap, Database, TrendingUp, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Data Integration Page
 * Showcases the integrated dashboard with real-time multi-source data merging
 */
const DataIntegration = () => {
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
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Data Integration Hub</h1>
                  <p className="text-sm text-muted-foreground">
                    Real-time multi-source health data with intelligent merging
                  </p>
                </div>
              </div>
            </div>
            
            {/* Feature Highlights */}
            <div className="hidden md:flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Database className="w-4 h-4" />
                <span>Clinical Data</span>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4" />
                <span>Google Trends</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageSquare className="w-4 h-4" />
                <span>Social Media</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Introduction Section */}
        <div className="mb-8">
          <div className="max-w-4xl">
            <h2 className="text-2xl font-bold mb-4">
              Advanced Multi-Source Health Data Integration
            </h2>
            <p className="text-muted-foreground mb-6">
              This integrated dashboard demonstrates advanced data fusion capabilities, combining 
              simulated clinical data with live Google Trends and social media streams. The system 
              automatically merges, deduplicates, and weights data from multiple sources to provide 
              a unified view of health surveillance signals.
            </p>
            
            {/* Key Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="w-5 h-5 text-health-primary" />
                  <h3 className="font-medium">Real-time Merging</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Intelligent data fusion with automatic deduplication and weighted averaging 
                  across multiple health data sources.
                </p>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Database className="w-5 h-5 text-health-secondary" />
                  <h3 className="font-medium">Multi-Mode Support</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Switch between Simulated, Live, and Mixed modes with configurable 
                  source weights and refresh intervals.
                </p>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-health-warning" />
                  <h3 className="font-medium">Live Data Streams</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Connect to live Google Trends and social media APIs for real-time 
                  health signal detection and outbreak monitoring.
                </p>
              </div>
            </div>

            {/* Technical Details */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium mb-2">Technical Implementation</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• <strong>Data Standardization:</strong> All sources transformed to unified schema with timestamp, location, disease, source, and normalized value (0-100)</p>
                <p>• <strong>Deduplication:</strong> Automatic merging of duplicate records based on timestamp + location + disease keys</p>
                <p>• <strong>Weighted Merging:</strong> Configurable source weights (Hospital: 35%, Pharmacy: 40%, Trends: 15%, Social: 10%)</p>
                <p>• <strong>Real-time Updates:</strong> Configurable refresh intervals per source with automatic error handling and fallbacks</p>
              </div>
            </div>
          </div>
        </div>

        {/* Integrated Dashboard */}
        <IntegratedDashboard />
      </main>
    </div>
  );
};

export default DataIntegration;
