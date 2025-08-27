import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card } from "@/components/ui/card";

interface DataPoint {
  date: string;
  pharmacy: number;
  hospital: number;
  searches: number;
  social: number;
}

export const TrendChart = () => {
  const [data, setData] = useState<DataPoint[]>([]);

  // Generate initial data
  useEffect(() => {
    const generateData = () => {
      const today = new Date();
      const newData: DataPoint[] = [];
      
      for (let i = 14; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Simulate trending data with some correlation
        const baseValue = Math.sin(i * 0.3) * 20 + 50 + Math.random() * 10;
        
        newData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          pharmacy: Math.max(0, baseValue + Math.random() * 20),
          hospital: Math.max(0, baseValue * 0.8 + Math.random() * 15),
          searches: Math.max(0, baseValue * 1.2 + Math.random() * 25),
          social: Math.max(0, baseValue * 0.6 + Math.random() * 30)
        });
      }
      
      setData(newData);
    };

    generateData();
  }, []);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const newData = [...prev];
        const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        // Update the last data point or add new one
        const lastPoint = newData[newData.length - 1];
        if (lastPoint.date === today) {
          // Update existing point
          lastPoint.pharmacy += (Math.random() - 0.5) * 10;
          lastPoint.hospital += (Math.random() - 0.5) * 8;
          lastPoint.searches += (Math.random() - 0.5) * 12;
          lastPoint.social += (Math.random() - 0.5) * 15;
        } else {
          // Add new point and remove oldest
          const baseValue = lastPoint.pharmacy + (Math.random() - 0.5) * 20;
          newData.shift();
          newData.push({
            date: today,
            pharmacy: Math.max(0, baseValue),
            hospital: Math.max(0, baseValue * 0.8 + Math.random() * 15),
            searches: Math.max(0, baseValue * 1.2 + Math.random() * 25),
            social: Math.max(0, baseValue * 0.6 + Math.random() * 30)
          });
        }
        
        return newData;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

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

  return (
    <Card className="p-6 bg-card border-border shadow-card">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-card-foreground mb-2">Multi-Source Health Signals</h3>
        <p className="text-sm text-muted-foreground">Real-time correlation analysis across data sources</p>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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