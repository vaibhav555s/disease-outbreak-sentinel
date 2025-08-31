#!/usr/bin/env python3
"""
Startup script for Outbreak Sentinel API Server
Provides easy configuration and startup options
"""

import os
import sys
import argparse
import uvicorn
import logging
from pathlib import Path

def setup_logging(log_level: str = "INFO"):
    """Configure logging for the server"""
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler('outbreak_sentinel_api.log')
        ]
    )

def main():
    parser = argparse.ArgumentParser(description="Outbreak Sentinel API Server")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind to")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload for development")
    parser.add_argument("--log-level", default="info", choices=["debug", "info", "warning", "error"])
    parser.add_argument("--data-dir", default="data", help="Directory for static data files")
    
    args = parser.parse_args()
    
    # Setup logging
    setup_logging(args.log_level)
    logger = logging.getLogger(__name__)
    
    # Ensure data directory exists
    data_dir = Path(args.data_dir)
    data_dir.mkdir(exist_ok=True)
    
    logger.info("="*60)
    logger.info("OUTBREAK SENTINEL API SERVER")
    logger.info("="*60)
    logger.info(f"Host: {args.host}")
    logger.info(f"Port: {args.port}")
    logger.info(f"Reload: {args.reload}")
    logger.info(f"Log Level: {args.log_level}")
    logger.info(f"Data Directory: {data_dir.absolute()}")
    logger.info("="*60)
    
    # Check for static data files
    static_files = ["hospital_data.json", "pharmacy_data.json", "trends_data.json", "social_data.json"]
    for filename in static_files:
        file_path = data_dir / filename
        if file_path.exists():
            logger.info(f"✓ Static data file found: {filename}")
        else:
            logger.warning(f"✗ Static data file missing: {filename} (will use synthetic data)")
    
    logger.info("="*60)
    logger.info("API Endpoints:")
    logger.info(f"  Health Check: http://{args.host}:{args.port}/health")
    logger.info(f"  Hospital Data: http://{args.host}:{args.port}/api/hospital")
    logger.info(f"  Pharmacy Data: http://{args.host}:{args.port}/api/pharmacy")
    logger.info(f"  Trends Data: http://{args.host}:{args.port}/api/trends")
    logger.info(f"  Social Data: http://{args.host}:{args.port}/api/social")
    logger.info(f"  Unified Data: http://{args.host}:{args.port}/api/unified")
    logger.info(f"  API Docs: http://{args.host}:{args.port}/docs")
    logger.info("="*60)
    
    try:
        # Start the server
        uvicorn.run(
            "main:app",
            host=args.host,
            port=args.port,
            reload=args.reload,
            log_level=args.log_level,
            access_log=True
        )
    except KeyboardInterrupt:
        logger.info("Server shutdown requested")
    except Exception as e:
        logger.error(f"Server startup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
