import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Database, 
  TrendingUp, 
  MessageSquare,
  Activity,
  MapPin,
  Calendar,
  MoreVertical
} from "lucide-react";
import { HealthDataPoint, MergedDataResult } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface DataPreviewTableProps {
  /** Merged data result from the data stream manager */
  mergedData: MergedDataResult | null;
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: string | null;
  /** Callback for refreshing data */
  onRefresh?: () => void;
  /** Maximum number of rows to display */
  maxRows?: number;
  /** Enable real-time updates */
  realTimeUpdates?: boolean;
}

export const DataPreviewTable = ({
  mergedData,
  isLoading = false,
  error = null,
  onRefresh,
  maxRows = 100,
  realTimeUpdates = true
}: DataPreviewTableProps) => {
  const { toast } = useToast();
  
  // State for filtering and searching
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [diseaseFilter, setDiseaseFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<keyof HealthDataPoint>("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // Auto-refresh effect for real-time updates
  useEffect(() => {
    if (realTimeUpdates && onRefresh) {
      const interval = setInterval(() => {
        onRefresh();
      }, 10000); // Refresh every 10 seconds
      
      return () => clearInterval(interval);
    }
  }, [realTimeUpdates, onRefresh]);

  /**
   * Get unique values for filter dropdowns
   */
  const filterOptions = useMemo(() => {
    if (!mergedData?.data) return { sources: [], diseases: [], locations: [] };
    
    const sources = [...new Set(mergedData.data.map(d => d.source))];
    const diseases = [...new Set(mergedData.data.map(d => d.disease))];
    const locations = [...new Set(mergedData.data.map(d => d.location))];
    
    return { sources, diseases, locations };
  }, [mergedData]);

  /**
   * Filter and sort data based on current filters
   */
  const filteredAndSortedData = useMemo(() => {
    if (!mergedData?.data) return [];
    
    let filtered = mergedData.data;
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.location.toLowerCase().includes(term) ||
        item.disease.toLowerCase().includes(term) ||
        item.source.toLowerCase().includes(term)
      );
    }
    
    // Apply source filter
    if (sourceFilter !== "all") {
      filtered = filtered.filter(item => item.source === sourceFilter);
    }
    
    // Apply disease filter
    if (diseaseFilter !== "all") {
      filtered = filtered.filter(item => item.disease === diseaseFilter);
    }
    
    // Apply location filter
    if (locationFilter !== "all") {
      filtered = filtered.filter(item => item.location === locationFilter);
    }
    
    // Sort data
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      // Handle different data types
      if (sortBy === "timestamp") {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      } else if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }
      
      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    // Limit rows
    return filtered.slice(0, maxRows);
  }, [mergedData, searchTerm, sourceFilter, diseaseFilter, locationFilter, sortBy, sortOrder, maxRows]);

  /**
   * Get icon for data source
   */
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'hospital':
      case 'pharmacy':
        return <Database className="w-4 h-4" />;
      case 'trends':
        return <TrendingUp className="w-4 h-4" />;
      case 'social':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  /**
   * Get color for data source badge
   */
  const getSourceColor = (source: string) => {
    switch (source) {
      case 'hospital':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pharmacy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'trends':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'social':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  /**
   * Export data to CSV
   */
  const exportToCSV = () => {
    if (!filteredAndSortedData.length) {
      toast({
        title: "No data to export",
        description: "Please ensure there is data available to export",
        variant: "destructive"
      });
      return;
    }
    
    const headers = ['Timestamp', 'Location', 'Disease', 'Source', 'Value', 'Metadata'];
    const csvContent = [
      headers.join(','),
      ...filteredAndSortedData.map(row => [
        row.timestamp,
        row.location,
        row.disease,
        row.source,
        row.value,
        JSON.stringify(row.metadata || {})
      ].map(field => `"${field}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `health_data_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Data exported",
      description: `Exported ${filteredAndSortedData.length} records to CSV`
    });
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setSearchTerm("");
    setSourceFilter("all");
    setDiseaseFilter("all");
    setLocationFilter("all");
  };

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <Activity className="w-8 h-8 mx-auto mb-2" />
          <h3 className="font-medium">Error Loading Data</h3>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline" size="sm" className="mt-3">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-health-primary" />
            Real-time Data Stream
          </h3>
          <p className="text-sm text-muted-foreground">
            {mergedData ? (
              <>
                Showing {filteredAndSortedData.length} of {mergedData.totalRecords} records
                {mergedData.duplicatesRemoved > 0 && (
                  <span className="ml-2">
                    ({mergedData.duplicatesRemoved} duplicates merged)
                  </span>
                )}
              </>
            ) : (
              "Loading data stream..."
            )}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {realTimeUpdates && (
            <Badge variant="outline" className="text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
              Live
            </Badge>
          )}
          
          <Button onClick={exportToCSV} variant="outline" size="sm" disabled={!filteredAndSortedData.length}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline" size="sm" disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search locations, diseases, sources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
        
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {filterOptions.sources.map(source => (
              <SelectItem key={source} value={source}>
                <div className="flex items-center space-x-2">
                  {getSourceIcon(source)}
                  <span className="capitalize">{source}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={diseaseFilter} onValueChange={setDiseaseFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Disease" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Diseases</SelectItem>
            {filterOptions.diseases.map(disease => (
              <SelectItem key={disease} value={disease}>
                <span className="capitalize">{disease.replace('_', ' ')}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {filterOptions.locations.map(location => (
              <SelectItem key={location} value={location}>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3 h-3" />
                  <span>{location}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button onClick={clearFilters} variant="ghost" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          Clear
        </Button>
      </div>

      {/* Data Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  setSortBy("timestamp");
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                }}
              >
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Time</span>
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  setSortBy("location");
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                }}
              >
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>Location</span>
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  setSortBy("disease");
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                }}
              >
                Disease
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  setSortBy("source");
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                }}
              >
                Source
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 text-right"
                onClick={() => {
                  setSortBy("value");
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                }}
              >
                Value
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading data stream...</p>
                </TableCell>
              </TableRow>
            ) : filteredAndSortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Activity className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No data available</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedData.map((row, index) => {
                const { date, time } = formatTimestamp(row.timestamp);
                
                return (
                  <TableRow key={`${row.timestamp}-${row.location}-${row.disease}-${index}`}>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{date}</div>
                        <div className="text-muted-foreground">{time}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span>{row.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">{row.disease.replace('_', ' ')}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getSourceColor(row.source)} text-xs`}>
                        <div className="flex items-center space-x-1">
                          {getSourceIcon(row.source)}
                          <span className="capitalize">{row.source}</span>
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-mono">
                        {row.value.toFixed(2)}
                        {row.metadata?.unit && (
                          <span className="text-xs text-muted-foreground ml-1">
                            {row.metadata.unit}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="p-1">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Data Point Details</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <div className="text-xs">
                              <div><strong>Raw Value:</strong> {row.metadata?.rawValue || 'N/A'}</div>
                              <div><strong>Confidence:</strong> {row.metadata?.confidence || 'N/A'}</div>
                              {row.metadata?.mergedFrom && (
                                <div><strong>Merged from:</strong> {row.metadata.mergedFrom.join(', ')}</div>
                              )}
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer with last update info */}
      {mergedData && (
        <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
          <div>
            Last updated: {new Date(mergedData.mergedAt).toLocaleString()}
          </div>
          <div>
            {mergedData.sources.filter(s => s.isConnected).length} of {mergedData.sources.length} sources connected
          </div>
        </div>
      )}
    </Card>
  );
};
