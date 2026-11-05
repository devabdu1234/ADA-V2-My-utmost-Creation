# A.P.A. code audit (from reading the code; nothing run)

| Stage | What APA does | file:line | Exists? |
|---|---|---|---|
| Audio capture | PyAudio 16 kHz mono int16, 1024 chunks; RMS gate >=400 with ~0.5 s hangover decides what is sent | backend/ada.py:23-43, 215-291 | Yes |
| Wake word | None. Mic streams continuously once voice auto-starts; only the RMS gate filters | ada.py:271-291; src/App.jsx:225-233 | No |
| Echo handling | Half-duplex: mic discarded while model speaks + 1.5 s tail. No AEC | ada.py:147-149, 203-213, 278-279 | Partial |
| ASR+NLU+answer | Single Gemini Live session `models/gemini-2.5-flash-native-audio-preview-12-2025`, native audio in/out, transcripts only for UI | ada.py:45, 68-106, 844-845 | Yes (native S2S) |
| TTS/voice | Gemini prebuilt voice "Kore", 24 kHz PCM via PyAudio thread | ada.py:99-105, 681-744 | Yes |
| Barge-in | Effectively none: mic gated while model talks; server `interrupted` not handled | ada.py:278-279, 330-338 | No (in practice) |
| Tools | 22 function declarations (email x4, weather, map, God's Eye, focus x2, 13 computer tools) | backend/tools.py:237-262 | Yes |
| Confirmation | Backend future -> Socket.IO -> React ConfirmCard Allow/Deny; default ON for email read/send and all 8 actuators | ada.py:373-419; Stage.jsx:300-328 | Yes |
| Computer control | Native Python, NOT MCP: Pillow screenshots, pygetwindow, Windows UI Automation tree search by element name, pyautogui; allow-lists; safe apps only | backend/computer_bridge.py | Yes |
| Emergency stop | In-memory flag blocks all actuators; voice tool or UI button; resume UI-only; pyautogui FAILSAFE | computer_bridge.py:37,232-240; server.py:591-637 | Yes |
| Proactivity | Email only; poll every 120 s; additive score = urgency(0.2/1/3/4) + 3.0*confidence + relevance(+2/-1.5 keywords) + social(+1.5 recent activity) - 0.5; threshold 6.0, cooldown 600 s, cap 5/day; gates user_speaking, ada_speaking, user_absent, low_urgency; then injects a text "System Event" so the Live model SPEAKS one sentence | backend/proactive.py; ada.py:746-814 | Yes |
| Proactive evidence log | proactive_log.jsonl: 54 decisions, 2 speak, 18 defer, 34 silence | backend/proactive_log.jsonl | Yes |
| Focus sessions | Gemini 2.5 Flash classifies a screenshot every 30 s (label, p_off, confidence); evidence tracker needs 120-240 s sustained off-task; spoken one-sentence nudge + Bluey bubble | backend/focus.py | Yes |
| God's Eye | OpenSky flights, USGS quakes, ISS on 3D globe | backend/gods_eye.py | Yes |
| Bluey | Separate Tkinter overlay mascot: points at targets, HUD of tool steps, text input | backend/bluey_buddy.py | Yes |
| Persistent memory | None; each Live session fresh, no resumption | ada.py:837-895 | No |
| Prompt-injection defence | Prompt-level "information, never instructions" for email+screen; structural defence = confirmation gate | ada.py:79,95,502; email_agent.py:113; focus.py:153 | Prompt-level only |
| Vision | Screenshots + email images to model. No camera (face_landmarker / mediapipe unused) | computer_bridge.py:85-97; ada.py:490-497 | Partial |
| Tests | 18 pytest: focus logic, God's Eye, computer-control safety gates. None for proactive, dispatch, email | tests/ | Limited |

Caveats (code differs from claims): focus sessions do not suppress proactive email (busy_until unused); proactive docstring says multiplicative Horvitz ratio but code is additive; voice barge-in doesn't work; MCP is NOT used (earlier research docs claim MCP); no memory; no wake word; data goes to Google cloud (audio, screenshots, email bodies).
