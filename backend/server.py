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

@sio.event
async def user_input(sid, data):
    if audio_loop and audio_loop.session:
        text = data.get('text', '') if data else ''
        if text:
            print(f"[SERVER] User text input: {text}")
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
