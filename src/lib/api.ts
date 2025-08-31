/**
 * API Configuration and Utilities for FastAPI Backend Integration
 * Provides centralized API configuration and error handling
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  ENDPOINTS: {
    HEALTH: '/health',
    HOSPITAL: '/api/hospital',
    PHARMACY: '/api/pharmacy',
    TRENDS: '/api/trends',
    SOCIAL: '/api/social',
    UNIFIED: '/api/unified'
  },
  DEFAULT_PARAMS: {
    days: 7,
    data_source: 'synthetic',
    include_outbreak: true
  },
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 second
} as const;

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data: T[];
  metadata: {
    source: 'synthetic' | 'static' | 'live';
    days_requested: number;
    total_records: number;
    data_type: string;
    [key: string]: any;
  };
  timestamp: string;
}

export interface APIError {
  success: false;
  error: string;
  details?: string;
  timestamp: string;
}

// API Utilities
export class APIClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = API_CONFIG.BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Make a GET request with retry logic and error handling
   */
  async get<T = any>(
    endpoint: string, 
    params: Record<string, any> = {},
    options: { timeout?: number; retries?: number } = {}
  ): Promise<APIResponse<T>> {
    const { timeout = API_CONFIG.TIMEOUT, retries = API_CONFIG.RETRY_ATTEMPTS } = options;
    
    // Build URL with parameters
    const url = new URL(endpoint, this.baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 API Request (attempt ${attempt + 1}): ${url.toString()}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        // Handle different response formats
        // Health endpoint returns different format than data endpoints
        if (endpoint === '/health') {
          // Health endpoint returns: { status: "healthy", timestamp: "...", data_sources: {...} }
          if (result.status === 'healthy') {
            return { success: true, data: [result], metadata: {}, timestamp: result.timestamp };
          } else {
            throw new Error('Health check failed');
          }
        }

        // Validate standard API response structure
        if (!result.hasOwnProperty('success')) {
          throw new Error('Invalid API response format');
        }

        if (!result.success) {
          throw new Error(result.error || 'API request failed');
        }
        
        console.log(`✅ API Success: ${result.metadata?.total_records || 0} records`);
        return result as APIResponse<T>;
        
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ API attempt ${attempt + 1} failed:`, error);
        
        // Don't retry on the last attempt
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY * (attempt + 1)));
        }
      }
    }
    
    // All retries failed
    console.error(`❌ API request failed after ${retries + 1} attempts:`, lastError);
    throw lastError || new Error('API request failed');
  }

  /**
   * Test API connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health', {}, { retries: 1, timeout: 5000 });
      return response.success;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Get hospital data
   */
  async getHospitalData(params: {
    days?: number;
    cities?: string[];
    data_source?: 'synthetic' | 'static';
    include_outbreak?: boolean;
  } = {}) {
    const queryParams = {
      days: params.days || API_CONFIG.DEFAULT_PARAMS.days,
      data_source: params.data_source || API_CONFIG.DEFAULT_PARAMS.data_source,
      include_outbreak: params.include_outbreak ?? API_CONFIG.DEFAULT_PARAMS.include_outbreak,
      ...(params.cities && { cities: params.cities.join(',') })
    };
    
    return this.get(API_CONFIG.ENDPOINTS.HOSPITAL, queryParams);
  }

  /**
   * Get pharmacy data
   */
  async getPharmacyData(params: {
    days?: number;
    cities?: string[];
    data_source?: 'synthetic' | 'static';
    include_outbreak?: boolean;
  } = {}) {
    const queryParams = {
      days: params.days || API_CONFIG.DEFAULT_PARAMS.days,
      data_source: params.data_source || API_CONFIG.DEFAULT_PARAMS.data_source,
      include_outbreak: params.include_outbreak ?? API_CONFIG.DEFAULT_PARAMS.include_outbreak,
      ...(params.cities && { cities: params.cities.join(',') })
    };
    
    return this.get(API_CONFIG.ENDPOINTS.PHARMACY, queryParams);
  }

  /**
   * Get trends data
   */
  async getTrendsData(params: {
    days?: number;
    states?: string[];
    data_source?: 'synthetic' | 'static' | 'live';
    keywords?: string[];
  } = {}) {
    const queryParams = {
      days: params.days || API_CONFIG.DEFAULT_PARAMS.days,
      data_source: params.data_source || API_CONFIG.DEFAULT_PARAMS.data_source,
      ...(params.states && { states: params.states.join(',') }),
      ...(params.keywords && { keywords: params.keywords.join(',') })
    };
    
    return this.get(API_CONFIG.ENDPOINTS.TRENDS, queryParams);
  }

  /**
   * Get social media data
   */
  async getSocialData(params: {
    days?: number;
    states?: string[];
    data_source?: 'synthetic' | 'static' | 'live';
    platforms?: string[];
  } = {}) {
    const queryParams = {
      days: params.days || API_CONFIG.DEFAULT_PARAMS.days,
      data_source: params.data_source || API_CONFIG.DEFAULT_PARAMS.data_source,
      ...(params.states && { states: params.states.join(',') }),
      ...(params.platforms && { platforms: params.platforms.join(',') })
    };
    
    return this.get(API_CONFIG.ENDPOINTS.SOCIAL, queryParams);
  }

  /**
   * Get unified multi-source data
   */
  async getUnifiedData(params: {
    days?: number;
    sources?: string[];
    data_source?: 'synthetic' | 'static';
  } = {}) {
    const queryParams = {
      days: params.days || API_CONFIG.DEFAULT_PARAMS.days,
      data_source: params.data_source || API_CONFIG.DEFAULT_PARAMS.data_source,
      sources: params.sources?.join(',') || 'hospital,pharmacy,trends,social'
    };
    
    return this.get(API_CONFIG.ENDPOINTS.UNIFIED, queryParams);
  }
}

// Default API client instance
export const apiClient = new APIClient();

// Utility functions
export const isAPIAvailable = async (): Promise<boolean> => {
  return apiClient.healthCheck();
};

export const getAPIStatus = async () => {
  try {
    const response = await apiClient.get('/health');
    return {
      available: true,
      status: response.data[0], // Health response is wrapped in data array
      timestamp: response.timestamp
    };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
};
