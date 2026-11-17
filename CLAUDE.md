# A.P.A. V2: project memory

Read this first. It records where the project stands so any model or session can pick up the work. Last updated: 2026-11-06.

## What this is
A.P.A. V2 (Autonomous Personal Assistant; the code still calls it ADA in places) is a voice-driven desktop email assistant and a university assignment/research project.
- Frontend: React 18 + Vite + Tailwind, running in Electron 28 (`src/`, `electron/`).
- Backend: Python 3.12, FastAPI + python-socketio (`backend/server.py`), talking to the Gemini Live API (voice) in `backend/ada.py`.
- Email: IMAP/SMTP through Gmail with an app password (`backend/email_agent.py`).
- Run it: `START_APA.bat` (installs deps, then `npm run dev` = Vite on 5173 + Electron). The log goes to `apa_launch.log`.
- Tests: `pytest` (`tests/test_focus.py`, `test_gods_eye_and_control.py`, `test_proactive.py`).
- Settings: `settings.json` is untracked and holds credentials, so never commit it. `settings.example.json` is the blank template.

## Main features (backend file → frontend)
- Voice + chat assistant with tool calls: `backend/ada.py`, `backend/tools.py`.
- Email read / show-on-screen (including images) / send / reply: `email_agent.py`. Email content is treated as data, never as instructions.
- Proactive email alerts, muted during focus sessions: `proactive.py`, which logs to `proactive_log.jsonl`.
- Focus sessions: `focus.py` → `src/components/holo/FocusHUD`, `FocusTimeline`.
- Holographic UI: `src/components/holo/` (Stage, Boot, orb, Bluey, RadarMap, ConfirmCard…).
- Bluey buddy (`bluey_buddy.py`), God's Eye (`gods_eye.py`, uses `face_landmarker.task`), computer control (`computer_bridge.py`, `pointer_overlay.py`), weather, Google Sheets logging (`sheets_logger.py`).

## History (git, oldest → newest)
1. Initial commit → refactored into a focused email assistant with Gemini Live voice.
2. Removed old feature files; layout and footer fixes; added PROJECT_REPORT.md.
3. Stopped tracking settings.json (branch `security/untrack-settings`).
4. Added holographic UI, focus sessions, Bluey and God's Eye (f4bf438).
5. Branch `fix/mic-and-recall-animation`:
   - picks a mic copy that supports 16 kHz and reports open failures
   - smooths the recall-to-core animation
   - fixes Gmail login (strips spaces from the app password, applies settings live)
   - lets A.P.A. see email images and open emails on screen
   - mutes proactive email during focus and adds a verified literature review (f78cb1d, latest commit)
   This branch is pushed to origin, and a PR was created from it to `main`.

## Uncommitted work (as of 2026-11-06)
- **Reply-to-email in thread**: a new `reply_to_email` tool in `ada.py` and `tools.py`, plus `EmailAgent.reply_to()` in `email_agent.py`. It sets the Re: subject and In-Reply-To/References headers, sends to the Reply-To address (or the sender), and strips line breaks from headers to guard against header injection. Its default target is the last email opened with `show_email` (`self.open_email`). It uses the `send_email` permission. Small changes in `src/App.jsx` and `holo/Stage.jsx`.
- `backend/proactive_log.jsonl` has new runtime log lines (probably shouldn't be committed).
- Not yet: tests for `reply_to`, or a check in the running app.

## Documents and research (untracked or root files)
- `Research 2.0/`: literature review (`Literature_Review_Analysis.md/.docx`), `Papers_Explained.md`, `Paper_Links_and_Screenshots.md`, reference table (.xlsx), agent reports, screenshots.
- APA_Requirements_Specification.docx, APA_System_Design_Document.docx, the presentation decks (.pptx), PROJECT_REPORT.md, PTE_REPORT.md, PRESENTATION_*.md.
- `icst-lms-redesign/`: a separate side project and not part of A.P.A.

## Location
- On 2026-11-06 the project was copied from `C:\Users\ADMIN\OneDrive\Desktop\assingment\ADA-V2-My-utmost-Creation` to `D:\ADA-V2-My-utmost-Creation`. **The D drive copy is now the main one.** The OneDrive original was left for the user to delete.
- Not yet checked: that the app runs from the D path.

## Working preferences
- The user is casual ("broski"). They want short, plain answers and the smallest change that works.
- Ask before deleting anything, pushing, or sending email.
