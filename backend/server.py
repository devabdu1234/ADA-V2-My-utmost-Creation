import sys
import asyncio

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

import socketio
import uvicorn
from fastapi import FastAPI
import os
import json

from dotenv import load_dotenv

_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_DIR = os.path.dirname(_BACKEND_DIR)
load_dotenv(os.path.join(_PROJECT_DIR, '.env'))

API_KEY = os.getenv("GEMINI_API_KEY")
print(f"[SERVER] GEMINI_API_KEY {'FOUND' if API_KEY else 'MISSING — set in .env at project root'}")

sys.path.append(_BACKEND_DIR)

import ada
from email_agent import EmailAgent
from sheets_logger import SheetsLogger
from weather_service import city_weather

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
app = FastAPI()
app_socketio = socketio.ASGIApp(sio, app)

import signal

def signal_handler(sig, frame):
    print(f"\n[SERVER] Caught signal {sig}. Exiting gracefully...")
    if audio_loop:
        try:
            print("[SERVER] Stopping Audio Loop...")
            audio_loop.stop()
        except:
            pass
    print("[SERVER] Force exiting...")
    os._exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

audio_loop = None
loop_task = None
SETTINGS_FILE = "settings.json"
sheets_logger = SheetsLogger()

DEFAULT_SETTINGS = {
    "tool_permissions": {
        "read_emails": True,
        "send_email": True,
    },
    "email_config": {
        "imap_server": "imap.gmail.com",
        "smtp_server": "smtp.gmail.com",
        "email_address": "",
        "password": ""
    }
}

SETTINGS = DEFAULT_SETTINGS.copy()

def load_settings():
    global SETTINGS
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, 'r') as f:
                loaded = json.load(f)
                for k, v in loaded.items():
                    if k == "tool_permissions" and isinstance(v, dict):
                        SETTINGS["tool_permissions"].update(v)
                    else:
                        SETTINGS[k] = v
            print(f"Loaded settings: {SETTINGS}")
        except Exception as e:
            print(f"Error loading settings: {e}")

def save_settings():
    try:
        with open(SETTINGS_FILE, 'w') as f:
            json.dump(SETTINGS, f, indent=4)
        print("Settings saved.")
    except Exception as e:
        print(f"Error saving settings: {e}")

load_settings()

@app.on_event("startup")
async def startup_event():
    print("[SERVER] A.P.A Email Assistant Backend Starting...")

@app.get("/status")
async def status():
    return {"status": "running", "service": "A.P.A Email Assistant Backend"}

