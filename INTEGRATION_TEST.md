# 🧪 FastAPI Integration Testing Guide

## Quick Integration Test

Follow these steps to test your new FastAPI backend integration:

### 1. Start the Backend Server

```bash
# Terminal 1: Start FastAPI backend
cd backend
pip install -r requirements.txt
python start_dev.py
```

**Expected Output:**
```
🚀 Starting Outbreak Sentinel API Server...
📍 Server will be available at: http://localhost:8000
📚 API Documentation: http://localhost:8000/docs
🔄 Auto-reload enabled for development
```

### 2. Test Backend Endpoints

```bash
# Terminal 2: Test the API
cd backend
python test_api.py
```

**Expected Output:**
```
✅ All tests passed! API is working correctly.
```

### 3. Start the Frontend

```bash
# Terminal 3: Start React frontend
cd disease-outbreak-sentinel
npm run dev
```

### 4. Test Integration

#### **Main Dashboard Test**
1. Navigate to: http://localhost:8080
2. **Check API Status**: Look for green "API" badge in header
3. **Test Mode Switching**: Try Simulated → Mixed → Live modes
4. **Verify Data Loading**: Charts and alerts should populate with backend data

#### **Integration Hub Test**
1. Navigate to: http://localhost:8080/data-integration
2. **Check Advanced Status**: API status indicator should show "Connected"
3. **Test Data Stream**: Real-time table should show backend data
4. **Test Source Status**: All sources should show connection status
5. **Test Analytics**: Statistics should reflect backend data

## 🔍 What to Look For

### ✅ Success Indicators

#### **Console Logs (Browser DevTools)**
```
🔄 Fetching hospital data from FastAPI backend (mode: mixed)
✅ Using FastAPI backend for hospital data
✅ API Success: 252 records
```

#### **API Status Badge**
- **Green "API Connected"**: Backend is working
- **Red "API Offline"**: Backend is down, using local fallback

#### **Data Quality**
- **Realistic Patterns**: Data should show seasonal and outbreak patterns
- **Source Diversity**: Different values from hospital, pharmacy, trends, social
- **Metadata Rich**: Hover over data points to see backend metadata

### ⚠️ Fallback Indicators

#### **Console Logs**
```
⚠️ FastAPI backend not available, falling back to local data generation
🔄 Falling back to local generation for hospital
```

#### **API Status Badge**
- **Gray "Local"**: Using local data generation
- **Red "API Offline"**: Backend connection failed

## 🐛 Troubleshooting

### Backend Not Starting
```bash
# Check if port 8000 is in use
netstat -an | grep 8000

# Try different port
python run_server.py --port 8001
```

### Frontend Not Connecting
1. **Check CORS**: Backend logs should show OPTIONS requests
2. **Check URL**: Verify API_CONFIG.BASE_URL in browser console
3. **Check Network**: Open DevTools → Network tab, look for API calls

### Data Not Loading
1. **Check API Status**: Should show "Connected" in dashboard
2. **Check Console**: Look for API request logs
3. **Test Endpoints**: Visit http://localhost:8000/docs and test manually

## 📊 Expected Data Flow

### Mode: Simulated
```
Frontend → FastAPI → Synthetic Generator → Standardized Data → Frontend
```
- All sources use backend synthetic data
- Realistic patterns with outbreak spikes
- Rich metadata from backend

### Mode: Live  
```
Frontend → FastAPI → Live APIs (fallback to synthetic) → Standardized Data → Frontend
```
- Clinical data hidden
- Trends/Social from live APIs (or synthetic fallback)
- Real-time patterns

### Mode: Mixed
```
Frontend → FastAPI → Mixed Sources → Standardized Data → Frontend
```
- Clinical: Backend synthetic
- Trends/Social: Live APIs (or synthetic fallback)
- Best of both worlds

## 🎯 Integration Success Criteria

### ✅ Backend Integration Working
- [ ] FastAPI server starts without errors
- [ ] All 5 endpoints return data (/api/hospital, /pharmacy, /trends, /social, /unified)
- [ ] API documentation accessible at /docs
- [ ] Test script passes all checks

### ✅ Frontend Integration Working  
- [ ] Dashboard loads without errors
- [ ] API status shows "Connected"
- [ ] Mode switching works (Simulated/Live/Mixed)
- [ ] Charts populate with backend data
- [ ] Integration Hub shows real-time data stream

### ✅ Data Quality Verified
- [ ] Data follows standardized schema
- [ ] Realistic patterns visible (seasonal, outbreak spikes)
- [ ] Source-specific metadata present
- [ ] No duplicate or invalid data points

## 🚀 Next Steps After Integration

### Immediate
1. **Test All Modes**: Verify Simulated, Live, and Mixed work correctly
2. **Test Error Handling**: Stop backend and verify graceful fallback
3. **Test Performance**: Check data loading speed and responsiveness

### Future Enhancements
1. **Live Data**: Connect real Google Trends and Twitter APIs
2. **Real-time Streaming**: WebSocket endpoints for live updates
3. **Database**: Add PostgreSQL for data persistence
4. **Caching**: Add Redis for improved performance
5. **Authentication**: API key management
6. **Monitoring**: Health checks and metrics

Your FastAPI backend integration is ready for testing! 🎉
