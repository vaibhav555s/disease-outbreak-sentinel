# Data Collection Scripts for Disease Surveillance

This directory contains Python scripts for collecting real-time data from Google Trends and Social Media platforms for disease outbreak detection.

## 📁 Files Overview

- `google_trends_collector.py` - Collects Google Trends data for disease keywords
- `social_media_collector.py` - Collects tweets/posts related to disease symptoms
- `requirements.txt` - Python dependencies
- `config/twitter_credentials_template.json` - Twitter API credentials template
- `.env.template` - Environment variables template

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Navigate to scripts directory
cd scripts/

# Install Python dependencies
pip install -r requirements.txt

# Download NLTK data (for text processing)
python -c "import nltk; nltk.download('stopwords'); nltk.download('punkt')"
```

### 2. Setup API Credentials

#### For Twitter API:
1. Create a Twitter Developer account at https://developer.twitter.com/
2. Create a new app and generate API keys
3. Copy `.env.template` to `.env` and fill in your credentials:

```bash
cp .env.template .env
# Edit .env with your Twitter API credentials
```

Or create `config/twitter_credentials.json`:
```bash
cp config/twitter_credentials_template.json config/twitter_credentials.json
# Edit the JSON file with your credentials
```

### 3. Run the Scripts

#### Google Trends Collection:
```bash
python google_trends_collector.py
```

#### Social Media Collection:
```bash
python social_media_collector.py
```

## 📊 Google Trends Collector

### Features
- Fetches daily Google Trends data for disease-related keywords
- Supports both English and Hindi keywords
- Normalizes search index to 0-100 range
- Handles API rate limiting and retries
- Exports data to CSV and JSON formats

### Keywords Monitored
**English Keywords:**
- diarrhea, cholera, typhoid, fever
- dengue, malaria, loose motion
- stomach pain, vomiting, dehydration

**Hindi Keywords:**
- दस्त (Diarrhea), बुखार (Fever)
- पेट दर्द (Stomach pain), उल्टी (Vomiting)

### Output Format
```csv
date,keyword,search_index
2024-01-20,diarrhea,45.67
2024-01-20,fever,78.23
```

### Usage Examples

```python
from google_trends_collector import GoogleTrendsCollector

# Initialize collector
collector = GoogleTrendsCollector()

# Fetch data for specific keywords
keywords = ['diarrhea', 'cholera', 'fever']
data = collector.fetch_trends_data(keywords, days=30)

# Save to CSV
collector.save_to_csv(data, 'trends_data.csv')
```

## 🐦 Social Media Collector

### Features
- Collects tweets containing disease-related keywords from India
- Supports both Twitter API v1.1 and v2
- Cleans text by removing URLs, mentions, emojis, and stopwords
- Extracts location information
- Handles rate limiting and API errors

### Keywords Monitored
**English Keywords:**
- loose motion, stomach pain, vomiting
- cholera, diarrhea, typhoid, fever
- dengue, malaria, dehydration

**Hindi Keywords:**
- दस्त, पेट दर्द, उल्टी, बुखार, हैजा

### Output Format
```csv
date,location,text,keyword_matched,user_id,tweet_id,retweet_count,like_count,language
2024-01-20,Mumbai,stomach pain severe need help,stomach pain,123456,789012,5,12,en
```

### Usage Examples

```python
from social_media_collector import SocialMediaCollector

# Initialize with credentials
credentials = {
    'consumer_key': 'your_key',
    'consumer_secret': 'your_secret',
    'access_token': 'your_token',
    'access_token_secret': 'your_token_secret'
}

collector = SocialMediaCollector(credentials)

# Collect tweets
keywords = ['loose motion', 'stomach pain', 'vomiting']
tweets = collector.collect_tweets(keywords, days=30, max_tweets=1000)