@app.get("/proactive/stats")
async def proactive_stats():
    """Research evidence endpoint: engine stats + last decisions (for the report)."""
    log_path = ada.ProactiveEngine().evidence_file
    entries = []
    if os.path.exists(log_path):
        try:
            with open(log_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            entries = [json.loads(l) for l in lines[-50:]]
        except Exception as e:
            return {"error": str(e)}
    stats = None
    if audio_loop and audio_loop.proactive:
        stats = audio_loop.proactive.stats
    return {"stats": stats, "recent": entries}

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")
    await sio.emit('status', {'msg': 'Connected to A.P.A Backend'}, room=sid)

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

@sio.event
async def start_audio(sid, data=None):
    global audio_loop, loop_task

    print("Starting Audio Loop...")

    device_index = None
    device_name = None
    if data:
        if 'device_index' in data:
            device_index = data['device_index']
        if 'device_name' in data:
            device_name = data['device_name']

    print(f"Using input device: Name='{device_name}', Index={device_index}")

    if audio_loop:
        if loop_task and (loop_task.done() or loop_task.cancelled()):
            print("Audio loop task appeared finished/cancelled. Clearing and restarting...")
            audio_loop = None
            loop_task = None
        else:
            print("Audio loop already running. Re-connecting client to session.")
            await sio.emit('status', {'msg': 'A.P.A Already Running'})
            return

    def on_audio_data(data_bytes):
        if isinstance(data_bytes, bytes):
            asyncio.create_task(sio.emit('audio_data', {'data': list(data_bytes)}))

    def on_transcription(data):
        asyncio.create_task(sio.emit('transcription', data))

    def on_tool_confirmation(data):
        print(f"Requesting confirmation for tool: {data.get('tool')}")
        asyncio.create_task(sio.emit('tool_confirmation_request', data))

    def on_error(msg):
        print(f"Sending Error to frontend: {msg}")
        asyncio.create_task(sio.emit('error', {'msg': msg}))

    def on_widget_update(data):
        asyncio.create_task(sio.emit('widget_update', data))

    try:
        print(f"Initializing AudioLoop with device_index={device_index}")
        audio_loop = ada.AudioLoop(
            video_mode="none",
            on_audio_data=on_audio_data,
            on_transcription=on_transcription,
            on_tool_confirmation=on_tool_confirmation,
            on_widget_update=on_widget_update,
            on_error=on_error,
            input_device_index=device_index,
            input_device_name=device_name,
            sheets_logger=sheets_logger,
        )
        print("AudioLoop initialized successfully.")

        audio_loop.update_permissions(SETTINGS["tool_permissions"])

        if data and data.get('muted', False):
            print("Starting with Audio Paused")
            audio_loop.set_paused(True)

        print("Creating asyncio task for AudioLoop.run()")
        loop_task = asyncio.create_task(audio_loop.run())

        def handle_loop_exit(task):
            try:
                task.result()
            except asyncio.CancelledError:
                print("Audio Loop Cancelled")
            except Exception as e:
                print(f"Audio Loop Crashed: {e}")

        loop_task.add_done_callback(handle_loop_exit)

        print("Emitting 'A.P.A Started'")
        await sio.emit('status', {'msg': 'A.P.A Started'})

        email_config = SETTINGS.get("email_config", {})
        if email_config and audio_loop.email_agent:
            print(f"[SERVER] Loading email configuration...")
            audio_loop.email_agent.email_address = email_config.get("email_address", "")
            audio_loop.email_agent.password = email_config.get("password", "")
            audio_loop.email_agent.imap_server = email_config.get("imap_server", "imap.gmail.com")
            audio_loop.email_agent.smtp_server = email_config.get("smtp_server", "smtp.gmail.com")

    except Exception as e:
        print(f"CRITICAL ERROR STARTING ADA: {e}")
        import traceback
        traceback.print_exc()
        await sio.emit('error', {'msg': f"Failed to start: {str(e)}"})
        audio_loop = None

@sio.event
async def stop_audio(sid, data=None):
    global audio_loop, loop_task
    if audio_loop:
        print("Stopping Audio Loop...")
        audio_loop.stop()
        if loop_task:
            loop_task.cancel()
        audio_loop = None
        loop_task = None
        await sio.emit('status', {'msg': 'A.P.A Stopped'})

@sio.event
async def toggle_mute(sid, data=None):
    if audio_loop:
        muted = data.get('muted', False) if data else False
        audio_loop.set_paused(muted)
        print(f"Mute toggled: {muted}")
        await sio.emit('status', {'msg': f"{'Muted' if muted else 'Unmuted'}"})

# Frontend emits these names — previously unhandled, so mute was a placebo.
@sio.event
async def pause_audio(sid, data=None):
    if audio_loop:
        audio_loop.set_paused(True)
        print("Audio paused (mic hot-cut).")
        await sio.emit('status', {'msg': 'Muted'})

@sio.event
async def resume_audio(sid, data=None):
    if audio_loop:
        audio_loop.set_paused(False)
        print("Audio resumed.")
        await sio.emit('status', {'msg': 'Unmuted'})

@sio.event
async def user_input(sid, data):
    if audio_loop and audio_loop.session:
        text = data.get('text', '') if data else ''
        if text:
            print(f"[SERVER] User text input: {text}")
            audio_loop.signals.text_active = True
            audio_loop.signals.last_text_activity = __import__('time').time()
            await audio_loop.send_text(text)

@sio.event
async def resolve_confirmation(sid, data):
    if audio_loop:
        audio_loop.resolve_tool_confirmation(data.get('id'), data.get('confirmed', False))

@sio.event
async def send_message(sid, data):
    """Receives a text message from frontend and sends it to the model."""
    if audio_loop and audio_loop.session:
        message = data.get('message', '')
        if message:
            print(f"[CHAT] Message from frontend: {message[:80]}...")
            audio_loop.signals.text_active = True
            audio_loop.signals.last_text_activity = __import__('time').time()
            try:
                await audio_loop.session.send(input=message, end_of_turn=True)
            except Exception as e:
                print(f"[CHAT] Error sending message: {e}")
                await sio.emit('error', {'msg': f"Failed to send message: {e}"})
    else:
        print("[CHAT] Cannot send message: Audio loop not running or no session.")
        await sio.emit('error', {'msg': "A.P.A is not running."})

@sio.event
async def fetch_today_emails(sid, data=None):
    """Fetches today's emails and sends them to the frontend."""
    print("[SERVER] Fetching today's emails...")
    email_config = SETTINGS.get("email_config", {})
    agent = EmailAgent(
        email_address=email_config.get("email_address", ""),
        password=email_config.get("password", "")
    )
    try:
        result = await agent.fetch_today_emails(limit=20)
        if "error" in result:
            await sio.emit('email_error', {'error': result["error"]})
        else:
            if sheets_logger:
                try:
                    sheets_logger.log_batch(result.get("emails", []))
                except Exception as e:
                    print(f"[SERVER] Sheets log failed: {e}")
            await sio.emit('today_emails', result)
    except Exception as e:
        print(f"[SERVER] fetch_today_emails error: {e}")
        await sio.emit('email_error', {'error': str(e)})

@sio.event
async def summon_demo(sid, data=None):
    """On-demand cinematic summon: fetches + analyzes inbox, pushes globe overlay."""
    print("[SERVER] Summon demo requested...")
    email_config = SETTINGS.get("email_config", {})
    agent = EmailAgent(
        email_address=email_config.get("email_address", ""),
        password=email_config.get("password", "")
    )
    try:
        result = await agent.read_emails(limit=8)
        if "error" in result:
            await sio.emit('widget_update', {'type': 'error', 'data': {
                'title': 'Summon Failed', 'message': result["error"],
                'detail': 'Check email credentials in .env.'}})
            return
        emails_data = [{
            "from": e.get("from", "Unknown"), "subject": e.get("subject", "No subject"),
            "category": e.get("category", ""), "priority": e.get("priority", "Medium"),
            "sentiment": e.get("sentiment", "Neutral"), "intensity": e.get("intensity", "Mild"),
            "confidence": e.get("confidence", 0.5), "is_escalated": e.get("is_escalated", False),
            "summary": e.get("summary", ""), "draft_reply": e.get("draft_reply", "")
        } for e in result.get("emails", [])]
        await sio.emit('widget_update', {'type': 'email_summary', 'data': {
            "count": result.get("count", 0), "emails": emails_data,
            "escalation_count": result.get("escalation_count", 0),
            "low_confidence_count": result.get("low_confidence_count", 0)
        }})
        print(f"[SERVER] Summon pushed: {result.get('count', 0)} emails.")
    except Exception as e:
        print(f"[SERVER] summon_demo error: {e}")
        await sio.emit('widget_update', {'type': 'error', 'data': {
            'title': 'Summon Failed', 'message': str(e)}}, room=sid)

@sio.event
async def weather_city(sid, data=None):
    """Ask a city -> geocode -> globe locks on -> live weather card. Fully coded."""
    city = ((data or {}).get("city", "") if isinstance(data, dict) else "") or "Colombo"
    print(f"[SERVER] Weather lock requested: {city}")
    try:
        import asyncio as _aio
        result = await _aio.to_thread(city_weather, city)
        if "error" in result:
            await sio.emit('widget_update', {'type': 'error', 'data': {
                'title': 'Weather Lock Failed', 'message': result["error"]}})
            return
        await sio.emit('widget_update', {'type': 'weather', 'data': result})
        print(f"[SERVER] Weather lock pushed: {result['city']} ({result['lat']:.2f}, {result['lon']:.2f}).")
    except Exception as e:
        print(f"[SERVER] weather_city error: {e}")
        await sio.emit('widget_update', {'type': 'error', 'data': {
            'title': 'Weather Lock Failed', 'message': str(e)}})

@sio.event
async def control_demo(sid, data=None):
    """Cinematic takeover demo: synthetic control events so the HUD overlay can be
    shown without a live voice session (same pattern as weather_demo/summon_demo)."""
    import asyncio as _aio
    import base64
    import io as _io
    from PIL import Image

    def _demo_feed(step):
        img = Image.new('RGB', (320, 200), (8, 12, 24))
        px = img.load()
        for y in range(200):
            for x in range(0, 320, 3):
                v = (x * y // 900 + step * 40) % 80
                px[x, y] = (v // 4 + 8, v // 2 + 20, v // 3 + 44)
        for i in range(step, 320, 4):
            for h in range(120 + (i * 7) % 60, 160):
                px[i, h] = (34, 211, 238)
        buf = _io.BytesIO()
        img.save(buf, format='PNG')
        return base64.b64encode(buf.getvalue()).decode()

    events = [
        ({'type': 'computer_control', 'data': {'state': 'active', 'tool': 'computer_list_windows'}}, 0.0),
        ({'type': 'computer_control', 'data': {'state': 'done', 'tool': 'computer_list_windows'}}, 0.7),
        ({'type': 'computer_control', 'data': {'state': 'active', 'tool': 'computer_screenshot'}}, 1.4),
        ({'type': 'computer_screenshot', 'data': {'image': _demo_feed(1), 'tool': 'computer_screenshot'}}, 2.0),
        ({'type': 'computer_control', 'data': {'state': 'active', 'tool': 'computer_type'}}, 2.7),
        ({'type': 'computer_screenshot', 'data': {'image': _demo_feed(2), 'tool': 'computer_screenshot'}}, 3.4),
        ({'type': 'computer_control', 'data': {'state': 'done', 'tool': 'computer_type', 'detail': 'typed into focused window'}}, 4.0),
    ]
    print("[SERVER] Control demo sequence starting...")
    for payload, delay in events:
        await _aio.sleep(delay)
        await sio.emit('widget_update', payload)
    await sio.emit('status', {'msg': 'Control demo sequence played'})

@sio.event
async def weather_demo(sid, data=None):
    """On-demand weather globe summon (sample data until live API wired)."""
    city = (data or {}).get("city", "Colombo") if isinstance(data, dict) else "Colombo"
    await sio.emit('widget_update', {'type': 'weather', 'data': {
        "city": city, "temp": 87, "feels": 93, "description": "partly sunny",
        "humidity": 74, "wind": "12 km/h",
        "forecast": [
            {"date": "10-14", "desc": "sunny", "lo": 78, "hi": 88},
            {"date": "10-15", "desc": "scattered showers", "lo": 77, "hi": 86},
            {"date": "10-16", "desc": "thunderstorms", "lo": 77, "hi": 85},
        ],
    }})
    print(f"[SERVER] Weather summon pushed: {city}.")

@sio.event
async def new_email(sid, data):
    """Sends a new email from the compose window."""
    if not data:
        return
    to = data.get("to", "").strip()
    subject = data.get("subject", "").strip()
    body = data.get("body", "").strip()
    priority = data.get("priority", "normal")
    if not to or not subject or not body:
        await sio.emit('email_send_result', {'error': 'To, Subject, and Body are required.'})
        return
    email_config = SETTINGS.get("email_config", {})
    agent = EmailAgent(
        email_address=email_config.get("email_address", ""),
        password=email_config.get("password", "")
    )
    try:
        result = await agent.send_email(to, subject, body, priority=priority)
        if "error" in result:
            await sio.emit('email_send_result', {'error': result["error"]})
        else:
            if sheets_logger:
                try:
                    sheets_logger.log_email_sent(to, subject, priority)
                except Exception as e:
                    print(f"[SERVER] Sheets log send failed: {e}")
            await sio.emit('email_send_result', {'success': True, 'message': result.get("message", "Email sent.")})
    except Exception as e:
        print(f"[SERVER] new_email error: {e}")
        await sio.emit('email_send_result', {'error': str(e)})

@sio.event
async def emergency_stop(sid, data=None):
    """User kill-switch: disables all mouse/keyboard control instantly, no session required."""
    from computer_bridge import call_computer_tool
    try:
        result = await call_computer_tool("computer_emergency_stop", timeout=25)
        ok = not result.get("is_error")
        await sio.emit('widget_update', {'type': 'computer_control', 'data': {
            'state': 'stopped' if ok else 'failed',
            'tool': 'computer_emergency_stop'}})
        await sio.emit('status', {'msg': 'Emergency stop engaged - control disabled' if ok
                                  else 'Emergency stop failed'})
    except Exception as e:
        print(f"[SERVER] Emergency stop error: {e}")
        await sio.emit('error', {'msg': f'Emergency stop failed: {e}'})

@sio.event
async def update_settings(sid, data):
    global SETTINGS
    if data:
        for k, v in data.items():
            if k == "tool_permissions" and isinstance(v, dict):
                SETTINGS["tool_permissions"].update(v)
                if audio_loop:
                    audio_loop.update_permissions(v)
            else:
                SETTINGS[k] = v
        save_settings()
        print(f"Settings updated: {SETTINGS}")
        await sio.emit('settings_updated', {'settings': SETTINGS})

@sio.event
async def get_settings(sid, data=None):
    await sio.emit('settings_loaded', {'settings': SETTINGS})

if __name__ == "__main__":
    uvicorn.run(
        "server:app_socketio",
        host="127.0.0.1",
        port=8000,
        reload=False,
        loop="asyncio",
    )
