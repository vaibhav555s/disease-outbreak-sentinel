"""
Data Generators for Outbreak Sentinel API
Provides synthetic and static data generation for all health data sources
"""

import json
import random
import math
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# Data Models
class HealthDataPoint(BaseModel):
    """Standardized health data point schema"""
    timestamp: str = Field(..., description="ISO 8601 timestamp")
    location: str = Field(..., description="City or region")
    disease: str = Field(..., description="Disease or symptom type")
    source: Literal["hospital", "pharmacy", "trends", "social"] = Field(..., description="Data source")
    value: float = Field(..., ge=0, le=100, description="Normalized value (0-100)")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional source-specific data")

DataSourceType = Literal["hospital", "pharmacy", "trends", "social"]

# Configuration
TARGET_CITIES = ["Mumbai", "Delhi", "Pune", "Bengaluru", "Chennai", "Kolkata"]
TARGET_STATES = ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "West Bengal"]
TARGET_DISEASES = ["fever", "cough", "diarrhea", "dengue", "malaria", "flu"]

DISEASE_PATTERNS = {
    "fever": {
        "base_rate": 0.30,
        "seasonal_peak": 6,  # June (monsoon)
        "outbreak_multiplier": 2.5,
        "medicines": ["paracetamol", "ibuprofen", "aspirin"],
        "search_terms": ["fever", "high temperature", "body ache"],
        "social_keywords": ["fever", "sick", "temperature", "unwell"]
    },
    "dengue": {
        "base_rate": 0.05,
        "seasonal_peak": 8,  # August (post-monsoon)
        "outbreak_multiplier": 4.0,
        "medicines": ["paracetamol", "oral_rehydration", "platelet_booster"],
        "search_terms": ["dengue", "dengue fever", "mosquito fever"],
        "social_keywords": ["dengue", "mosquito", "fever", "platelet"]
    },
    "malaria": {
        "base_rate": 0.08,
        "seasonal_peak": 7,  # July (monsoon)
        "outbreak_multiplier": 3.5,
        "medicines": ["chloroquine", "artemether", "doxycycline"],
        "search_terms": ["malaria", "malaria symptoms", "chills fever"],
        "social_keywords": ["malaria", "chills", "mosquito", "fever"]
    },
    "flu": {
        "base_rate": 0.20,
        "seasonal_peak": 12,  # December (winter)
        "outbreak_multiplier": 2.0,
        "medicines": ["oseltamivir", "paracetamol", "cough_syrup"],
        "search_terms": ["flu", "influenza", "cold symptoms"],
        "social_keywords": ["flu", "cold", "cough", "runny nose"]
    },
    "cough": {
        "base_rate": 0.25,
        "seasonal_peak": 11,  # November (winter onset)
        "outbreak_multiplier": 1.8,
        "medicines": ["cough_syrup", "lozenges", "expectorant"],
        "search_terms": ["cough", "dry cough", "cough medicine"],
        "social_keywords": ["cough", "throat", "chest congestion"]
    },
    "diarrhea": {
        "base_rate": 0.15,
        "seasonal_peak": 5,  # May (summer)
        "outbreak_multiplier": 3.0,
        "medicines": ["oral_rehydration", "loperamide", "zinc_tablets"],
        "search_terms": ["diarrhea", "stomach upset", "loose motions"],
        "social_keywords": ["diarrhea", "stomach", "upset", "loose motions"]
    }
}

