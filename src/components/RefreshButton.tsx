import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface RefreshButtonProps {
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({ 
  className = "", 
  size = "default",
  variant = "outline"
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      // Invalidate all data queries to trigger fresh fetches
      await queryClient.invalidateQueries({ queryKey: ['hospital-data'] });
      await queryClient.invalidateQueries({ queryKey: ['pharmacy-data'] });
      await queryClient.invalidateQueries({ queryKey: ['search-data'] });
      await queryClient.invalidateQueries({ queryKey: ['social-data'] });
      
      console.log('🔄 Manual refresh triggered - fetching fresh data...');
      
      // Wait a moment for queries to complete
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1500);
      
    } catch (error) {
      console.error('❌ Refresh failed:', error);
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      onClick={handleRefresh}
      disabled={isRefreshing}
      variant={variant}
      size={size}
      className={`${className} ${isRefreshing ? 'animate-pulse' : ''}`}
    >
      <RefreshCw 
        className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} 
      />
      {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
    </Button>
  );
};

export default RefreshButton;
