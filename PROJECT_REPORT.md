# A.P.A V2 (Autonomous Personal Assistant) - Project Report

## 1. Executive Summary
A.P.A V2 is a sophisticated, multi-modal AI desktop assistant designed to bridge the gap between large language models and physical/digital workflows. It leverages the **Gemini 2.5 Flash** model for real-time voice interaction, autonomous web browsing, 3D CAD generation, and smart device management. Built on a hybrid stack of **Electron (React)** and **Python (FastAPI)**, it provides a seamless, cyberpunk-styled interface with advanced hand-tracking and gesture controls.

---

## 2. Technical Architecture

### 2.1 Frontend Stack
- **Framework**: Electron + React (Vite)
- **Styling**: Tailwind CSS + Framer Motion for complex animations
- **State Management**: React Hooks + Socket.IO Client
- **Computer Vision**: MediaPipe Tasks Vision (HandLandmarker)
- **Audio/Video**: HTML5 WebAudio API, WebRTC-style streaming

### 2.2 Backend Stack
- **Language**: Python 3.12
- **Server**: FastAPI + Uvicorn (ASGI)
- **Real-time Communication**: Socket.IO (Async)
- **AI SDK**: `google-genai` (Gemini Live API for multi-turn audio/video)
- **Audio Processing**: PyAudio (PCM stream handling)
- **OS Control**: `ctypes` (for low-latency Windows API mouse/keyboard control)
- **3D Processing**: `build123d` (CAD generation)
- **Web Agent**: Playwright (Stealth mode with cookie persistence)
- **Monitoring**: `psutil` (CPU/RAM/GPU stats)

---

## 3. AI Model & Integration

### 3.1 Core Model
- **Model Name**: `gemini-2.5-flash-native-audio-preview-12-2025`
- **Capabilities**:
    - **Live Audio Streaming**: Bidirectional PCM audio streams (16kHz input / 24kHz output) for real-time conversation.
    - **Vision**: Accepts webcam feeds (1080p source) and screenshot streams for spatial awareness.
    - **Function Calling**: Native tool use for executing backend agents (CAD, Web, Kasa, etc).

### 3.2 Vision & Hand Tracking
- **Model**: MediaPipe HandLandmarker (GPU-accelerated)
- **Features**:
    - Index finger cursor with **Linear Interpolation (Lerp)** smoothing for fluid movement.
    - **Pinch-to-click**: Threshold-based gesture detection (0.07 distance).
    - **Fist-to-drag**: Wrist-tracking logic for moving UI components without hand tremors.

---

## 4. Key Features

### 4.1 Multi-Modal Voice Interface
- **Continuous Conversation**: VAD (Voice Activity Detection) manages turn-taking automatically.
- **Audio Pipeline**: High-quality audio playback runs on a dedicated thread to prevent asyncio event-loop blocking.
- **Transcription**: Real-time streaming of user and AI text to the chat module.

### 4.2 Autonomous Web Agent
- **Stealth Mode**: Uses `playwright-stealth` to bypass anti-bot protections on modern e-commerce sites.
- **Session Persistence**: Saves cookies to `browser_data/cookies.json` for "remember me" logins (e.g., Amazon).
- **Visual Feedback**: Streams browser screenshots to the frontend with live execution logs.

### 4.3 3D CAD & Printing
- **Generative Design**: Translates natural language prompts into 3D prototypes using `build123d`.
- **Print Management**: Discovers and controls printers via **OctoPrint**, **Moonraker**, or **Fluidd** APIs.
- **Slicing**: Integrates with OrcaSlicer/PrusaSlicer for on-the-fly STL slicing.

### 4.4 Smart Home & IoT
- **Kasa Agent**: Direct control of TP-Link/Kasa smart plugs and bulbs.
- **Auto-Discovery**: Network scanning to find devices automatically.

### 4.5 Security & Permissions
- **Face Authentication**: Biometric lock screen that gates access to sensitive tools.
- **Tool Confirmation**: Pop-up modals requiring user approval before the AI performs destructive actions (file writes, server changes).

### 4.6 Advanced UI/UX
- **Intro Sequence**: A cinematic startup animation showcasing system capabilities followed by an AI voice welcome.
- **Modular Mode**: Drag-and-drop window management for all interface elements.
- **System Stats**: Real-time overlay of CPU, RAM, and GPU utilization.
- **Desktop Control**: Native `ctypes` mouse control allowing the AI (via hand tracking) to interact with the entire Windows desktop, not just the app.

---

## 5. Recent Updates & Optimizations

### 5.1 Cinematic Intro Sequence
- Replaced static splash with a staggered animation sequence.
- Capabilities appear one-by-one followed by a "Shall we get started?" prompt.
- Voice intro is now synchronized with backend readiness to prevent "dead air."

### 5.2 Hand Tracking Overhaul
- **Responsiveness**: Increased Lerp smoothing factor from **0.2 to 0.35** for a "snappier" feel.
- **Click Reliability**: Switched from basic `click()` events to full `pointerdown`/`pointerup`/`click` dispatches, ensuring React and native elements both respond correctly.
- **Cooldown**: Added a 500ms click debounce to prevent accidental double-clicks during finger tremors.

