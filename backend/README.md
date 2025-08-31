# Outbreak Sentinel API Backend

FastAPI backend for the Disease Outbreak Surveillance Dashboard providing standardized health data endpoints.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Start the Server
```bash
# Simple startup
python run_server.py

# Development mode with auto-reload
python run_server.py --reload --log-level debug

# Custom host/port
python run_server.py --host 127.0.0.1 --port 8001
```

### 3. Access API Documentation
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 📡 API Endpoints

### Core Data Endpoints

#### `GET /api/hospital`
Hospital OPD visit data
```bash
curl "http://localhost:8000/api/hospital?days=7&cities=Mumbai,Delhi"
```

**Parameters:**
- `days` (1-90): Number of days of data
- `cities`: Comma-separated city names
- `data_source`: "synthetic" or "static"
- `include_outbreak`: Include outbreak patterns (synthetic only)

#### `GET /api/pharmacy`
Pharmacy medicine sales data
```bash
curl "http://localhost:8000/api/pharmacy?days=14&include_outbreak=true"
```

**Parameters:**
- `days` (1-90): Number of days of data
- `cities`: Comma-separated city names
- `data_source`: "synthetic" or "static"
- `include_outbreak`: Include outbreak patterns (synthetic only)

#### `GET /api/trends`
Google Trends-style search data
```bash
curl "http://localhost:8000/api/trends?days=7&states=Maharashtra,Delhi"
```

**Parameters:**
- `days` (1-90): Number of days of data
- `states`: Comma-separated state names
- `data_source`: "synthetic", "static", or "live"
- `keywords`: Comma-separated search keywords

#### `GET /api/social`
Social media mentions data
```bash
curl "http://localhost:8000/api/social?days=7&platforms=twitter"
```

**Parameters:**
- `days` (1-90): Number of days of data
- `states`: Comma-separated state names
- `data_source`: "synthetic", "static", or "live"
- `platforms`: Comma-separated platform names

#### `GET /api/unified`
Multi-source unified data (for testing frontend merger)
```bash
curl "http://localhost:8000/api/unified?sources=hospital,pharmacy,trends,social"
```

## 📊 Data Schema

All endpoints return data in this standardized format:

```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2024-01-15T08:00:00Z",
      "location": "Mumbai",
      "disease": "dengue",
      "source": "hospital",
      "value": 67.5,
      "metadata": {
        "raw_value": 135,
        "unit": "visits",
        "hospital_id": "H001",
        "seasonal_multiplier": 1.2,
        "outbreak_multiplier": 2.1
      }
    }
  ],
  "metadata": {
    "source": "synthetic",
    "days_requested": 7,
    "total_records": 252,
    "data_type": "hospital_opd"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Field Descriptions
- **timestamp**: ISO 8601 format datetime
- **location**: City (hospital/pharmacy) or State (trends/social)
- **disease**: One of: fever, cough, diarrhea, dengue, malaria, flu
- **source**: hospital, pharmacy, trends, social
- **value**: Normalized 0-100 scale
- **metadata**: Source-specific additional data

## 🎛️ Data Sources

### 1. Synthetic Data Generator
**Features:**
- Realistic seasonal patterns (dengue peaks in August, flu in December)
- Outbreak simulation (2-3x spikes in middle of time range)
- Consistent random seed for reproducible data
- Disease-specific base rates and medicines

**Disease Patterns:**
```python
DISEASE_PATTERNS = {
    "dengue": {
        "base_rate": 0.05,
        "seasonal_peak": 8,  # August
        "outbreak_multiplier": 4.0,
        "medicines": ["paracetamol", "oral_rehydration", "platelet_booster"]
    }
    # ... more diseases
}
```

### 2. Static Data Loader
**Features:**
- Loads from JSON files in `/data/` directory
- Automatic schema transformation
- Flexible field mapping (handles various JSON structures)
- Date filtering and city/state filtering

**Static Files:**
- `data/hospital_data.json`
- `data/pharmacy_data.json`
- `data/trends_data.json`
- `data/social_data.json`

## 🔧 Configuration

### Environment Variables
```bash
# Optional: Set default data mode
export VITE_DATA_MODE=mixed

# Optional: Custom data directory
export DATA_DIR=./custom_data
```

### Target Locations
- **Cities**: Mumbai, Delhi, Pune, Bengaluru, Chennai, Kolkata
- **States**: Maharashtra, Delhi, Karnataka, Tamil Nadu, West Bengal

### Target Diseases
- fever, cough, diarrhea, dengue, malaria, flu

## 🌐 CORS Configuration

The API is configured to accept requests from:
- `http://localhost:3000` (Create React App)
- `http://localhost:5173` (Vite)
- `http://localhost:8080` (Your current frontend)
- Local network IPs (`192.168.*.*`)

## 🔗 Frontend Integration

Update your frontend data fetching to use the new API:

```typescript
// Update your data hooks to use the new endpoints
const fetchData = async (endpoint: string) => {
  const response = await fetch(`http://localhost:8000/api/${endpoint}?days=7`);
  const result = await response.json();
  return result.data; // Extract the data array
};
```

## 📈 Example Responses

### Hospital Data
```json
{
  "timestamp": "2024-01-15T08:00:00Z",
  "location": "Mumbai",
  "disease": "dengue",
  "source": "hospital",
  "value": 67.5,
  "metadata": {
    "raw_value": 135,
    "unit": "visits",
    "hospital_id": "H001",
    "seasonal_multiplier": 1.2,
    "outbreak_multiplier": 2.1
  }
}
```

### Trends Data
```json
{
  "timestamp": "2024-01-15T12:00:00Z",
  "location": "Maharashtra",
  "disease": "dengue",
  "source": "trends",
  "value": 78,
  "metadata": {
    "raw_value": 78,
    "unit": "search_interest",
    "search_term": "dengue fever",
    "region": "Maharashtra",
    "is_live": false
  }
}
```

## 🧪 Testing

### Manual Testing
```bash
# Test all endpoints
curl http://localhost:8000/health
curl http://localhost:8000/api/hospital
curl http://localhost:8000/api/pharmacy
curl http://localhost:8000/api/trends
curl http://localhost:8000/api/social
curl http://localhost:8000/api/unified
```

### Automated Testing
```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run tests (when implemented)
pytest tests/
```

## 🔮 Future Enhancements

### Live Data Integration
- **Google Trends API**: Replace synthetic trends with real pytrends data
- **Social Media APIs**: Integrate Twitter API v2, Reddit API
- **Real-time Streaming**: WebSocket endpoints for live updates
- **Caching**: Redis for improved performance

### Advanced Features
- **Authentication**: API key management
- **Rate Limiting**: Prevent API abuse
- **Data Validation**: Enhanced input validation
- **Monitoring**: Health checks and metrics
- **Database**: PostgreSQL for persistent storage

## 🚨 Production Deployment

### Docker Setup
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "run_server.py", "--host", "0.0.0.0"]
```

### Environment Setup
```bash
# Production environment variables
export ENVIRONMENT=production
export LOG_LEVEL=warning
export DATA_DIR=/app/data
export API_HOST=0.0.0.0
export API_PORT=8000
```

The API is now ready to serve your React dashboard with standardized, realistic health surveillance data! 🎉
