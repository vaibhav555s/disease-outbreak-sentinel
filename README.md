# Agentic AI for Smart Health Surveillance

A sophisticated React-based web application that implements an Agentic AI system for early disease outbreak detection in India. The system uses multiple AI agents to analyze pharmacy sales, hospital records, Google Trends, and social media data to predict disease outbreaks before they spread.

## 🎯 Project Overview

This system monitors 6 target cities (Mumbai, Delhi, Pune, Bengaluru, Chennai, Kolkata) for 6 key diseases/signals (fever, cough, diarrhea, dengue, malaria, flu) using a multi-agent AI architecture.

## Project info

**URL**: https://lovable.dev/projects/87aebf18-8a09-41e1-8ecd-9614340abe95

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/87aebf18-8a09-41e1-8ecd-9614340abe95) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

## 🚀 Key Features

### 🤖 Multi-Agent AI Architecture
- **Data Collector Agent**: Fetches pharmacy sales, hospital records & social signals
- **Cleaner & Normalizer Agent**: Standardizes time-series data and removes outliers
- **Trend Detector Agent**: Analyzes statistical patterns and anomalies
- **Predictor Agent**: Runs ML forecasts and risk correlation
- **Alert Generator Agent**: Produces early warning signals with confidence scores

### 📊 Three Operational Modes
- **Simulated**: All synthetic data with realistic outbreak patterns
- **Live**: Only live Google Trends & Social Media data
- **Mixed**: Simulated clinical + Live trends/social (**Recommended for demos**)

### 🗺️ Interactive Dashboard
- Real-time India map with disease hotspots
- Multi-source trend visualization
- Smart alert system with explainable AI
- Agent status monitoring
- Confidence scoring and risk assessment

### 🧪 Data Simulation Lab
- Generate realistic synthetic hospital and pharmacy datasets
- Built-in outbreak patterns (days 10-15)
- CSV export functionality
- Supports all 6 target cities and diseases
- Perfect for testing anomaly detection algorithms

## 🛠️ Technologies Used

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **Data Visualization**: Recharts
- **State Management**: TanStack Query
- **Routing**: React Router
- **Styling**: Tailwind CSS with custom health theme

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/87aebf18-8a09-41e1-8ecd-9614340abe95) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## 🧪 Data Simulation Lab

### Overview
The Data Simulation Lab allows you to generate realistic synthetic datasets for testing and development. Access it via the "Data Lab" button in the main dashboard header.

### Features
- **Hospital Data Generation**: Patient records with symptoms, diagnosis, demographics
- **Pharmacy Data Generation**: Medicine sales with categories and quantities
- **Outbreak Simulation**: Built-in outbreak patterns on days 10-15
- **Multi-City Support**: Generate data for all 6 target cities
- **CSV Export**: Automatic download of generated datasets

### Dataset Structure

#### Hospital Data
```csv
date,patient_id,symptoms,diagnosis,age,gender,city,state
2024-01-20,P20240120001,"fever;headache",Fever,34,Male,Mumbai,Maharashtra
```

#### Pharmacy Data
```csv
date,medicine_name,category,quantity_sold,city,state
2024-01-20,paracetamol,fever_medicine,45,Mumbai,Maharashtra
```

### Usage Instructions

1. **Navigate to Data Lab**: Click "Data Lab" button in the main dashboard
2. **Configure Generation**:
   - Select target city or choose "All Cities"
   - Set number of days (7-90, default: 30)
3. **Generate Data**: Click generate button
4. **Download**: CSV files automatically download to your device

### Outbreak Patterns
- **Days 1-9**: Normal baseline rates
- **Days 10-15**: Outbreak simulation (2-8x increase in cases)
- **Days 16+**: Return to baseline with some residual effects

### Disease Base Rates
- Fever: 30% base rate
- Cough: 25% base rate
- Flu: 20% base rate
- Diarrhea: 15% base rate
- Malaria: 8% base rate
- Dengue: 5% base rate

### Integration with Dashboard
When in **Simulated** or **Mixed** mode, the dashboard automatically uses generated synthetic data that follows the same patterns as the Data Lab, ensuring consistency across the application.

## 🔗 **Data Integration Hub**

### Overview
The Data Integration Hub provides advanced multi-source data fusion capabilities, combining simulated clinical data with live Google Trends and social media streams in real-time.

### Key Features

#### **🎯 Standardized Data Schema**
All data sources are transformed to a unified format:
```typescript
interface HealthDataPoint {
  timestamp: string;    // ISO 8601 format
  location: string;     // City or region
  disease: string;      // Disease type (fever, dengue, etc.)
  source: 'hospital' | 'pharmacy' | 'trends' | 'social';
  value: number;        // Normalized value (0-100)
  metadata?: {          // Additional source-specific data
    confidence?: number;
    rawValue?: number;
    unit?: string;
  };
}
```

#### **⚡ Real-time Data Merging**
- **Deduplication**: Automatic merging based on `timestamp + location + disease`
- **Weighted Averaging**: Configurable source weights for intelligent fusion
- **Conflict Resolution**: Smart handling of overlapping data points

#### **🔧 Three Operational Modes**

**1. Simulated Mode**
- All data sources use realistic synthetic data
- Perfect for development and testing
- Includes built-in outbreak patterns

**2. Live Mode**
- Only Google Trends and Social Media data
- Real-time API connections
- Clinical charts hidden/greyed out

**3. Mixed Mode** *(Recommended)*
- Simulated clinical data + Live trends/social
- Best of both worlds for demos
- Full dashboard functionality

#### **📊 Advanced Configuration**
- **Source Weights**: Hospital (35%), Pharmacy (40%), Trends (15%), Social (10%)
- **Refresh Intervals**: Configurable per source (30s-60s)
- **Real-time Updates**: Automatic data streaming with error handling
- **Filter & Search**: Advanced filtering by location, disease, source, date range

### Usage
Navigate to `/data-integration` or click "Integration Hub" in the main dashboard for the complete multi-source data fusion experience.

The Integration Hub provides a production-ready foundation for multi-source health data fusion with enterprise-grade reliability and performance!
