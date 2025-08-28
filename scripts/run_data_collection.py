#!/usr/bin/env python3
"""
Unified Data Collection Script
Runs both Google Trends and Social Media data collection
"""

import os
import sys
import logging
import argparse
from datetime import datetime
import json
import pandas as pd

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from google_trends_collector import GoogleTrendsCollector
from social_media_collector import SocialMediaCollector, load_api_credentials

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('data_collection.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class UnifiedDataCollector:
    """Unified data collector for both Google Trends and Social Media"""
    
    def __init__(self, twitter_credentials=None):
        """Initialize collectors"""
        self.trends_collector = GoogleTrendsCollector()
        self.social_collector = None
        
        if twitter_credentials:
            try:
                self.social_collector = SocialMediaCollector(twitter_credentials)
                logger.info("Social media collector initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize social media collector: {e}")
    
    def collect_all_data(self, days=30, max_tweets=1000):
        """
        Collect data from all sources
        
        Args:
            days (int): Number of days to collect data for
            max_tweets (int): Maximum tweets to collect
            
        Returns:
            dict: Collection results
        """
        results = {
            'trends_data': None,
            'social_data': None,
            'success': False,
            'errors': []
        }
        
        # Define keywords
        disease_keywords = [
            'diarrhea', 'cholera', 'typhoid', 'fever', 'dengue', 'malaria',
            'loose motion', 'stomach pain', 'vomiting', 'dehydration'
        ]
        
        hindi_keywords = [
            'दस्त', 'बुखार', 'पेट दर्द', 'उल्टी', 'हैजा'
        ]
        
        all_keywords = disease_keywords + hindi_keywords
        
        # Collect Google Trends data
        logger.info("Starting Google Trends data collection...")
        try:
            trends_data = self.trends_collector.fetch_trends_data(all_keywords, days=days)
            if not trends_data.empty:
                results['trends_data'] = trends_data
                logger.info(f"Successfully collected {len(trends_data)} trends data points")
            else:
                results['errors'].append("No Google Trends data collected")
        except Exception as e:
            error_msg = f"Google Trends collection failed: {e}"
            logger.error(error_msg)
            results['errors'].append(error_msg)
        
        # Collect Social Media data
        if self.social_collector:
            logger.info("Starting Social Media data collection...")
            try:
                social_data = self.social_collector.collect_tweets(
                    all_keywords, days=days, max_tweets=max_tweets
                )
                if social_data:
                    results['social_data'] = social_data
                    logger.info(f"Successfully collected {len(social_data)} social media posts")
                else:
                    results['errors'].append("No social media data collected")
            except Exception as e:
                error_msg = f"Social media collection failed: {e}"
                logger.error(error_msg)
                results['errors'].append(error_msg)
        else:
            results['errors'].append("Social media collector not available (missing credentials)")
        
        # Determine overall success
        results['success'] = (results['trends_data'] is not None or results['social_data'] is not None)
        
        return results
    
    def save_results(self, results, output_dir='output'):
        """Save collection results to files"""
        os.makedirs(output_dir, exist_ok=True)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        saved_files = []
        
        # Save trends data
        if results['trends_data'] is not None:
            trends_csv = os.path.join(output_dir, f'trends_data_{timestamp}.csv')
            trends_json = os.path.join(output_dir, f'trends_data_{timestamp}.json')
            
            # Save CSV
            results['trends_data'].to_csv(trends_csv, index=False)
            saved_files.append(trends_csv)
            
            # Save JSON
            trends_data_copy = results['trends_data'].copy()
            trends_data_copy['date'] = trends_data_copy['date'].dt.strftime('%Y-%m-%d')
            trends_data_copy.to_json(trends_json, orient='records', indent=2)
            saved_files.append(trends_json)
        
        # Save social data
        if results['social_data'] is not None:
            social_csv = os.path.join(output_dir, f'social_data_{timestamp}.csv')
            social_json = os.path.join(output_dir, f'social_data_{timestamp}.json')
            
            # Convert to DataFrame and save CSV
            social_df = pd.DataFrame([tweet.__dict__ for tweet in results['social_data']])
            social_df.to_csv(social_csv, index=False)
            saved_files.append(social_csv)
            
            # Save JSON
            social_data_dict = [tweet.__dict__ for tweet in results['social_data']]
            with open(social_json, 'w', encoding='utf-8') as f:
                json.dump(social_data_dict, f, indent=2, ensure_ascii=False)
            saved_files.append(social_json)
        
        return saved_files
    
    def generate_summary_report(self, results, saved_files):
        """Generate a summary report of the collection"""
        report = {
            'collection_timestamp': datetime.now().isoformat(),
            'success': results['success'],
            'errors': results['errors'],
            'data_summary': {},
            'files_generated': saved_files
        }
        
        # Trends data summary
        if results['trends_data'] is not None:
            trends_df = results['trends_data']
            report['data_summary']['trends'] = {
                'total_records': len(trends_df),
                'date_range': {
                    'start': trends_df['date'].min().strftime('%Y-%m-%d'),
                    'end': trends_df['date'].max().strftime('%Y-%m-%d')
                },
                'keywords': trends_df['keyword'].unique().tolist(),
                'avg_search_index': round(trends_df['search_index'].mean(), 2)
            }
        
        # Social data summary
        if results['social_data'] is not None:
            social_data = results['social_data']
            social_df = pd.DataFrame([tweet.__dict__ for tweet in social_data])
            
            report['data_summary']['social'] = {
                'total_records': len(social_data),
                'date_range': {
                    'start': min(tweet.date for tweet in social_data),
                    'end': max(tweet.date for tweet in social_data)
                },
                'keywords': social_df['keyword_matched'].unique().tolist(),
                'languages': social_df['language'].unique().tolist(),
                'avg_engagement': {
                    'retweets': round(social_df['retweet_count'].mean(), 2),
                    'likes': round(social_df['like_count'].mean(), 2)
                }
            }
        
        return report

def main():
    """Main execution function"""
    parser = argparse.ArgumentParser(description='Unified Data Collection for Disease Surveillance')
    parser.add_argument('--days', type=int, default=30, help='Number of days to collect data for')
    parser.add_argument('--max-tweets', type=int, default=1000, help='Maximum number of tweets to collect')
    parser.add_argument('--output-dir', default='output', help='Output directory for saved files')
    parser.add_argument('--trends-only', action='store_true', help='Collect only Google Trends data')
    parser.add_argument('--social-only', action='store_true', help='Collect only Social Media data')
    
    args = parser.parse_args()
    
    logger.info("Starting unified data collection...")
    logger.info(f"Parameters: days={args.days}, max_tweets={args.max_tweets}")
    
    try:
        # Load Twitter credentials
        twitter_credentials = None
        if not args.trends_only:
            twitter_credentials = load_api_credentials()
            if not all(twitter_credentials.get(key) for key in ['consumer_key', 'consumer_secret', 'access_token', 'access_token_secret']):
                if args.social_only:
                    logger.error("Twitter credentials required for social-only mode")
                    return
                else:
                    logger.warning("Twitter credentials not found. Will collect only Google Trends data.")
                    twitter_credentials = None
        
        # Initialize collector
        collector = UnifiedDataCollector(twitter_credentials)
        
        # Collect data
        results = collector.collect_all_data(days=args.days, max_tweets=args.max_tweets)
        
        if results['success']:
            # Save results
            saved_files = collector.save_results(results, args.output_dir)
            
            # Generate summary report
            report = collector.generate_summary_report(results, saved_files)
            
            # Save report
            report_file = os.path.join(args.output_dir, f"collection_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
            with open(report_file, 'w') as f:
                json.dump(report, f, indent=2)
            
            # Display summary
            print("\n" + "="*60)
            print("DATA COLLECTION SUMMARY")
            print("="*60)
            print(f"Collection Status: {'SUCCESS' if results['success'] else 'FAILED'}")
            
            if results['trends_data'] is not None:
                print(f"Google Trends Records: {len(results['trends_data'])}")
            
            if results['social_data'] is not None:
                print(f"Social Media Records: {len(results['social_data'])}")
            
            if results['errors']:
                print(f"Errors: {len(results['errors'])}")
                for error in results['errors']:
                    print(f"  - {error}")
            
            print(f"\nFiles Generated:")
            for file_path in saved_files:
                print(f"  - {file_path}")
            
            print(f"Summary Report: {report_file}")
            print("="*60)
            
        else:
            logger.error("Data collection failed completely")
            if results['errors']:
                for error in results['errors']:
                    logger.error(f"Error: {error}")
    
    except Exception as e:
        logger.error(f"Script execution failed: {e}")
        raise

def convert_to_dashboard_format(trends_csv=None, social_csv=None, output_dir='../public/data'):
    """Convert collected data to dashboard JSON format"""
    os.makedirs(output_dir, exist_ok=True)

    # Process trends data
    if trends_csv and os.path.exists(trends_csv):
        trends_df = pd.read_csv(trends_csv)
        trends_processed = []

        # Group by date and aggregate
        for date in trends_df['date'].unique():
            date_data = trends_df[trends_df['date'] == date]

            record = {
                'date': date,
                'state': 'India',
                'fever': date_data[date_data['keyword'] == 'fever']['search_index'].sum(),
                'cough': date_data[date_data['keyword'] == 'cough']['search_index'].sum(),
                'diarrhea': date_data[date_data['keyword'] == 'diarrhea']['search_index'].sum(),
                'dengue': date_data[date_data['keyword'] == 'dengue']['search_index'].sum(),
                'malaria': date_data[date_data['keyword'] == 'malaria']['search_index'].sum(),
                'flu': date_data[date_data['keyword'] == 'flu']['search_index'].sum()
            }
            trends_processed.append(record)

        # Save trends data
        trends_output = os.path.join(output_dir, 'trends.json')
        with open(trends_output, 'w') as f:
            json.dump(trends_processed, f, indent=2)
        logger.info(f"Dashboard trends data saved to: {trends_output}")

    # Process social data
    if social_csv and os.path.exists(social_csv):
        social_df = pd.read_csv(social_csv)
        social_processed = []

        # Group by date
        social_grouped = social_df.groupby('date').agg({
            'keyword_matched': 'count',
            'like_count': 'sum',
            'retweet_count': 'sum'
        }).reset_index()

        for _, row in social_grouped.iterrows():
            record = {
                'date': row['date'],
                'state': 'India',
                'platform': 'twitter',
                'health_mentions': int(row['keyword_matched']),
                'disease_mentions': int(row['keyword_matched'] // 2),
                'sentiment_score': 0.0  # Would need sentiment analysis
            }
            social_processed.append(record)

        # Save social data
        social_output = os.path.join(output_dir, 'social.json')
        with open(social_output, 'w') as f:
            json.dump(social_processed, f, indent=2)
        logger.info(f"Dashboard social data saved to: {social_output}")

if __name__ == "__main__":
    main()
