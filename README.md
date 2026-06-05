# ZiWei Analyzer 🌌

A premium, cross-platform astrology desktop (PC), mobile (Android), and web application built with **Tauri v2** and **Vue 3** (frontend), alongside a **C# .NET 10.0** Web API backend for secure web-deployed server integration. It calculates traditional Chinese **Zi Wei Dou Shu (Purple Star Astrology / 紫微斗数)** charts locally using the `iztro` library, manages user profiles in a database (SQLite or browser storage), and features an interactive **AI Astrologer Oracle** powered by OpenRouter.

> [!NOTE]
> This project is designed as a hybrid application. You can run it locally as a standalone desktop/mobile app via Tauri, or deploy it as a containerized web application using Docker Compose with a secure C# server-side AI proxy.
> Read the complete [Architecture Specification](file:///d:/workspace/my/ziwei/ziwei/docs/architecture-spec.md) for more details.

---

## 🚀 Key Features

*   **Responsive Astrolabe Visualization**:
    *   *PC View (Circular Grid)*: A traditional 4x4 circular grid mapping the 12 earthly branches clockwise around a merged 2x2 user details panel.
    *   *Mobile View (Card List)*: A sticky header for user details and a vertical scrolling list of expandable palace cards.
*   **San Fang Si Zheng Hover Highlights**: 
    *   Hovering/tapping any palace in the grid automatically highlights its opposite and trine palaces (*本宫及三方四正*) with glowing visual outlines while dimming unrelated palaces, emphasizing astrological connections.
*   **Decadal & Annual Horoscope Toggles**:
    *   Interactively switch between current decade (大限) and active age (流年) to overlay decadal elements and flying stars.
*   **Bilingual Translation Support**:
    *   Seamlessly toggle the UI, calculated stars, palace descriptions, and AI context prompts between **Chinese (中文)** and **English**.
*   **AI Astrologer Oracle**:
    *   Interactive chat interface with preset chips (*命宫格局分析*, *十年大限运势*, *感情婚姻*) providing real-time streaming analysis from OpenRouter models (like `deepseek/deepseek-v4-flash`).
*   **Hybrid Storage**:
    *   *Desktop Mode*: Secure storage in a local SQLite database compiled directly into the Tauri Rust backend.
    *   *Web Mode*: Fast profile archiving using the browser's native `localStorage`.

---

## 🛠️ Tech Stack

*   **Frontend**: Vue 3 (Composition API) + TypeScript + Custom Reactive Store + Tailwind CSS + Lucide Icons
*   **Astrology Calculations**: `iztro` (TypeScript library executed on the client side)
*   **Desktop Backend (Tauri)**: Rust (Tauri v2 Core) with SQLite (`rusqlite` crate with `bundled` feature)
*   **Web Backend (Docker)**: C# .NET 10.0 Web API with typed `HttpClient` OpenRouter integration, supporting Server-Sent Events (SSE) streaming
*   **Deployment**: Nginx alpine reverse proxy + Docker Compose

---

## 💻 Running the Project

### Option A: Desktop Mode (Tauri)

#### Prerequisites
*   Node.js (v18+)
*   pnpm (v8+)
*   Rust (v1.75+) and build tools (C++ build tools on Windows)

#### 1. Install Dependencies
Run `pnpm install` in the [ziwei](file:///d:/workspace/my/ziwei/ziwei) directory:
```bash
cd ziwei
pnpm install
```

#### 2. Launch Development Mode
Run the Tauri development server from the [ziwei](file:///d:/workspace/my/ziwei/ziwei) directory:
```bash
pnpm tauri dev
```

#### 3. Build Production Bundles
Build release bundles for your host platform from the [ziwei](file:///d:/workspace/my/ziwei/ziwei) directory:
```bash
pnpm tauri build
```

---

### Option B: Web Mode (Docker Compose)

#### Prerequisites
*   Docker
*   Docker Compose

#### 1. Configure Environment Variables
Copy the [.env.example](file:///d:/workspace/my/ziwei/.env.example) to `.env` in the project root:
```bash
cp .env.example .env
```
Open `.env` and fill in your OpenRouter API Key:
```env
OPENROUTER_API_KEY=your_actual_openrouter_api_key
OPENROUTER_DEFAULT_MODEL=deepseek/deepseek-v4-flash
```

#### 2. Start the Application
Run the following command in the project root:
```bash
docker-compose up --build
```
This starts three services defined in [docker-compose.yml](file:///d:/workspace/my/ziwei/docker-compose.yml):
*   **frontend**: A Vue 3 static application compiled and served via Nginx on port 80.
*   **backend**: A C# ASP.NET Core API server exposing API endpoints on port 5074.
*   **proxy**: Nginx Alpine reverse-proxy listening on port `8080`, routing traffic to the frontend and reverse-proxying `/api/` to the backend.

#### 3. Open Web Client
Access the web client at:
```
http://localhost:8080
```

---

## ⚙️ AI Configuration

*   **Desktop Mode (Tauri)**:
    1. Click the **Settings** button in the app header.
    2. Enter your **OpenRouter API Key** and choose your preferred LLM.
    *Your API key is stored locally in a settings JSON file on your machine and never leaves your device except via secure Rust HTTPS requests directly to OpenRouter.*
*   **Web Mode (Docker)**:
    *   The API Key is securely held on the server side via the `OPENROUTER_API_KEY` environment variable in the C# backend.
    *   The frontend automatically streams chat requests via the backend proxy without requiring users to input API keys.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](file:///d:/workspace/my/ziwei/LICENSE) file for details.
