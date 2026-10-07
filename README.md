# TrainRadar

> **Real-Time Live Indian Railways Tracking System**  
> Interactive, high-performance geospatial radar tracking thousands of active trains, the full national station network, and nationwide rail corridors across India.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-mnidhal21.github.io%2Ftrainradar-22c55e?style=for-the-badge&logo=githubpages&logoColor=white)](https://mnidhal21.github.io/trainradar/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MapLibre GL](https://img.shields.io/badge/MapLibre%20GL-5-396B94?style=for-the-badge&logo=maplibre&logoColor=white)](https://maplibre.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

---

## Overview

**TrainRadar** visualizes the intricate rail network of the **Indian Railways (IR)**. Operating across railway zones and nationwide route corridors, this system renders active locomotives moving along physical tracks with live bearing, dynamic velocity, and historical route tracing.

- **Live Application:** [https://mnidhal21.github.io/trainradar/](https://mnidhal21.github.io/trainradar/)

---

## Key Features

- **Thousands of Active Trains Live Tracking:** Movement visualization across Vande Bharat, Rajdhani, Shatabdi, Superfast, Express, and local services.
- **Full National Station Network:** Interactive stations with station code, name, and glowing node indicators.
- **Nationwide Rail Network:** Detailed railway tracks mapped with high-contrast vector lines.
- **Electric Blue Trajectory Tracing:** Select any train or search by name/number to highlight its active path, origin-destination route, and traveled trail.
- **Glassmorphic Quick Search:** Instant auto-complete search across active trains by number or name with one-click map focusing.
- **India View Quick-Reset:** Single-click canvas re-centering to inspect the entire nationwide network.

---

## Architecture & Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18 + TypeScript |
| **Build Tooling** | Vite 6 |
| **Geospatial & Vector Mapping** | MapLibre GL JS |
| **Icons** | Lucide React |
| **Data & State Management** | Supabase JS Client |
| **Deployment & CI/CD** | GitHub Pages via automated GitHub Actions |

---

## Local Development Setup

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

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.