#!/usr/bin/env python3
"""
Google Trends Data Collector for Disease Surveillance
Fetches real-time trends for disease-related keywords in India
"""

import pandas as pd
import numpy as np
from pytrends.request import TrendReq
from datetime import datetime, timedelta
import time
import json
import os
import logging
from typing import List, Dict, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('trends_collector.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class GoogleTrendsCollector:
    """Collects Google Trends data for disease surveillance"""
    
    def __init__(self, geo='IN', timeout=(10, 25), retries=3):
        """
        Initialize the Google Trends collector
        
        Args:
            geo (str): Geographic location code (IN for India)
            timeout (tuple): Request timeout (connect, read)
            retries (int): Number of retry attempts
        """
        self.geo = geo
        self.timeout = timeout
        self.retries = retries
        self.pytrends = None
        self._initialize_pytrends()
        
    def _initialize_pytrends(self):
        """Initialize pytrends with error handling"""
        try:
            self.pytrends = TrendReq(
                hl='en-US', 
                tz=330,  # India timezone offset
                timeout=self.timeout,
                retries=self.retries,
                backoff_factor=0.1
            )
            logger.info("Google Trends API initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Google Trends API: {e}")
            raise
    
    def fetch_trends_data(self, keywords: List[str], days: int = 30) -> pd.DataFrame:
        """
        Fetch Google Trends data for specified keywords
        
        Args:
            keywords (List[str]): List of keywords to search
            days (int): Number of days to fetch data for
            
        Returns:
            pd.DataFrame: Trends data with columns [date, keyword, search_index]
        """
        logger.info(f"Fetching trends data for keywords: {keywords}")
        logger.info(f"Date range: Last {days} days")
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        timeframe = f"{start_date.strftime('%Y-%m-%d')} {end_date.strftime('%Y-%m-%d')}"
        
        all_data = []
        
        # Process keywords in batches (Google Trends API limit is 5 keywords per request)
        batch_size = 5
        for i in range(0, len(keywords), batch_size):
            batch_keywords = keywords[i:i + batch_size]
            logger.info(f"Processing batch: {batch_keywords}")
            
            try:
                # Build payload
                self.pytrends.build_payload(
                    batch_keywords,
                    cat=0,  # All categories
                    timeframe=timeframe,
                    geo=self.geo,
                    gprop=''  # Web search
                )
                
                # Get interest over time
                interest_data = self.pytrends.interest_over_time()
                
                if not interest_data.empty:
                    # Remove 'isPartial' column if it exists
                    if 'isPartial' in interest_data.columns:
                        interest_data = interest_data.drop('isPartial', axis=1)
                    
                    # Reshape data to long format
                    interest_data_reset = interest_data.reset_index()
                    melted_data = pd.melt(
                        interest_data_reset,
                        id_vars=['date'],
                        var_name='keyword',
                        value_name='search_index'
                    )
                    
                    all_data.append(melted_data)
                    logger.info(f"Successfully fetched data for batch: {batch_keywords}")
                else:
                    logger.warning(f"No data returned for batch: {batch_keywords}")
                
                # Rate limiting - wait between requests
                time.sleep(2)
                
            except Exception as e:
                logger.error(f"Error fetching data for batch {batch_keywords}: {e}")
                # Try to reinitialize pytrends on error
                self._initialize_pytrends()
                time.sleep(5)
                continue
        
        if not all_data:
            logger.error("No data was successfully fetched")
            return pd.DataFrame(columns=['date', 'keyword', 'search_index'])
        
        # Combine all batches
        combined_data = pd.concat(all_data, ignore_index=True)
        
        # Normalize search index to 0-100 range
        combined_data['search_index'] = self._normalize_search_index(combined_data['search_index'])
        
        # Sort by date and keyword
        combined_data = combined_data.sort_values(['date', 'keyword']).reset_index(drop=True)
        
        logger.info(f"Successfully collected {len(combined_data)} data points")
        return combined_data
    
    def _normalize_search_index(self, search_index: pd.Series) -> pd.Series:
        """
        Normalize search index values to 0-100 range
        
        Args:
            search_index (pd.Series): Raw search index values
            
        Returns:
            pd.Series: Normalized search index values
        """
        if search_index.empty:
            return search_index
        
        # Google Trends already provides 0-100 scale, but ensure consistency
        min_val = search_index.min()
        max_val = search_index.max()
        
        if max_val == min_val:
            return pd.Series([50] * len(search_index))  # Default to middle value
        
        # Normalize to 0-100 range
        normalized = ((search_index - min_val) / (max_val - min_val)) * 100
        return normalized.round(2)
    
    def get_related_queries(self, keyword: str) -> Dict:
        """
        Get related queries for a specific keyword
        
        Args:
            keyword (str): Keyword to get related queries for
            
        Returns:
            Dict: Related queries data
        """
        try:
            self.pytrends.build_payload([keyword], geo=self.geo)
            related_queries = self.pytrends.related_queries()
            return related_queries.get(keyword, {})
        except Exception as e:
            logger.error(f"Error fetching related queries for '{keyword}': {e}")
            return {}
    
    def save_to_csv(self, data: pd.DataFrame, filename: str = None) -> str:
        """
        Save trends data to CSV file
        
        Args:
            data (pd.DataFrame): Trends data to save
            filename (str): Optional filename, auto-generated if None
            
        Returns:
            str: Path to saved file
        """
        if filename is None:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'google_trends_data_{timestamp}.csv'
        
        # Ensure output directory exists
        os.makedirs('output', exist_ok=True)
        filepath = os.path.join('output', filename)
        
        data.to_csv(filepath, index=False)
        logger.info(f"Data saved to: {filepath}")
        return filepath
    
    def save_to_json(self, data: pd.DataFrame, filename: str = None) -> str:
        """
        Save trends data to JSON file
        
        Args:
            data (pd.DataFrame): Trends data to save
            filename (str): Optional filename, auto-generated if None
            
        Returns:
            str: Path to saved file
        """
        if filename is None:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'google_trends_data_{timestamp}.json'
        
        # Ensure output directory exists
        os.makedirs('output', exist_ok=True)
        filepath = os.path.join('output', filename)
        
        # Convert datetime to string for JSON serialization
        data_copy = data.copy()
        data_copy['date'] = data_copy['date'].dt.strftime('%Y-%m-%d')
        
        data_copy.to_json(filepath, orient='records', indent=2)
        logger.info(f"Data saved to: {filepath}")
        return filepath

def main():
    """Main execution function"""
    # Disease-related keywords for surveillance
    DISEASE_KEYWORDS = [
        'diarrhea',
        'cholera', 
        'typhoid',
        'fever',
        'dengue',
        'malaria',
        'loose motion',
        'stomach pain',
        'vomiting',
        'dehydration'
    ]
    
    # Indian state-specific keywords (Hindi/local terms)
    INDIAN_KEYWORDS = [
        'दस्त',  # Diarrhea in Hindi
        'बुखार',  # Fever in Hindi
        'पेट दर्द',  # Stomach pain in Hindi
        'उल्टी'  # Vomiting in Hindi
    ]
    
    # Combine all keywords
    ALL_KEYWORDS = DISEASE_KEYWORDS + INDIAN_KEYWORDS
    
    try:
        # Initialize collector
        collector = GoogleTrendsCollector()
        
        # Fetch trends data for last 30 days
        trends_data = collector.fetch_trends_data(ALL_KEYWORDS, days=30)
        
        if not trends_data.empty:
            # Save to both CSV and JSON
            csv_path = collector.save_to_csv(trends_data)
            json_path = collector.save_to_json(trends_data)
            
            # Display summary
            print("\n" + "="*50)
            print("GOOGLE TRENDS DATA COLLECTION SUMMARY")
            print("="*50)
            print(f"Keywords processed: {len(ALL_KEYWORDS)}")
            print(f"Data points collected: {len(trends_data)}")
            print(f"Date range: {trends_data['date'].min()} to {trends_data['date'].max()}")
            print(f"CSV saved to: {csv_path}")
            print(f"JSON saved to: {json_path}")
            
            # Show sample data
            print("\nSample data:")
            print(trends_data.head(10).to_string(index=False))
            
        else:
            logger.error("No data was collected")
            
    except Exception as e:
        logger.error(f"Script execution failed: {e}")
        raise

if __name__ == "__main__":
    main()
