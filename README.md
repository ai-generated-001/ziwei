# ZiWei Analyzer 🌌

A premium, cross-platform astrology desktop (PC) and mobile (Android) application built with **Tauri v2**, **Vue 3**, and **Tailwind CSS**. It calculates traditional Chinese **Zi Wei Dou Shu (Purple Star Astrology / 紫微斗数)** charts locally using the `iztro` library, manages user profiles in an archived SQLite database, and features an interactive **AI Astrologer Oracle** powered by OpenRouter.

---

## 🚀 Key Features

*   **Responsive Astrolabe Visualization**:
    *   *PC View (Circular Grid)*: A traditional 4x4 circular grid mapping the 12 earthly branches clockwise around a merged 2x2 user details panel.
    *   *Mobile View (Card List)*: A sticky header for user details and a vertical scrolling list of expandable palace cards.
*   **San Fang Si Zheng Hover Highlights**: 
    *   Hovering over any palace in the PC grid automatically highlights its opposite and trine palaces (*本宫及三方四正*) with glowing visual outlines while dimming unrelated palaces, emphasizing astrological connections.
*   **SQLite Database Archiving**: 
    *   Profiles are stored securely in a local SQLite database compiled directly into the Tauri Rust backend.
*   **Bilingual Translation Support**:
    *   Seamlessly toggle the UI, calculated stars, palace descriptions, and AI context prompts between **Chinese (中文)** and **English**.
*   **AI Astrologer Oracle**:
    *   Interactive chat interface with preset chips (*命宫格局分析*, *十年大限运势*, *感情婚姻*) providing real-time streaming analysis from OpenRouter models (like Gemini 2.5).

---

## 🛠️ Tech Stack

*   **Frontend**: Vue 3 (Composition API) + Tailwind CSS + Lucide Icons
*   **Backend**: Rust (Tauri v2 Core)
*   **Database**: SQLite (`rusqlite` crate with `bundled` feature)
*   **Astrology Calculations**: `iztro` (TypeScript library)
*   **AI Integration**: OpenRouter HTTP client with SSE parsing

---

## 💻 Running the Project

### Prerequisites
*   Node.js (v18+)
*   pnpm (v8+)
*   Rust (v1.75+) and build tools (C++ build tools on Windows)

### 1. Install Dependencies
Run `pnpm install` in the project root directory:
```bash
pnpm install
```

### 2. Launch Development Mode
Run the Tauri development server:
```bash
pnpm tauri dev
```

### 3. Build Production Bundles
Build release bundles for your host platform:
```bash
pnpm tauri build
```

---

## ⚙️ AI Configuration

Click the **Settings** button in the app header to:
1.  Enter your **OpenRouter API Key**.
2.  Choose your preferred LLM (default is `google/gemini-2.5-flash`).

*Your API key is stored securely in a local settings JSON file on your machine and never leaves your device except via secure Rust HTTPS requests to OpenRouter.*

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](file:///d:/workspace/my/ziwei/LICENSE) file for details.
