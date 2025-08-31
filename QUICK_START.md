# 🚀 Quick Start Guide - FastAPI Integration

## Step-by-Step Setup (Python 3.13 Compatible)

### 1. Install Backend Dependencies

```bash
cd backend

# Option A: Use the installer script (recommended)
python install_deps.py

# Option B: Manual installation
pip install fastapi uvicorn[standard] pydantic python-dateutil httpx requests python-dotenv
```

### 2. Start the Backend Server

```bash
# Start development server with auto-reload
python start_dev.py
```

**Expected Output:**
```
🚀 Starting Outbreak Sentinel API Server...
📍 Server will be available at: http://localhost:8000
📚 API Documentation: http://localhost:8000/docs
```

### 3. Test Backend (Optional)

```bash
# In a new terminal
cd backend
python test_api.py
```

### 4. Start Frontend

```bash
# In a new terminal
cd disease-outbreak-sentinel
npm run dev
```

### 5. Verify Integration

1. **Open Dashboard**: http://localhost:8080
2. **Check API Status**: Look for green "API Connected" badge in header
3. **Test Data**: Charts should populate with backend data
4. **Test Integration Hub**: Visit `/data-integration`

## 🔍 Quick Verification

### ✅ Backend Working
- Visit: http://localhost:8000/docs
- Test endpoint: http://localhost:8000/api/hospital
- Should return JSON with health data

### ✅ Frontend Integration Working
- Dashboard shows green "API" badge
- Console shows: `✅ Using FastAPI backend for hospital data`
- Data loads in charts and tables

### ⚠️ Fallback Mode (Backend Offline)
- Dashboard shows gray "Local" badge  
- Console shows: `⚠️ FastAPI backend not available, falling back to local data generation`
- Dashboard still works with local data

## 🐛 Troubleshooting

### Python 3.13 Compatibility Issues
If you get pandas compilation errors:
```bash
# Skip pandas for now - the API works without it
pip install fastapi uvicorn pydantic python-dateutil httpx requests python-dotenv
```

### Port Already in Use
```bash
# Use different port
python run_server.py --port 8001

# Update frontend API URL
# Edit: disease-outbreak-sentinel/.env
# Add: VITE_API_URL=http://localhost:8001
```

### CORS Issues
If frontend can't connect:
1. Check backend logs for CORS errors
2. Verify frontend URL in CORS settings
3. Try accessing API directly in browser

## 🎉 Success!

When working correctly, you'll see:
- **Backend**: API docs at http://localhost:8000/docs
- **Frontend**: Dashboard at http://localhost:8080 with green "API Connected" badge
- **Real Data**: Charts populated with backend-generated realistic health data
- **Mode Switching**: All three modes (Simulated/Live/Mixed) working

Your disease outbreak surveillance dashboard is now powered by a real FastAPI backend! 🏥📊
