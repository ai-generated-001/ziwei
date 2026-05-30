# Architecture & Implementation Specification: ZiWei Analyzer

## 1. Project Overview
A cross-platform desktop (PC) and mobile (Android) application built with **Tauri v2**. The application performs "Zi Wei Dou Shu" (Purple Star Astrology) calculations using the `iztro` library, manages user profiles, visualizes the astrological chart (responsively adapting to PC/Mobile), and provides an interactive AI interpretation engine powered by OpenRouter.

## 2. Tech Stack & Scaffolding Guidelines
* **Frontend**: Vue 3 (TypeScript) + Tailwind CSS + Lucide Icons.
* **Backend**: Rust (Tauri v2 Core).
* **Astrology Engine**: `iztro` (TypeScript library, executed in the frontend).
* **Database**: SQLite (built-in Rust `rusqlite` database layer accessed via Tauri commands).
* **State Management**: Custom lightweight reactive Vue store (`useStore.ts`).

## 3. Architecture & Security Design
**Rule:** The frontend MUST NOT hold any sensitive API keys or make direct network requests to OpenRouter. 

* **API Key Management**: 
    * Users will input their OpenRouter API Key in a "Settings" modal.
    * The frontend will pass this key to the Rust backend via Tauri `invoke`.
    * Rust will securely store the key locally in a `settings.json` file within the application's configuration directory.
* **AI Network Requests**:
    * Frontend constructs the prompt and calls a Tauri Rust command (e.g., `invoke("ask_ai", { prompt, context })`).
    * Rust backend constructs the HTTP request, attaches the securely stored API key, calls the OpenRouter API, and streams the response back to the frontend using Tauri Events (`emit`).

## 4. State & Profile Management (The Archive)
To handle the discrepancy between PC and Android file systems, rely on Tauri's official plugins to abstract the pathing.

* **Data Schema (SQLite)**:
    * `Profiles`: `id`, `name`, `gender`, `birth_type` (solar/lunar), `is_leap_month` (boolean), `birth_date` (YYYY-MM-DD HH), `created_at`.
* **Storage Path**: Use Tauri's `BaseDirectory::AppLocalData` to ensure the SQLite database is stored in the correct sandbox directory on both Windows/macOS and Android.

## 5. UI/UX & Responsive Visualization Strategy
The application must dynamically render different layouts based on the viewport width (using Tailwind's `md:` or `lg:` breakpoints).

### 5.1 Input & Archive Module
* A clean form requesting: Name, Gender, Birth Date/Time, Calendar Type (Solar/Lunar), and Leap Month toggle. (No True Solar Time calculations are required).
* A "Load Profile" drawer/sidebar that lists saved profiles from the SQLite database.

### 5.2 Chart Visualization (The Core UI)
The `iztro` engine returns a complex 12-palace JSON. The UI must interpret this differently per platform:
* **PC Layout (Desktop Viewport)**:
    * Implement the traditional **12-Palace Grid (十二宫格)**.
    * Use CSS Grid to create a 4x4 layout where the center 2x2 cells are merged to display the user's core demographic info and current elemental phase (五行局). The 12 remaining outer cells represent the palaces.
* **Android Layout (Mobile Viewport)**:
    * Implement a **Modern Card List (卡片列表)**.
    * The center info becomes a sticky header.
    * The 12 palaces are rendered as a vertical scrolling list of expandable cards.

### 5.3 Information Hierarchy (Visual Weight)
Within each Palace (宫位), data from `iztro` must be filtered and styled by importance to prevent visual clutter:
1.  **Primary**: Palace Name (e.g., 命宫), Major Stars (十四主星) + Brightness (庙旺利陷). (Large font, distinct colors).
2.  **Secondary**: Lucky/Unlucky Stars (六吉六凶), Transformations (四化 - 禄权科忌). (Medium font, badge styling).
3.  **Tertiary**: Minor Stars (杂曜), 12 Longevity states (长生十二神). (Small font, muted colors, hidden inside a "More..." toggle on mobile).

## 6. AI Interaction Engine (The AI Oracle)
To prevent LLM hallucination and token bloat, the raw `iztro` JSON MUST be pruned before being sent to OpenRouter.

### 6.1 Data Pruning (Prompt Context)
* Create a TypeScript utility function: `extractChartSummary(iztroData)`.
* This function extracts ONLY the essential data required for reading:
    * User Yin/Yang & Gender (阴阳男女), Five Elements Phase (五行局).
    * Detailed configurations of all 12 Palaces (including major/minor stars, mutagen transformations, body palace flags, decadal age ranges, longevity/doctor states, and active decadal/yearly flying stars).
    * The current Decade (大限) and Current Year (流年) palaces and their major stars.
* Convert this pruned object into a readable Markdown string to append as system context.

### 6.2 Chat UI & Pre-set Templates
* Implement a Chat Interface styled similar to modern messaging apps.
* **Pre-set Prompts (Chips)**: Above the chat input, provide quick-select chips:
    * "Analyze my overall Destiny Palace (命宫分析)"
    * "How is my Career and Wealth this decade? (当前大限事业财运)"
    * "What should I watch out for in my Marriage/Relationships? (感情婚姻建议)"
* **Context Window**: Maintain the last 5 turns of conversation in the Vue state. Pass this history along with the `ChartSummary` to the Rust proxy for every follow-up question to ensure conversational memory.

## 7. Development Status
The core scaffolding, including the Tauri Rust backend for SQLite and OpenRouter proxying, as well as the Vue frontend with responsive UI and `iztro` integration, has been fully implemented.

## 8. Documentation Maintenance
ALWAYS update this spec file accordingly when making code changes, and keep this rule.