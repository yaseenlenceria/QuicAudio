# Random Voice Chat Application

## Overview

This is a real-time random voice chat application that connects strangers worldwide for anonymous voice conversations. The system implements a modern web-based voice calling platform with WebRTC-based peer-to-peer audio connections, AI-powered matchmaking, and comprehensive safety features. Users are identified anonymously through browser-generated UUIDs stored in localStorage, requiring no signup or login.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: React hooks with TanStack Query for server state
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom design system

**Design Philosophy:**
The application follows a reference-based design approach inspired by Discord (real-time communication), Omegle (stranger matching simplicity), and Spotify (audio-focused interfaces). The design prioritizes a distraction-free calling experience with large, accessible controls, clear visual feedback for all connection states, and minimal cognitive load during active conversations.

**Component Structure:**
- Single-page application with main `VoiceChat` component managing call states
- Reusable UI components for audio visualization, connection quality indicators, call timers, and filter panels
- State-based UI rendering: `idle`, `searching`, `connected`, `reconnecting`

**Audio Processing:**
- WebRTC-based peer-to-peer audio connections with STUN servers for NAT traversal
- Real-time audio visualization using Web Audio API with `AudioContext` and `AnalyserNode`
- Audio capture with echo cancellation, noise suppression, and auto gain control
- Custom `AudioVisualizer` class for visual feedback during calls

### Backend Architecture

**Technology Stack:**
- **Runtime**: Node.js with Express.js
- **WebSocket**: ws library for real-time bidirectional communication
- **Database ORM**: Drizzle ORM with PostgreSQL (Neon serverless)
- **Build Tool**: Vite for frontend bundling, esbuild for backend compilation

**Server Responsibilities:**
- WebSocket server for signaling and matchmaking coordination
- RESTful API endpoints for user management, statistics, and abuse reporting
- Real-time matchmaking queue management with AI-powered scoring
- Session tracking and analytics collection

**Matchmaking System:**
The application implements an intelligent matchmaking queue (`MatchmakingQueue` class) that:
- Maintains a priority queue of waiting users sorted by join time
- Calculates compatibility scores based on user preferences (country, language, mood)
- Applies trust scoring to prioritize verified users and penalize abusive behavior
- Prevents users from matching with themselves or users already in progress

**AI Integration:**
Uses OpenAI API for enhanced match scoring that considers:
- Geographic preferences (country matching adds +20 points)
- Language compatibility (language matching adds +30 points)
- Mood alignment (mood matching adds +15 points)
- Abuse score penalties (each abuse point reduces score by 5)
- Trust level bonuses (regular users gain +10 points)

### Data Storage Solutions

**Database Schema (PostgreSQL via Neon):**

1. **Users Table**: Anonymous user profiles identified by UUID
   - Stores country, last seen timestamp, call statistics, abuse scores, and trust levels
   - No personal information or authentication credentials required

2. **Call Sessions Table**: Analytics tracking for each voice call
   - Records participants, timestamps, duration, connection quality, and reconnection attempts
   - Tracks which user ended the call for behavioral analysis

3. **Abuse Reports Table**: Safety and moderation system
   - Captures reporter ID, reported user ID, session context, reason, and details
   - Enables trust scoring and pattern detection for problematic users

4. **Match Preferences Table**: User-configurable matching filters
   - Stores arrays of preferred countries, languages, moods
   - Supports age range preferences (stored as JSON objects)

**Storage Layer:**
Abstract `IStorage` interface with `DatabaseStorage` implementation enables:
- Easy testing and mocking
- Potential migration to different database systems
- Clear separation of data access logic from business logic

### Authentication and Authorization

**Anonymous Authentication:**
- No traditional login system
- Browser-generated UUID (via `crypto.randomUUID()`) stored in localStorage
- UUID serves as permanent user identifier across sessions
- Users can clear their ID to create a new identity

**Trust and Safety:**
- Progressive trust system: `new` → `verified` → `regular`
- Abuse scoring system that accumulates based on reports
- Trust level affects match priority and connection quality
- Safety banner educates users on best practices

### External Dependencies

**Communication Services:**
- **WebRTC**: Peer-to-peer audio streaming with fallback STUN servers (Google STUN servers)
- **WebSocket (ws)**: Real-time signaling for connection negotiation and matchmaking

**AI Services:**
- **OpenAI API**: Powers intelligent match scoring and user compatibility analysis
- Requires `OPENAI_API_KEY` environment variable

**Database:**
- **Neon Serverless PostgreSQL**: Cloud-hosted PostgreSQL database
- Uses `@neondatabase/serverless` driver with WebSocket support
- Requires `DATABASE_URL` environment variable
- Migration management via Drizzle Kit

**UI Libraries:**
- **Radix UI**: Accessible, unstyled component primitives for dialogs, dropdowns, tooltips, etc.
- **shadcn/ui**: Pre-styled component implementations built on Radix UI
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Icon library for consistent iconography

**Development Tools:**
- **Vite**: Fast frontend build tool with HMR (Hot Module Replacement)
- **esbuild**: Fast JavaScript/TypeScript bundler for backend code
- **TypeScript**: Type safety across frontend and backend
- **Replit Plugins**: Development environment integration (error overlay, cartographer, dev banner)

**Font Assets:**
- **Google Fonts**: Inter (primary UI font) and JetBrains Mono (monospace for technical info)
- Loaded via CDN with display=swap for performance