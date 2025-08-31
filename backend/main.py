#!/usr/bin/env python3
"""
FastAPI Backend for Disease Outbreak Surveillance Dashboard (Outbreak Sentinel)
Provides synthetic and sample data endpoints for hospital, pharmacy, trends, and social data
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Literal
from datetime import datetime, timedelta
import json
import os
import logging
import uvicorn
from pathlib import Path

# Import our data generators
from data_generators import (
    SyntheticDataGenerator,
    StaticDataLoader,
    HealthDataPoint,
    DataSourceType
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Outbreak Sentinel API",
    description="Backend API for Disease Outbreak Surveillance Dashboard",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173", 
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
        "http://192.168.*.*:*",  # Local network
        "*"  # Allow all origins for development
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Initialize data generators
synthetic_generator = SyntheticDataGenerator()
static_loader = StaticDataLoader()

# API Models
class APIResponse(BaseModel):
    """Standard API response wrapper"""
    success: bool = True
    data: List[HealthDataPoint]
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())

class ErrorResponse(BaseModel):
    """Error response model"""
    success: bool = False
    error: str
    details: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())

# Health check endpoint
@app.get("/", response_model=Dict[str, Any])
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Outbreak Sentinel API",
        "version": "1.0.0",
        "status": "healthy",
        "endpoints": {
            "hospital": "/api/hospital",
            "pharmacy": "/api/pharmacy", 
            "trends": "/api/trends",
            "social": "/api/social"
        },
        "docs": "/docs",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "data_sources": {
            "synthetic_generator": "available",
            "static_loader": "available"
        }
    }

# Hospital OPD Data Endpoint
@app.get("/api/hospital", response_model=APIResponse)
async def get_hospital_data(
    days: int = Query(7, ge=1, le=90, description="Number of days of data to return"),
    cities: Optional[str] = Query(None, description="Comma-separated list of cities"),
    data_source: Literal["synthetic", "static"] = Query("synthetic", description="Data source type"),
    include_outbreak: bool = Query(True, description="Include outbreak patterns in synthetic data")
):
    """
    Get hospital OPD visit data
    Returns standardized health data points for hospital visits and cases
    """
    try:
        logger.info(f"Hospital data request: days={days}, cities={cities}, source={data_source}")
        
        # Parse cities filter
        city_filter = cities.split(",") if cities else None
        
        if data_source == "synthetic":
            data = synthetic_generator.generate_hospital_data(
                days=days,
                cities=city_filter,
                include_outbreak=include_outbreak
            )
        else:
            data = static_loader.load_hospital_data(
                days=days,
                cities=city_filter
            )
        
        return APIResponse(
            data=data,
            metadata={
                "source": data_source,
                "days_requested": days,
                "cities_filter": city_filter,
                "total_records": len(data),
                "include_outbreak": include_outbreak,
                "data_type": "hospital_opd"
            }
        )
        
    except Exception as e:
        logger.error(f"Error generating hospital data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Pharmacy Sales Data Endpoint
@app.get("/api/pharmacy", response_model=APIResponse)
async def get_pharmacy_data(
    days: int = Query(7, ge=1, le=90, description="Number of days of data to return"),
    cities: Optional[str] = Query(None, description="Comma-separated list of cities"),
    data_source: Literal["synthetic", "static"] = Query("synthetic", description="Data source type"),
    include_outbreak: bool = Query(True, description="Include outbreak patterns in synthetic data")
):
    """
    Get pharmacy sales data
    Returns standardized health data points for medicine sales
    """
    try:
        logger.info(f"Pharmacy data request: days={days}, cities={cities}, source={data_source}")
        
        # Parse cities filter
        city_filter = cities.split(",") if cities else None
        
        if data_source == "synthetic":
            data = synthetic_generator.generate_pharmacy_data(
                days=days,
                cities=city_filter,
                include_outbreak=include_outbreak
            )
        else:
            data = static_loader.load_pharmacy_data(
                days=days,
                cities=city_filter
            )
        
        return APIResponse(
            data=data,
            metadata={
                "source": data_source,
                "days_requested": days,
                "cities_filter": city_filter,
                "total_records": len(data),
                "include_outbreak": include_outbreak,
                "data_type": "pharmacy_sales"
            }
        )
        
    except Exception as e:
        logger.error(f"Error generating pharmacy data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Google Trends Data Endpoint
@app.get("/api/trends", response_model=APIResponse)
async def get_trends_data(
    days: int = Query(7, ge=1, le=90, description="Number of days of data to return"),
    states: Optional[str] = Query(None, description="Comma-separated list of states"),
    data_source: Literal["synthetic", "static", "live"] = Query("synthetic", description="Data source type"),
    keywords: Optional[str] = Query(None, description="Comma-separated keywords to filter")
):
    """
    Get Google Trends data
    Returns standardized health data points for search trends
    """
    try:
        logger.info(f"Trends data request: days={days}, states={states}, source={data_source}")
        
        # Parse filters
        state_filter = states.split(",") if states else None
        keyword_filter = keywords.split(",") if keywords else None
        
        if data_source == "synthetic":
            data = synthetic_generator.generate_trends_data(
                days=days,
                states=state_filter,
                keywords=keyword_filter
            )
        elif data_source == "live":
            # TODO: Integrate with actual Google Trends API
            # For now, return synthetic data with live flag
            data = synthetic_generator.generate_trends_data(
                days=days,
                states=state_filter,
                keywords=keyword_filter,
                simulate_live=True
            )
        else:
            data = static_loader.load_trends_data(
                days=days,
                states=state_filter
            )
        
        return APIResponse(
            data=data,
            metadata={
                "source": data_source,
                "days_requested": days,
                "states_filter": state_filter,
                "keywords_filter": keyword_filter,
                "total_records": len(data),
                "data_type": "search_trends"
            }
        )
        
    except Exception as e:
        logger.error(f"Error generating trends data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Social Media Data Endpoint
@app.get("/api/social", response_model=APIResponse)
async def get_social_data(
    days: int = Query(7, ge=1, le=90, description="Number of days of data to return"),
    states: Optional[str] = Query(None, description="Comma-separated list of states"),
    data_source: Literal["synthetic", "static", "live"] = Query("synthetic", description="Data source type"),
    platforms: Optional[str] = Query("twitter", description="Comma-separated platforms")
):
    """
    Get social media mentions data
    Returns standardized health data points for social media mentions
    """
    try:
        logger.info(f"Social data request: days={days}, states={states}, source={data_source}")
        
        # Parse filters
        state_filter = states.split(",") if states else None
        platform_filter = platforms.split(",") if platforms else ["twitter"]
        
        if data_source == "synthetic":
            data = synthetic_generator.generate_social_data(
                days=days,
                states=state_filter,
                platforms=platform_filter
            )
        elif data_source == "live":
            # TODO: Integrate with actual social media APIs
            # For now, return synthetic data with live flag
            data = synthetic_generator.generate_social_data(
                days=days,
                states=state_filter,
                platforms=platform_filter,
                simulate_live=True
            )
        else:
            data = static_loader.load_social_data(
                days=days,
                states=state_filter
            )
        
        return APIResponse(
            data=data,
            metadata={
                "source": data_source,
                "days_requested": days,
                "states_filter": state_filter,
                "platforms_filter": platform_filter,
                "total_records": len(data),
                "data_type": "social_mentions"
            }
        )
        
    except Exception as e:
        logger.error(f"Error generating social data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Unified data endpoint (for testing the merger)
@app.get("/api/unified", response_model=APIResponse)
async def get_unified_data(
    days: int = Query(7, ge=1, le=90, description="Number of days of data to return"),
    sources: str = Query("hospital,pharmacy,trends,social", description="Comma-separated data sources"),
    data_source: Literal["synthetic", "static"] = Query("synthetic", description="Data source type")
):
    """
    Get unified data from multiple sources
    Useful for testing the frontend merger logic
    """
    try:
        logger.info(f"Unified data request: days={days}, sources={sources}")
        
        source_list = sources.split(",")
        all_data = []
        
        for source in source_list:
            if source == "hospital":
                data = synthetic_generator.generate_hospital_data(days=days) if data_source == "synthetic" else static_loader.load_hospital_data(days=days)
            elif source == "pharmacy":
                data = synthetic_generator.generate_pharmacy_data(days=days) if data_source == "synthetic" else static_loader.load_pharmacy_data(days=days)
            elif source == "trends":
                data = synthetic_generator.generate_trends_data(days=days) if data_source == "synthetic" else static_loader.load_trends_data(days=days)
            elif source == "social":
                data = synthetic_generator.generate_social_data(days=days) if data_source == "synthetic" else static_loader.load_social_data(days=days)
            else:
                continue
                
            all_data.extend(data)
        
        return APIResponse(
            data=all_data,
            metadata={
                "source": data_source,
                "days_requested": days,
                "sources_requested": source_list,
                "total_records": len(all_data),
                "data_type": "unified_multi_source"
            }
        )
        
    except Exception as e:
        logger.error(f"Error generating unified data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content=ErrorResponse(
            error="Endpoint not found",
            details=f"The requested endpoint {request.url.path} was not found"
        ).dict()
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal server error",
            details="An unexpected error occurred while processing your request"
        ).dict()
    )

if __name__ == "__main__":
    # Run the server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
