# Random Voice Chat App - Design Guidelines

## Design Approach

**Reference-Based Approach**: Drawing inspiration from Discord (real-time communication), Omegle (stranger matching simplicity), and Spotify (audio-focused interfaces). The design prioritizes clarity during live voice calls while maintaining an approachable, trust-building aesthetic.

**Core Principles**:
- Distraction-free calling experience with large, accessible controls
- Clear visual feedback for all connection states
- Trust and safety indicators throughout
- Minimal cognitive load during active conversations

## Typography System

**Font Family**: 
- Primary: Inter or DM Sans (modern, highly readable)
- Monospace: JetBrains Mono (for user IDs, technical info)

**Hierarchy**:
- Hero/Main State Text: text-4xl to text-5xl, font-bold
- Section Headers: text-2xl, font-semibold
- Body/Status: text-base to text-lg, font-medium
- Labels/Meta: text-sm, font-normal
- Technical Info: text-xs, font-mono

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 24
- Tight spacing (buttons, form elements): p-2, gap-2
- Standard spacing (sections, cards): p-6, gap-4
- Generous spacing (major sections): p-12, gap-8
- Large breathing room: p-16, p-24

**Grid Structure**:
- Main call interface: Single centered column, max-w-2xl
- Filter options: 2-column grid on desktop (grid-cols-2), stack on mobile
- Analytics/Stats: 3-4 column grid (grid-cols-3 lg:grid-cols-4)

## Component Library

### A. Call Interface States

**Pre-Call (Landing)**:
- Large centered "Start Voice Chat" button (h-16, px-12, text-lg)
- Optional filter toggles below (country, language, mood)
- Trust indicator: "X users online now" (text-sm)
- No hero image - focus on instant action

**Searching State**:
- Full-screen centered experience
- Animated pulsing circle (w-32 h-32) with audio waveform
- "Searching for someone..." text-2xl
- Queue position indicator (text-sm, "~15 people ahead")
- Cancel button (secondary, smaller size)

**Connected State**:
- Minimal top bar: Connection quality indicator, timer, country flag
- Large central audio visualizer (h-48, animated bars)
- Speaking indicator: Glowing ring around visualizer when active
- Bottom controls panel (fixed, bottom-6):
  - Mute toggle (w-14 h-14, rounded-full)
  - End call (w-14 h-14, rounded-full, destructive styling)
  - Next person (w-14 h-14, rounded-full, accent styling)
- User behavior score badge (subtle, top-right corner)

### B. Navigation & Controls

**Primary Actions**:
- Large circular buttons for core actions (w-14 h-14, rounded-full)
- Icon-only during call, icon+text before/after
- Prominent shadows for depth (shadow-lg)

**Secondary Controls**:
- Filter panel: Expandable accordion (h-auto, transition)
- Settings gear: Fixed top-right (w-10 h-10)
- Report/Block: Accessible but not prominent (text-sm link)

### C. Audio Visualization

**Real-time Visualizer**:
- Centered element (w-full max-w-md, h-48)
- Bar-based waveform (12-20 bars, gap-1)
- Smooth transitions (transition-all duration-75)
- Scales based on audio input level
- Pulsing glow effect when speaking detected

### D. Status Indicators

**Connection Quality**:
- Icon-based: Strong (3 bars), Medium (2 bars), Weak (1 bar)
- Positioned top-left during call (absolute, top-4 left-4)

**Call Timer**:
- Monospace font (font-mono, text-sm)
- Top-center or near quality indicator
- Format: MM:SS

**User Score Badge**:
- Small pill (px-2 py-1, rounded-full, text-xs)
- Shows trust level: "New", "Verified", "Regular"
- Subtle placement (doesn't distract)

### E. Filter Panel (Pre-Call)

**Layout**: 
- Expandable drawer or inline section (max-w-xl, mx-auto)
- 2-column grid on tablet+ (grid-cols-2, gap-4)

**Filter Options**:
- Country dropdown: Select with flag icons
- Language toggles: Checkbox group (flex-wrap, gap-2)
- Age range: Dual slider or button groups
- Mood tags: Pill buttons (px-4 py-2, rounded-full)

### F. Anti-Abuse & Safety

**Report Modal**:
- Overlay (fixed inset-0, bg-overlay)
- Centered card (max-w-md, p-6)
- Quick report reasons (radio buttons, text-sm)
- Submit button (w-full, h-12)

**Safety Reminders**:
- Small banner before first call (p-4, rounded-lg)
- Dismissible (×)
- Link to safety guidelines (text-sm, underlined)

## Animations

**Minimal Use - Strategic Placement**:
- Searching state: Gentle pulse on circle (animate-pulse, slow)
- Audio bars: Height transitions (transition-all duration-75)
- Button interactions: Scale on press (active:scale-95)
- State changes: Fade transitions (opacity, duration-200)
- NO complex scroll animations or gratuitous effects

## Responsive Behavior

**Mobile (default)**:
- Full-screen call interface
- Bottom sheet for filters (sheet-bottom)
- Stacked controls (flex-col)
- Touch-friendly button sizes (min-h-12)

**Desktop (md:+)**:
- Centered card-based layout (max-w-2xl)
- Side-by-side filter options (grid-cols-2)
- Slightly smaller visualizer (responsive sizing)

## Images

**No hero image required** - this is a utility-first application where immediate action is prioritized. If background imagery is desired:
- Abstract audio waveform patterns (subtle, low opacity)
- Gradient meshes suggesting connection/communication
- Position: Background layer only, never interfering with content

**Icon Usage**: Use Heroicons via CDN for all interface icons (microphone, phone, settings, flag, etc.)

## Unique Design Considerations

**Trust Building**: 
- Show active user count prominently
- Display connection quality clearly
- Make safety features visible but not alarming

**Call Focus**: 
- Remove all unnecessary UI during active calls
- Large, glanceable audio visualization
- One-tap access to critical actions (mute, next, end)

**State Clarity**: 
- Each state (landing, searching, connected) has distinct visual identity
- Transitions are smooth but obvious
- User always knows what's happening

This design creates a focused, trustworthy voice chat experience that prioritizes real-time communication clarity while maintaining a modern, approachable aesthetic.