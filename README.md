# Echo Frontend - Spaced Repetition Learning Client

Echo Frontend is a modern React web application built with TypeScript, Vite, and custom CSS styling. It provides an intuitive interface for managing notes, organizing learning topics, searching knowledge archives, and conducting spaced repetition review sessions.

---

## Features

- **Knowledge Library**: Bento-grid topic organization and a dynamic Knowledge Stream with expandable pagination and responsive card layouts.
- **Global Search**: Instant search bar with keyboard shortcut (`Cmd/Ctrl + K`) that queries topic and note search endpoints concurrently with real-time UI filtering.
- **Spaced Repetition Review**: Interactive flashcard review interface featuring SRS interval predictions, active recall rating controls, progress tracking, and linked note viewing.
- **Proactive Authentication**: Continuous session management with automatic proactive background token refreshing, event-driven context state synchronization, and secure storage fallback.
- **Analytics & Progress**: Real-time streak counters, retention rate charts, and daily study statistics.
- **In-App Notifications**: Real-time STOMP WebSocket notification panel for review reminders and system alerts.
- **Editorial UI Design**: Custom glassmorphism aesthetic with tailored color systems, responsive drawer panels, and modern typography.

---

## Tech Stack

- **Framework**: React 19, Vite, TypeScript
- **Routing**: React Router 7
- **HTTP Client**: Axios (with credentials, request interceptors, and queue-based refresh logic)
- **Real-Time**: STOMPJS, SockJS-Client
- **Animations**: Framer Motion
- **Icons**: Lucide React, Material Symbols Outlined
- **Styling**: Vanilla CSS, Tailwind-inspired utility tokens, Cormorant Garamond & DM Sans typography

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Local Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `frontend` root directory:
   ```env
   VITE_API_URL=http://localhost:8080
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

5. **Build for Production**:
   ```bash
   npm run build
   ```

---

## Project Structure

```text
frontend/
├── src/
│   ├── assets/       # Static assets and graphic resources
│   ├── components/   # Header, Sidebar, NotificationPanel, ReviewCard, StatCard, ConfirmDialog, EchoToast
│   ├── context/      # UserContext (Auth & Session management), ThemeContext
│   ├── lib/          # API client (Axios configuration & interceptors), Utility helpers, Events
│   ├── pages/        # Dashboard, Library, ReviewSession, Analytics, NewNote, Settings, Auth pages
│   ├── App.tsx       # Main router setup and route guards
│   └── main.tsx      # Application entry point
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## License

Distributed under the MIT License. See LICENSE for more information.

---

Created by [Blessed Winner](https://github.com/blessed-winner)