# Save to CSV
collector.save_to_csv(tweets, 'social_data.csv')
```

## 🔧 Configuration Options

### Google Trends Collector
- `geo`: Geographic location (default: 'IN' for India)
- `timeout`: Request timeout settings
- `retries`: Number of retry attempts
- `days`: Number of days to fetch data for

### Social Media Collector
- `max_tweets`: Maximum number of tweets to collect
- `days`: Number of days to search back
- Rate limiting and retry settings

## 📈 Integration with Dashboard

The collected data can be integrated with your React dashboard:

1. **Automated Collection**: Set up cron jobs to run scripts periodically
2. **Data Processing**: Convert CSV/JSON to your dashboard's data format
3. **API Integration**: Create endpoints to serve collected data
4. **Real-time Updates**: Use webhooks or polling for live data

### Example Integration Script

```python
# integration_example.py
import pandas as pd
import json
from datetime import datetime

def convert_to_dashboard_format(trends_csv, social_csv):
    """Convert collected data to dashboard format"""
    
    # Load data
    trends_df = pd.read_csv(trends_csv)
    social_df = pd.read_csv(social_csv)
    
    # Process trends data
    trends_processed = []
    for _, row in trends_df.iterrows():
        trends_processed.append({
            'date': row['date'],
            'state': 'India',  # Aggregate for India
            'fever': row['search_index'] if row['keyword'] == 'fever' else 0,
            'cough': row['search_index'] if row['keyword'] == 'cough' else 0,
            'diarrhea': row['search_index'] if row['keyword'] == 'diarrhea' else 0,
            'dengue': row['search_index'] if row['keyword'] == 'dengue' else 0,
            'malaria': row['search_index'] if row['keyword'] == 'malaria' else 0,
            'flu': row['search_index'] if row['keyword'] == 'flu' else 0
        })
    
    # Process social data
    social_processed = []
    social_grouped = social_df.groupby('date').agg({
        'keyword_matched': 'count',
        'like_count': 'sum',
        'retweet_count': 'sum'
    }).reset_index()
    
    for _, row in social_grouped.iterrows():
        social_processed.append({
            'date': row['date'],
            'state': 'India',
            'platform': 'twitter',
            'health_mentions': row['keyword_matched'],
            'disease_mentions': row['keyword_matched'] // 2,  # Estimate
            'sentiment_score': 0.0  # Would need sentiment analysis
        })
    
    return trends_processed, social_processed

# Usage
trends_data, social_data = convert_to_dashboard_format(
    'output/google_trends_data.csv',
    'output/social_media_data.csv'
)

# Save in dashboard format
with open('../public/data/trends.json', 'w') as f:
    json.dump(trends_data, f, indent=2)

with open('../public/data/social.json', 'w') as f:
    json.dump(social_data, f, indent=2)
```

## 🔒 Security & Privacy

- **API Keys**: Never commit API keys to version control
- **Data Privacy**: Ensure compliance with platform terms of service
- **Rate Limiting**: Respect API rate limits to avoid account suspension
- **Data Storage**: Implement proper data retention policies

## 🐛 Troubleshooting

### Common Issues

1. **Twitter API Access Denied**
   - Verify API credentials are correct
   - Check if your Twitter Developer account is approved
   - Ensure you have the right API access level

2. **Google Trends Rate Limiting**
   - Reduce the number of keywords per request
   - Increase delay between requests
   - Use proxy rotation if needed

3. **No Data Returned**
   - Check if keywords are popular enough
   - Verify date ranges are valid
   - Ensure geographic filters are correct

4. **Text Cleaning Issues**
   - Install NLTK properly: `python -c "import nltk; nltk.download('all')"`
   - Check encoding issues with non-English text

### Logging
Both scripts generate detailed logs:
- `trends_collector.log` - Google Trends collection logs
- `social_media_collector.log` - Social media collection logs

## 📞 Support

For issues or questions:
1. Check the logs for detailed error messages
2. Verify API credentials and permissions
3. Ensure all dependencies are installed correctly
4. Review API documentation for any changes