class SyntheticDataGenerator:
    """Generates realistic synthetic health data with outbreak patterns"""
    
    def __init__(self):
        self.random = random.Random(42)  # Consistent seed for reproducible data
    
    def _get_seasonal_multiplier(self, day_of_year: int, disease: str) -> float:
        """Calculate seasonal multiplier for disease prevalence"""
        pattern = DISEASE_PATTERNS.get(disease, DISEASE_PATTERNS["fever"])
        peak_day = pattern["seasonal_peak"] * 30  # Convert month to day of year
        
        # Sinusoidal pattern with peak at specified month
        seasonal_factor = 1 + 0.5 * math.sin(2 * math.pi * (day_of_year - peak_day) / 365)
        return max(0.5, seasonal_factor)  # Minimum 50% of base rate
    
    def _get_outbreak_multiplier(self, day_index: int, total_days: int) -> float:
        """Calculate outbreak multiplier (spike in middle of time range)"""
        outbreak_start = total_days * 0.4  # Start at 40% through period
        outbreak_end = total_days * 0.7    # End at 70% through period
        
        if outbreak_start <= day_index <= outbreak_end:
            # Gaussian-like spike during outbreak period
            outbreak_center = (outbreak_start + outbreak_end) / 2
            distance_from_center = abs(day_index - outbreak_center)
            max_distance = (outbreak_end - outbreak_start) / 2
            spike_intensity = math.exp(-2 * (distance_from_center / max_distance) ** 2)
            return 1 + 2 * spike_intensity  # Up to 3x multiplier at peak
        
        return 1.0
    
    def _normalize_value(self, raw_value: float, source: str) -> float:
        """Normalize raw values to 0-100 scale based on source type"""
        if source == "hospital":
            # Hospital visits: 0-200 visits/day -> 0-100
            return min(100, (raw_value / 200) * 100)
        elif source == "pharmacy":
            # Pharmacy sales: 0-500 units/day -> 0-100
            return min(100, (raw_value / 500) * 100)
        elif source == "trends":
            # Google Trends: already 0-100
            return min(100, max(0, raw_value))
        elif source == "social":
            # Social mentions: 0-50 mentions/day -> 0-100
            return min(100, (raw_value / 50) * 100)
        else:
            return min(100, max(0, raw_value))
    
    def generate_hospital_data(
        self, 
        days: int = 7, 
        cities: Optional[List[str]] = None,
        include_outbreak: bool = True
    ) -> List[HealthDataPoint]:
        """Generate synthetic hospital OPD visit data"""
        
        cities = cities or TARGET_CITIES
        data_points = []
        
        for day_index in range(days):
            date = datetime.now() - timedelta(days=days-1-day_index)
            day_of_year = date.timetuple().tm_yday
            
            for city in cities:
                for disease in TARGET_DISEASES:
                    pattern = DISEASE_PATTERNS[disease]
                    
                    # Calculate multipliers
                    seasonal_mult = self._get_seasonal_multiplier(day_of_year, disease)
                    outbreak_mult = self._get_outbreak_multiplier(day_index, days) if include_outbreak else 1.0
                    
                    # Base visits per day for this disease in this city
                    base_visits = 20 + self.random.randint(0, 30)  # 20-50 base visits
                    raw_visits = base_visits * pattern["base_rate"] * seasonal_mult * outbreak_mult
                    
                    # Add some random noise
                    raw_visits *= (0.8 + self.random.random() * 0.4)  # ±20% noise
                    
                    normalized_value = self._normalize_value(raw_visits, "hospital")
                    
                    data_points.append(HealthDataPoint(
                        timestamp=date.isoformat(),
                        location=city,
                        disease=disease,
                        source="hospital",
                        value=round(normalized_value, 2),
                        metadata={
                            "raw_value": round(raw_visits, 1),
                            "unit": "visits",
                            "hospital_id": f"H{hash(city) % 1000:03d}",
                            "seasonal_multiplier": round(seasonal_mult, 2),
                            "outbreak_multiplier": round(outbreak_mult, 2)
                        }
                    ))
        
        return data_points
    
    def generate_pharmacy_data(
        self, 
        days: int = 7, 
        cities: Optional[List[str]] = None,
        include_outbreak: bool = True
    ) -> List[HealthDataPoint]:
        """Generate synthetic pharmacy sales data"""
        
        cities = cities or TARGET_CITIES
        data_points = []
        
        for day_index in range(days):
            date = datetime.now() - timedelta(days=days-1-day_index)
            day_of_year = date.timetuple().tm_yday
            
            for city in cities:
                for disease in TARGET_DISEASES:
                    pattern = DISEASE_PATTERNS[disease]
                    
                    # Calculate multipliers
                    seasonal_mult = self._get_seasonal_multiplier(day_of_year, disease)
                    outbreak_mult = self._get_outbreak_multiplier(day_index, days) if include_outbreak else 1.0
                    
                    # Generate sales for each medicine in this disease category
                    for medicine in pattern["medicines"]:
                        base_sales = 30 + self.random.randint(0, 40)  # 30-70 base sales
                        raw_sales = base_sales * pattern["base_rate"] * seasonal_mult * outbreak_mult
                        
                        # Add random noise
                        raw_sales *= (0.7 + self.random.random() * 0.6)  # ±30% noise
                        
                        normalized_value = self._normalize_value(raw_sales, "pharmacy")
                        
                        data_points.append(HealthDataPoint(
                            timestamp=date.isoformat(),
                            location=city,
                            disease=disease,
                            source="pharmacy",
                            value=round(normalized_value, 2),
                            metadata={
                                "raw_value": round(raw_sales, 1),
                                "unit": "units_sold",
                                "medicine": medicine,
                                "pharmacy_id": f"P{hash(city + medicine) % 1000:03d}",
                                "seasonal_multiplier": round(seasonal_mult, 2),
                                "outbreak_multiplier": round(outbreak_mult, 2)
                            }
                        ))
        
        return data_points

    def generate_trends_data(
        self,
        days: int = 7,
        states: Optional[List[str]] = None,
        keywords: Optional[List[str]] = None,
        simulate_live: bool = False
    ) -> List[HealthDataPoint]:
        """Generate synthetic Google Trends data"""

        states = states or TARGET_STATES
        data_points = []

        for day_index in range(days):
            date = datetime.now() - timedelta(days=days-1-day_index)
            day_of_year = date.timetuple().tm_yday

            for state in states:
                for disease in TARGET_DISEASES:
                    pattern = DISEASE_PATTERNS[disease]

                    # Calculate multipliers
                    seasonal_mult = self._get_seasonal_multiplier(day_of_year, disease)
                    outbreak_mult = self._get_outbreak_multiplier(day_index, days)

                    # Generate search interest for each search term
                    for search_term in pattern["search_terms"]:
                        # Base search interest (Google Trends scale 0-100)
                        base_interest = 10 + self.random.randint(0, 20)  # 10-30 base interest
                        raw_interest = base_interest * seasonal_mult * outbreak_mult

                        # Add random noise and daily variation
                        daily_variation = 0.8 + self.random.random() * 0.4  # ±20% daily variation
                        raw_interest *= daily_variation

                        # Simulate live data with more recent bias
                        if simulate_live:
                            recency_boost = 1 + (day_index / days) * 0.3  # More recent = higher
                            raw_interest *= recency_boost

                        normalized_value = self._normalize_value(raw_interest, "trends")

                        data_points.append(HealthDataPoint(
                            timestamp=date.isoformat(),
                            location=state,
                            disease=disease,
                            source="trends",
                            value=round(normalized_value, 2),
                            metadata={
                                "raw_value": round(raw_interest, 1),
                                "unit": "search_interest",
                                "search_term": search_term,
                                "region": state,
                                "seasonal_multiplier": round(seasonal_mult, 2),
                                "outbreak_multiplier": round(outbreak_mult, 2),
                                "is_live": simulate_live
                            }
                        ))

        return data_points

    def generate_social_data(
        self,
        days: int = 7,
        states: Optional[List[str]] = None,
        platforms: Optional[List[str]] = None,
        simulate_live: bool = False
    ) -> List[HealthDataPoint]:
        """Generate synthetic social media mentions data"""

        states = states or TARGET_STATES
        platforms = platforms or ["twitter"]
        data_points = []

        for day_index in range(days):
            date = datetime.now() - timedelta(days=days-1-day_index)
            day_of_year = date.timetuple().tm_yday

            for state in states:
                for disease in TARGET_DISEASES:
                    pattern = DISEASE_PATTERNS[disease]

                    # Calculate multipliers
                    seasonal_mult = self._get_seasonal_multiplier(day_of_year, disease)
                    outbreak_mult = self._get_outbreak_multiplier(day_index, days)

                    for platform in platforms:
                        # Generate mentions for each keyword
                        for keyword in pattern["social_keywords"]:
                            # Base mentions per day
                            base_mentions = 2 + self.random.randint(0, 8)  # 2-10 base mentions
                            raw_mentions = base_mentions * pattern["base_rate"] * seasonal_mult * outbreak_mult

                            # Add random noise and platform-specific multipliers
                            platform_mult = {"twitter": 1.0, "facebook": 0.7, "instagram": 0.3}.get(platform, 1.0)
                            raw_mentions *= platform_mult

                            # Daily variation
                            daily_variation = 0.6 + self.random.random() * 0.8  # ±40% daily variation
                            raw_mentions *= daily_variation

                            # Simulate live data with recency bias
                            if simulate_live:
                                recency_boost = 1 + (day_index / days) * 0.5  # More recent = higher
                                raw_mentions *= recency_boost

                            normalized_value = self._normalize_value(raw_mentions, "social")

                            data_points.append(HealthDataPoint(
                                timestamp=date.isoformat(),
                                location=state,
                                disease=disease,
                                source="social",
                                value=round(normalized_value, 2),
                                metadata={
                                    "raw_value": round(raw_mentions, 1),
                                    "unit": "mentions",
                                    "keyword": keyword,
                                    "platform": platform,
                                    "region": state,
                                    "seasonal_multiplier": round(seasonal_mult, 2),
                                    "outbreak_multiplier": round(outbreak_mult, 2),
                                    "is_live": simulate_live
                                }
                            ))

        return data_points


