#!/usr/bin/env python3
"""
Social Media Data Collector for Disease Surveillance
Collects tweets/posts related to disease symptoms from India
"""

import pandas as pd
import numpy as np
import tweepy
import re
import json
import os
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Set
from dataclasses import dataclass
import time

# Text processing libraries
try:
    import nltk
    from nltk.corpus import stopwords
    from nltk.tokenize import word_tokenize
    nltk.download('stopwords', quiet=True)
    nltk.download('punkt', quiet=True)
    NLTK_AVAILABLE = True
except ImportError:
    NLTK_AVAILABLE = False
    logging.warning("NLTK not available. Basic text cleaning will be used.")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('social_media_collector.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class TweetData:
    """Data structure for tweet information"""
    date: str
    location: str
    text: str
    keyword_matched: str
    user_id: str
    tweet_id: str
    retweet_count: int
    like_count: int
    language: str

class SocialMediaCollector:
    """Collects social media data for disease surveillance"""
    
    def __init__(self, api_credentials: Dict[str, str]):
        """
        Initialize the social media collector
        
        Args:
            api_credentials (Dict): Twitter API credentials
                - consumer_key
                - consumer_secret  
                - access_token
                - access_token_secret
                - bearer_token (optional, for API v2)
        """
        self.api_credentials = api_credentials
        self.api = None
        self.client = None
        self._initialize_twitter_api()
        
        # Load stopwords
        if NLTK_AVAILABLE:
            try:
                self.stop_words = set(stopwords.words('english'))
                # Add Hindi stopwords
                hindi_stopwords = {'है', 'में', 'की', 'का', 'के', 'को', 'से', 'पर', 'और', 'या'}
                self.stop_words.update(hindi_stopwords)
            except:
                self.stop_words = set()
        else:
            # Basic English stopwords
            self.stop_words = {
                'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
                'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
                'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
                'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
            }
    
    def _initialize_twitter_api(self):
        """Initialize Twitter API with error handling"""
        try:
            # Initialize API v1.1 for legacy endpoints
            auth = tweepy.OAuthHandler(
                self.api_credentials['consumer_key'],
                self.api_credentials['consumer_secret']
            )
            auth.set_access_token(
                self.api_credentials['access_token'],
                self.api_credentials['access_token_secret']
            )
            self.api = tweepy.API(auth, wait_on_rate_limit=True)
            
            # Initialize API v2 if bearer token is available
            if 'bearer_token' in self.api_credentials:
                self.client = tweepy.Client(
                    bearer_token=self.api_credentials['bearer_token'],
                    consumer_key=self.api_credentials['consumer_key'],
                    consumer_secret=self.api_credentials['consumer_secret'],
                    access_token=self.api_credentials['access_token'],
                    access_token_secret=self.api_credentials['access_token_secret'],
                    wait_on_rate_limit=True
                )
            
            logger.info("Twitter API initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Twitter API: {e}")
            raise
    
    def collect_tweets(self, keywords: List[str], days: int = 30, max_tweets: int = 1000) -> List[TweetData]:
        """
        Collect tweets containing specified keywords from India
        
        Args:
            keywords (List[str]): Keywords to search for
            days (int): Number of days to search back
            max_tweets (int): Maximum number of tweets to collect
            
        Returns:
            List[TweetData]: Collected tweet data
        """
        logger.info(f"Collecting tweets for keywords: {keywords}")
        logger.info(f"Date range: Last {days} days, Max tweets: {max_tweets}")
        
        collected_tweets = []
        tweets_per_keyword = max_tweets // len(keywords)
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        for keyword in keywords:
            logger.info(f"Searching for keyword: '{keyword}'")
            
            try:
                # Build search query
                # Include India-specific location filters and exclude retweets
                query = f'"{keyword}" place:India -is:retweet lang:en OR lang:hi'
                
                if self.client:  # Use API v2 if available
                    tweets = self._collect_tweets_v2(query, start_date, tweets_per_keyword, keyword)
                else:  # Fallback to API v1.1
                    tweets = self._collect_tweets_v1(query, start_date, tweets_per_keyword, keyword)
                
                collected_tweets.extend(tweets)
                logger.info(f"Collected {len(tweets)} tweets for '{keyword}'")
                
                # Rate limiting
                time.sleep(1)
                
            except Exception as e:
                logger.error(f"Error collecting tweets for '{keyword}': {e}")
                continue
        
        logger.info(f"Total tweets collected: {len(collected_tweets)}")
        return collected_tweets
    
    def _collect_tweets_v2(self, query: str, start_date: datetime, max_results: int, keyword: str) -> List[TweetData]:
        """Collect tweets using Twitter API v2"""
        tweets = []
        
        try:
            # Search recent tweets
            response = self.client.search_recent_tweets(
                query=query,
                max_results=min(max_results, 100),  # API limit
                start_time=start_date,
                tweet_fields=['created_at', 'author_id', 'public_metrics', 'lang', 'geo'],
                user_fields=['location'],
                expansions=['author_id']
            )
            
            if response.data:
                # Create user lookup for location data
                users = {user.id: user for user in response.includes.get('users', [])}
                
                for tweet in response.data:
                    user = users.get(tweet.author_id)
                    location = self._extract_location(user.location if user else None, tweet.geo)
                    
                    tweet_data = TweetData(
                        date=tweet.created_at.strftime('%Y-%m-%d'),
                        location=location,
                        text=self._clean_text(tweet.text),
                        keyword_matched=keyword,
                        user_id=str(tweet.author_id),
                        tweet_id=str(tweet.id),
                        retweet_count=tweet.public_metrics.get('retweet_count', 0),
                        like_count=tweet.public_metrics.get('like_count', 0),
                        language=tweet.lang
                    )
                    tweets.append(tweet_data)
            
        except Exception as e:
            logger.error(f"Error in API v2 collection: {e}")
        
        return tweets
    
    def _collect_tweets_v1(self, query: str, start_date: datetime, max_results: int, keyword: str) -> List[TweetData]:
        """Collect tweets using Twitter API v1.1 (fallback)"""
        tweets = []
        
        try:
            # Search tweets
            search_results = tweepy.Cursor(
                self.api.search_tweets,
                q=query,
                lang='en',
                result_type='recent',
                include_entities=True
            ).items(max_results)
            
            for tweet in search_results:
                # Filter by date
                if tweet.created_at.date() < start_date.date():
                    continue
                
                location = self._extract_location(
                    getattr(tweet.user, 'location', None),
                    getattr(tweet, 'geo', None)
                )
                
                tweet_data = TweetData(
                    date=tweet.created_at.strftime('%Y-%m-%d'),
                    location=location,
                    text=self._clean_text(tweet.text),
                    keyword_matched=keyword,
                    user_id=str(tweet.user.id),
                    tweet_id=str(tweet.id),
                    retweet_count=tweet.retweet_count,
                    like_count=tweet.favorite_count,
                    language=tweet.lang
                )
                tweets.append(tweet_data)
                
        except Exception as e:
            logger.error(f"Error in API v1.1 collection: {e}")
        
        return tweets
    
    def _extract_location(self, user_location: Optional[str], geo_data: Optional[Dict]) -> str:
        """Extract location information from tweet data"""
        if geo_data:
            # Use precise geo data if available
            return f"Geo: {geo_data}"
        
        if user_location:
            # Clean and validate user location
            location = user_location.strip()
            # Check if location mentions India or Indian cities/states
            indian_indicators = [
                'india', 'mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata', 'pune',
                'hyderabad', 'ahmedabad', 'surat', 'jaipur', 'lucknow', 'kanpur',
                'maharashtra', 'karnataka', 'tamil nadu', 'west bengal', 'gujarat',
                'rajasthan', 'uttar pradesh', 'bihar', 'odisha', 'kerala'
            ]
            
            if any(indicator in location.lower() for indicator in indian_indicators):
                return location
        
        return "India"  # Default location
    
    def _clean_text(self, text: str) -> str:
        """
        Clean tweet text by removing URLs, mentions, hashtags, emojis, and stopwords
        
        Args:
            text (str): Raw tweet text
            
        Returns:
            str: Cleaned text
        """
        if not text:
            return ""
        
        # Remove URLs
        text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
        
        # Remove user mentions and hashtags
        text = re.sub(r'@\w+|#\w+', '', text)
        
        # Remove emojis and special characters
        text = re.sub(r'[^\w\s]', ' ', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Remove stopwords
        if NLTK_AVAILABLE:
            try:
                words = word_tokenize(text.lower())
                words = [word for word in words if word not in self.stop_words and len(word) > 2]
                text = ' '.join(words)
            except:
                # Fallback to basic cleaning
                words = text.lower().split()
                words = [word for word in words if word not in self.stop_words and len(word) > 2]
                text = ' '.join(words)
        else:
            # Basic stopword removal
            words = text.lower().split()
            words = [word for word in words if word not in self.stop_words and len(word) > 2]
            text = ' '.join(words)
        
        return text
    
    def save_to_csv(self, tweets: List[TweetData], filename: str = None) -> str:
        """Save tweet data to CSV file"""
        if filename is None:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'social_media_data_{timestamp}.csv'
        
        # Ensure output directory exists
        os.makedirs('output', exist_ok=True)
        filepath = os.path.join('output', filename)
        
        # Convert to DataFrame
        df = pd.DataFrame([tweet.__dict__ for tweet in tweets])
        df.to_csv(filepath, index=False)
        
        logger.info(f"Data saved to: {filepath}")
        return filepath
    
    def save_to_json(self, tweets: List[TweetData], filename: str = None) -> str:
        """Save tweet data to JSON file"""
        if filename is None:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'social_media_data_{timestamp}.json'
        
        # Ensure output directory exists
        os.makedirs('output', exist_ok=True)
        filepath = os.path.join('output', filename)
        
        # Convert to JSON
        data = [tweet.__dict__ for tweet in tweets]
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Data saved to: {filepath}")
        return filepath

def load_api_credentials() -> Dict[str, str]:
    """Load Twitter API credentials from environment or config file"""
    # Try to load from environment variables first
    credentials = {
        'consumer_key': os.getenv('TWITTER_CONSUMER_KEY'),
        'consumer_secret': os.getenv('TWITTER_CONSUMER_SECRET'),
        'access_token': os.getenv('TWITTER_ACCESS_TOKEN'),
        'access_token_secret': os.getenv('TWITTER_ACCESS_TOKEN_SECRET'),
        'bearer_token': os.getenv('TWITTER_BEARER_TOKEN')
    }
    
    # Check if credentials are available
    required_keys = ['consumer_key', 'consumer_secret', 'access_token', 'access_token_secret']
    if not all(credentials.get(key) for key in required_keys):
        # Try to load from config file
        config_path = 'config/twitter_credentials.json'
        if os.path.exists(config_path):
            with open(config_path, 'r') as f:
                file_credentials = json.load(f)
                credentials.update(file_credentials)
    
    return credentials

def main():
    """Main execution function"""
    # Disease-related keywords for social media monitoring
    DISEASE_KEYWORDS = [
        'loose motion',
        'stomach pain', 
        'vomiting',
        'cholera',
        'diarrhea',
        'typhoid',
        'fever',
        'dengue',
        'malaria',
        'dehydration',
        'food poisoning',
        'gastroenteritis'
    ]
    
    # Hindi/local language keywords
    HINDI_KEYWORDS = [
        'दस्त',      # Diarrhea
        'पेट दर्द',   # Stomach pain
        'उल्टी',     # Vomiting
        'बुखार',     # Fever
        'हैजा'       # Cholera
    ]
    
    ALL_KEYWORDS = DISEASE_KEYWORDS + HINDI_KEYWORDS
    
    try:
        # Load API credentials
        credentials = load_api_credentials()
        
        if not all(credentials.get(key) for key in ['consumer_key', 'consumer_secret', 'access_token', 'access_token_secret']):
            logger.error("Twitter API credentials not found. Please set environment variables or create config/twitter_credentials.json")
            return
        
        # Initialize collector
        collector = SocialMediaCollector(credentials)
        
        # Collect tweets for last 30 days
        tweets = collector.collect_tweets(ALL_KEYWORDS, days=30, max_tweets=1000)
        
        if tweets:
            # Save to both CSV and JSON
            csv_path = collector.save_to_csv(tweets)
            json_path = collector.save_to_json(tweets)
            
            # Display summary
            print("\n" + "="*50)
            print("SOCIAL MEDIA DATA COLLECTION SUMMARY")
            print("="*50)
            print(f"Keywords processed: {len(ALL_KEYWORDS)}")
            print(f"Tweets collected: {len(tweets)}")
            print(f"CSV saved to: {csv_path}")
            print(f"JSON saved to: {json_path}")
            
            # Show keyword distribution
            df = pd.DataFrame([tweet.__dict__ for tweet in tweets])
            keyword_counts = df['keyword_matched'].value_counts()
            print("\nKeyword distribution:")
            print(keyword_counts.to_string())
            
        else:
            logger.error("No tweets were collected")
            
    except Exception as e:
        logger.error(f"Script execution failed: {e}")
        raise

if __name__ == "__main__":
    main()
