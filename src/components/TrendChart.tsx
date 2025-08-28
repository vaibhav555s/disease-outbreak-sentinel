import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card } from "@/components/ui/card";
import { usePharmacyData, useHospitalData, useSearchTrendData, useSocialMentionData } from "@/lib/data";
import { CONFIG } from "@/config";
import { Skeleton } from "@/components/ui/skeleton";

interface DataPoint {
  date: string;
  pharmacy: number;
  hospital: number;
  searches: number;
  social: number;
}

export const TrendChart = () => {
  const { data: pharmacyData, isLoading: pharmacyLoading } = usePharmacyData();
  const { data: hospitalData, isLoading: hospitalLoading } = useHospitalData();
  const { data: searchData, isLoading: searchLoading } = useSearchTrendData();
  const { data: socialData, isLoading: socialLoading } = useSocialMentionData();

  const isLoading = pharmacyLoading || hospitalLoading || searchLoading || socialLoading;

  const chartData = useMemo(() => {
    if (CONFIG.dataMode === "simulated" || !pharmacyData || !hospitalData || !searchData || !socialData) {
      // Generate simulated data for simulated mode or when no data is available
      const today = new Date();
      const simulatedData: DataPoint[] = [];
      
      for (let i = 14; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const baseValue = Math.sin(i * 0.3) * 20 + 50 + Math.random() * 10;
        
        simulatedData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          pharmacy: Math.max(0, baseValue + Math.random() * 20),
          hospital: Math.max(0, baseValue * 0.8 + Math.random() * 15),
          searches: Math.max(0, baseValue * 1.2 + Math.random() * 25),
          social: Math.max(0, baseValue * 0.6 + Math.random() * 30)
        });
      }
      
      return simulatedData;
    }

    // Process real data
    const processedData: DataPoint[] = [];
    const dates = new Set([
      ...pharmacyData.map(d => d.date),
      ...hospitalData.map(d => d.date),
    ]);

    Array.from(dates).sort().slice(-15).forEach(date => {
      const pharmacySum = pharmacyData
        .filter(d => d.date === date)
        .reduce((sum, item) => sum + item.total_sales, 0);
      
      const hospitalSum = hospitalData
        .filter(d => d.date === date)
        .reduce((sum, item) => sum + item.total_cases, 0) / 10; // Scale down for better visualization
      
      const searchSum = searchData
        .filter(d => d.date === date)
        .reduce((sum, item) => sum + item.fever + item.dengue + item.malaria + item.cough + item.covid, 0);
      
      const socialSum = socialData
        .filter(d => d.date === date)
        .reduce((sum, item) => sum + item.health_mentions, 0);

      processedData.push({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        pharmacy: pharmacySum,
        hospital: hospitalSum,
        searches: searchSum,
        social: socialSum
      });
    });

    return processedData;
  }, [pharmacyData, hospitalData, searchData, socialData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-card">
          <p className="text-card-foreground font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {Math.round(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="p-6 bg-card border-border shadow-card">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-card-foreground mb-2">Multi-Source Health Signals</h3>
          <p className="text-sm text-muted-foreground">Real-time correlation analysis across data sources</p>
        </div>
        <Skeleton className="w-full h-[300px]" />
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card border-border shadow-card">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-card-foreground mb-2">Multi-Source Health Signals</h3>
        <p className="text-sm text-muted-foreground">
          {CONFIG.dataMode === "simulated" ? "Simulated" : "Real-time"} correlation analysis across data sources
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="pharmacy" 
            stroke="hsl(var(--health-primary))" 
            strokeWidth={2}
            dot={{ fill: "hsl(var(--health-primary))", strokeWidth: 2, r: 4 }}
            name="Pharmacy Sales"
          />
          <Line 
            type="monotone" 
            dataKey="hospital" 
            stroke="hsl(var(--health-secondary))" 
            strokeWidth={2}
            dot={{ fill: "hsl(var(--health-secondary))", strokeWidth: 2, r: 4 }}
            name="Hospital Visits"
          />
          <Line 
            type="monotone" 
            dataKey="searches" 
            stroke="hsl(var(--health-warning))" 
            strokeWidth={2}
            dot={{ fill: "hsl(var(--health-warning))", strokeWidth: 2, r: 4 }}
            name="Google Searches"
          />
          <Line 
            type="monotone" 
            dataKey="social" 
            stroke="hsl(var(--health-danger))" 
            strokeWidth={2}
            dot={{ fill: "hsl(var(--health-danger))", strokeWidth: 2, r: 4 }}
            name="Social Media"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};