class StaticDataLoader:
    """Loads data from static JSON/CSV files in /data/ folder"""

    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        logger.info(f"Static data loader initialized with directory: {self.data_dir}")

    def _parse_timestamp(self, timestamp_str: str) -> datetime:
        """Parse timestamp string to datetime object, handling timezone issues"""
        try:
            # Handle ISO format with Z suffix
            if timestamp_str.endswith('Z'):
                timestamp_str = timestamp_str[:-1] + '+00:00'

            # Parse and convert to naive datetime for comparison
            dt = datetime.fromisoformat(timestamp_str)
            if dt.tzinfo is not None:
                # Convert to naive datetime (remove timezone info)
                dt = dt.replace(tzinfo=None)

            return dt
        except Exception as e:
            logger.warning(f"Failed to parse timestamp '{timestamp_str}': {e}")
            # Return current time as fallback
            return datetime.now()

    def _load_json_file(self, filename: str) -> List[Dict[str, Any]]:
        """Load data from JSON file"""
        file_path = self.data_dir / filename

        if not file_path.exists():
            logger.warning(f"Static data file not found: {file_path}")
            return []

        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
                return data if isinstance(data, list) else [data]
        except Exception as e:
            logger.error(f"Error loading {filename}: {e}")
            return []

    def _transform_static_to_standard(
        self,
        raw_data: List[Dict[str, Any]],
        source: DataSourceType
    ) -> List[HealthDataPoint]:
        """Transform static data to standardized schema"""
        data_points = []

        for item in raw_data:
            try:
                # Extract common fields with fallbacks
                timestamp = item.get('timestamp') or item.get('date') or datetime.now().isoformat()
                location = item.get('location') or item.get('city') or item.get('region') or "Unknown"
                disease = item.get('disease') or item.get('symptom') or item.get('condition') or "unknown"

                # Extract value based on source type
                if source == "hospital":
                    value = item.get('visits') or item.get('cases') or item.get('value') or 0
                elif source == "pharmacy":
                    value = item.get('sales') or item.get('quantity') or item.get('value') or 0
                elif source == "trends":
                    value = item.get('interest') or item.get('index') or item.get('value') or 0
                elif source == "social":
                    value = item.get('mentions') or item.get('count') or item.get('value') or 0
                else:
                    value = item.get('value') or 0

                # Normalize value
                normalized_value = min(100, max(0, float(value)))

                # Preserve original metadata
                metadata = {k: v for k, v in item.items() if k not in ['timestamp', 'location', 'disease', 'value']}
                metadata['source_file'] = True

                data_points.append(HealthDataPoint(
                    timestamp=timestamp,
                    location=location,
                    disease=disease,
                    source=source,
                    value=normalized_value,
                    metadata=metadata
                ))

            except Exception as e:
                logger.warning(f"Error transforming static data item: {e}")
                continue

        return data_points

    def load_hospital_data(self, days: int = 7, cities: Optional[List[str]] = None) -> List[HealthDataPoint]:
        """Load hospital data from static files"""
        raw_data = self._load_json_file("hospital_data.json")
        transformed = self._transform_static_to_standard(raw_data, "hospital")

        # Apply filters
        if cities:
            transformed = [d for d in transformed if d.location in cities]

        # Filter by days (keep most recent)
        cutoff_date = datetime.now() - timedelta(days=days)
        transformed = [d for d in transformed if self._parse_timestamp(d.timestamp) >= cutoff_date]

        return transformed

    def load_pharmacy_data(self, days: int = 7, cities: Optional[List[str]] = None) -> List[HealthDataPoint]:
        """Load pharmacy data from static files"""
        raw_data = self._load_json_file("pharmacy_data.json")
        transformed = self._transform_static_to_standard(raw_data, "pharmacy")

        # Apply filters
        if cities:
            transformed = [d for d in transformed if d.location in cities]

        # Filter by days
        cutoff_date = datetime.now() - timedelta(days=days)
        transformed = [d for d in transformed if self._parse_timestamp(d.timestamp) >= cutoff_date]

        return transformed

    def load_trends_data(self, days: int = 7, states: Optional[List[str]] = None) -> List[HealthDataPoint]:
        """Load trends data from static files"""
        raw_data = self._load_json_file("trends_data.json")
        transformed = self._transform_static_to_standard(raw_data, "trends")

        # Apply filters
        if states:
            transformed = [d for d in transformed if d.location in states]

        # Filter by days
        cutoff_date = datetime.now() - timedelta(days=days)
        transformed = [d for d in transformed if self._parse_timestamp(d.timestamp) >= cutoff_date]

        return transformed

    def load_social_data(self, days: int = 7, states: Optional[List[str]] = None) -> List[HealthDataPoint]:
        """Load social data from static files"""
        raw_data = self._load_json_file("social_data.json")
        transformed = self._transform_static_to_standard(raw_data, "social")

        # Apply filters
        if states:
            transformed = [d for d in transformed if d.location in states]

        # Filter by days
        cutoff_date = datetime.now() - timedelta(days=days)
        transformed = [d for d in transformed if self._parse_timestamp(d.timestamp) >= cutoff_date]

        return transformed

    def generate_trends_data(
        self,
        days: int = 7,
        states: Optional[List[str]] = None,
        keywords: Optional[List[str]] = None,
        simulate_live: bool = False
    ) -> List[HealthDataPoint]:
        """Generate synthetic Google Trends data"""

        states = states or TARGET_STATES
        data_points = []

        for day_index in range(days):
            date = datetime.now() - timedelta(days=days-1-day_index)
            day_of_year = date.timetuple().tm_yday

            for state in states:
                for disease in TARGET_DISEASES:
                    pattern = DISEASE_PATTERNS[disease]

                    # Calculate multipliers
                    seasonal_mult = self._get_seasonal_multiplier(day_of_year, disease)
                    outbreak_mult = self._get_outbreak_multiplier(day_index, days)

                    # Generate search interest for each search term
                    for search_term in pattern["search_terms"]:
                        # Base search interest (Google Trends scale 0-100)
                        base_interest = 10 + self.random.randint(0, 20)  # 10-30 base interest
                        raw_interest = base_interest * seasonal_mult * outbreak_mult

                        # Add random noise and daily variation
                        daily_variation = 0.8 + self.random.random() * 0.4  # ±20% daily variation
                        raw_interest *= daily_variation

                        # Simulate live data with more recent bias
                        if simulate_live:
                            recency_boost = 1 + (day_index / days) * 0.3  # More recent = higher
                            raw_interest *= recency_boost

                        normalized_value = self._normalize_value(raw_interest, "trends")

                        data_points.append(HealthDataPoint(
                            timestamp=date.isoformat(),
                            location=state,
                            disease=disease,
                            source="trends",
                            value=round(normalized_value, 2),
                            metadata={
                                "raw_value": round(raw_interest, 1),
                                "unit": "search_interest",
                                "search_term": search_term,
                                "region": state,
                                "seasonal_multiplier": round(seasonal_mult, 2),
                                "outbreak_multiplier": round(outbreak_mult, 2),
                                "is_live": simulate_live
                            }
                        ))

        return data_points
