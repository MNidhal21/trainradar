# TrainRadar 🚆📡

> **Real-Time Live Indian Railways Tracking System**  
> Interactive, high-performance geospatial radar tracking **5,200+ active trains**, **8,716 stations**, and nationwide rail corridors across India.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-mnidhal21.github.io%2Ftrainradar-22c55e?style=for-the-badge&logo=githubpages&logoColor=white)](https://mnidhal21.github.io/trainradar/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MapLibre GL](https://img.shields.io/badge/MapLibre%20GL-5-396B94?style=for-the-badge&logo=maplibre&logoColor=white)](https://maplibre.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

---

## 🌟 Overview

**TrainRadar** simulates and visualizes the world's most intricate and heavily trafficked railway network — the **Indian Railways (IR)**. Operating across 18 railway zones and thousands of route kilometers, this system renders active locomotives gliding in real time along actual physical tracks with live bearing, dynamic velocity, and historical route tracing.

🔗 **Live Application:** [https://mnidhal21.github.io/trainradar/](https://mnidhal21.github.io/trainradar/)

---

## ✨ Key Features

- **📡 5,200+ Active Trains Live Tracking:** Real-time movement simulation across Vande Bharat, Rajdhani, Shatabdi, Superfast, Express, and DEMU services.
- **📍 8,716 Railway Stations:** Complete pan-India station registry with interactive station code, name, division, state, and glowing node indicators.
- **🛤️ Nationwide Physical Rail Network:** Detailed railway tracks mapped with high-contrast vector lines, including the newly engineered **Kashmir Valley USBRL Link** (Srinagar, Banihal, and the Chenab Rail Bridge).
- **⚡ Electric Blue Trajectory Tracing:** Click on any train or search by name/number to highlight its exact path, origin-destination route, and traveled trail.
- **🔍 Glassmorphic Quick Search:** Instant auto-complete search across 5,000+ trains by train number (e.g., `12951`, `22436`) or name with one-click map focusing.
- **🇮🇳 India View Quick-Reset:** Single-click canvas re-centering to inspect the entire subcontinent network.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18 + TypeScript |
| **Build Tooling** | Vite 5 |
| **Geospatial & Vector Mapping** | MapLibre GL JS |
| **Styling & Design System** | Tailwind CSS + Lucide Icons + Glassmorphism UI |
| **Geospatial Processing** | Turf.js + Custom Bézier / Linear Track Interpolation Engine |
| **Deployment & CI/CD** | GitHub Pages via automated GitHub Actions |

---

## ☁️ Cloud Architecture & Scalability Blueprint

While currently running as an edge-delivered static application with optimized geospatial client-side interpolation, TrainRadar is designed to scale to millions of concurrent telemetry streams using modern cloud-native patterns:

1. **High-Velocity Telemetry Ingestion:** Ingest GPS and signalling feeds via **AWS IoT Core** or **Amazon Kinesis Data Streams**.
2. **Sub-millisecond Spatial Caching:** Low-latency storage of latest locomotive coordinates using **Amazon DynamoDB** with geospatial indexing.
3. **Push-Based Client Streaming:** Real-time location broadcasts to web and mobile clients via **AWS Lambda** and **Amazon API Gateway WebSockets**.
4. **Global Edge Delivery:** Low-latency caching of static map tiles and station GeoJSON payloads via **Amazon CloudFront** and **Amazon S3**.

---

## 🚀 Local Development Setup

To run TrainRadar locally on your machine:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MNidhal21/trainradar.git
   cd trainradar
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start local development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.