### 5.3 Audio Stutter Fix
- Moved PyAudio playback to a dedicated **background thread**. This prevents the `write()` blocking calls from choking the async event loop, resulting in continuous, gap-free AI speech.

### 5.4 Enhanced Intro Sequence (May 25)
- **Matrix Rain Animation**: Canvas-based falling green characters overlaid on the intro screen, creating a cyberpunk aesthetic.
- **Scan Lines & Glitch Effects**: CRT-style scan line overlay with random glitch rectangles (position, size, color vary per frame) for a "holographic" feel.
- **Rotating Capability Badges**: Capability labels (Web Search, Code, Vision, Voice) rotate in a circular carousel around a central terminal icon.
- **Typing & Staggered Reveal**: "Initializing subsystems..." types out character-by-character; each capability fades in with its own progress bar and checkmark status.
- **Pulsing Prompt**: "Shall we get started?" pulses with glow animation after all capabilities load.
- **Vertical Centering Fix**: Removed `h-full` from the content container to let the parent's `justify-center` properly center the layout, preventing upward shift.

### 5.5 Web Agent Model & Image Fix (May 25)
- **Model Upgrade**: Migrated web agent from `gemini-2.0-flash` to `gemini-2.5-flash` for improved reasoning.
- **Image Separation**: Fixed a persistent "model does not support image input" error by separating screenshot (user role) from function response parts (tool role) in the chat history — the Google GenAI SDK rejects mixed-role message parts.
- **Configuration**: Updated `.env` to remove `VERTEX_ENABLED`, switching from Vertex AI (OAuth) to direct API key authentication for reliability.

### 5.6 Core AI Model Update (May 25)
- Updated `ada.py` to use `gemini-2.5-flash-native-audio-preview-12-2025` for real-time voice sessions, replacing the older `gemini-2.0-flash` model.

### 5.7 Email Reading & UI Fix (May 25)
- **Email Read-Aloud**: Changed the `read_emails` function response from a brief summary (`"Found X emails"`) to include full email details (sender, subject, body preview) so the model reads the actual email content aloud to the user.
- **Email Window UI**: Added dedicated `email` entry to `elementSizes` (550×420) and fixed the window to use it instead of falling back to browser's size. This prevents the "black cut-off" at the bottom and centers the window properly.

### 5.8 Echo Cancellation & Audio Quality Fix (May 25)
- **Echo Prevention**: Added `_is_model_speaking` state flag that blocks mic audio from being sent to the model while the model is producing speech output. This prevents the speaker → mic → model feedback loop that caused distorted/echoing responses.
- **Model Speaking Detection**: A background task (`monitor_model_speaking`) continuously monitors model audio output and resets the speaking flag after 1.5 seconds of silence from the model, ensuring normal mic operation resumes promptly.
- **Barge-In Support**: VAD logic still runs during model speech. If the user speaks above threshold while the model is talking, it's treated as a genuine interrupt: the model's audio queue is cleared, `_is_model_speaking` is reset, and the user's audio starts flowing immediately.
- **Recognition Accuracy**: By removing the echo loop, the model no longer hears its own voice transcribed as "user input," resulting in cleaner, more accurate speech-to-text for the user's actual commands.

---

## 6. Project Structure

```text
ada_v2-main/
├── src/                      # React Frontend
│   ├── components/           # UI Modules (Chat, Tools, CAD, Browser, etc.)
│   ├── App.jsx               # Main logic and state orchestration
│   └── ...
├── backend/                  # Python Backend
│   ├── server.py             # FastAPI + Socket.IO server
│   ├── ada.py                # Core AudioLoop and Gemini session manager
│   ├── web_agent.py          # Playwright automation
│   ├── cad_agent.py          # build123d generation
│   ├── kasa_agent.py         # Smart home control
│   └── printer_agent.py      # OctoPrint/Moonraker integration
├── public/                   # Static assets (models, images)
└── opencode.json             # AI-assistant configuration
```

---

## 7. Known Constraints & Workarounds
- **Windows Dependency**: Webcam access requires `cv2.CAP_DSHOW` flag for stability on Windows 10/11.
- **PyAudio Compatibility**: Requires a specific Python 3.12 build environment.
- **Web CAPTCHAs**: While stealth mode handles many anti-bots, complex CAPTCHAs still require manual user intervention (handled via the web agent's visual feedback loop).

---

## 8. Future Roadmap
- **Local LLM Fallback**: Integration of Ollama/Llama for offline capabilities.
- **Multi-Hand Gestures**: Two-handed interactions for scaling/rotating UI elements.
- **Long-term Memory Vector DB**: Upgrading from simple text logs to a vector database for persistent, semantic recall of past sessions.

---

*Report Generated for A.P.A V2 - Autonomous Personal Assistant*
*Date: May 25, 2026*
