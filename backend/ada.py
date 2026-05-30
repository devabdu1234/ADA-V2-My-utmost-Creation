import asyncio
import base64
import datetime
import io
import os
import sys
import traceback
from dotenv import load_dotenv
import cv2
import pyaudio
import PIL.Image
import mss
import argparse
import math
import struct
import time

from google import genai
from google.genai import types

if sys.version_info < (3, 11, 0):
    import taskgroup, exceptiongroup
    asyncio.TaskGroup = taskgroup.TaskGroup
    asyncio.ExceptionGroup = exceptiongroup.ExceptionGroup

from tools import tools_list

FORMAT = pyaudio.paInt16
CHANNELS = 1
SEND_SAMPLE_RATE = 16000
RECEIVE_SAMPLE_RATE = 24000
CHUNK_SIZE = 1024

MODEL = "models/gemini-2.5-flash-native-audio-preview-12-2025"
DEFAULT_MODE = "camera"

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
USE_VERTEX = os.getenv("VERTEX_ENABLED", "").lower() in ("true", "1")
VERTEX_PROJECT = os.getenv("VERTEX_PROJECT")
VERTEX_LOCATION = os.getenv("VERTEX_LOCATION", "us-central1")

if USE_VERTEX:
    if not VERTEX_PROJECT:
        raise ValueError("VERTEX_PROJECT must be set when VERTEX_ENABLED=true")
    client = genai.Client(
        http_options={"api_version": "v1beta"},
        vertexai=True,
        project=VERTEX_PROJECT,
        location=VERTEX_LOCATION,
    )
elif API_KEY:
    client = genai.Client(http_options={"api_version": "v1beta"}, api_key=API_KEY)
else:
    raise ValueError("Set GEMINI_API_KEY in .env or set VERTEX_ENABLED=true with OAuth/ADC")

# Function definitions
generate_cad = {
    "name": "generate_cad",
    "description": "Generates a 3D CAD model based on a prompt.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "prompt": {"type": "STRING", "description": "The description of the object to generate."}
        },
        "required": ["prompt"]
    },
    "behavior": "NON_BLOCKING"
}

run_web_agent = {
    "name": "run_web_agent",
    "description": "Opens a web browser and performs a task according to the prompt.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "prompt": {"type": "STRING", "description": "The detailed instructions for the web browser agent."}
        },
        "required": ["prompt"]
    },
    "behavior": "NON_BLOCKING"
}

create_project_tool = {
    "name": "create_project",
    "description": "Creates a new project folder to organize files.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "name": {"type": "STRING", "description": "The name of the new project."}
        },
        "required": ["name"]
    }
}

switch_project_tool = {
    "name": "switch_project",
    "description": "Switches the current active project context.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "name": {"type": "STRING", "description": "The name of the project to switch to."}
        },
        "required": ["name"]
    }
}

list_projects_tool = {
    "name": "list_projects",
    "description": "Lists all available projects.",
    "parameters": {
        "type": "OBJECT",
        "properties": {},
    }
}

list_smart_devices_tool = {
    "name": "list_smart_devices",
    "description": "Lists all available smart home devices (lights, plugs, etc.) on the network.",
    "parameters": {
        "type": "OBJECT",
        "properties": {},
    }
}

control_light_tool = {
    "name": "control_light",
    "description": "Controls a smart light device.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "target": {
                "type": "STRING",
                "description": "The IP address of the device to control. Always prefer the IP address over the alias for reliability."
            },
            "action": {
                "type": "STRING",
                "description": "The action to perform: 'turn_on', 'turn_off', or 'set'."
            },
            "brightness": {
                "type": "INTEGER",
                "description": "Optional brightness level (0-100)."
            },
            "color": {
                "type": "STRING",
                "description": "Optional color name (e.g., 'red', 'cool white') or 'warm'."
            }
        },
        "required": ["target", "action"]
    }
}

discover_printers_tool = {
    "name": "discover_printers",
    "description": "Discovers 3D printers available on the local network.",
    "parameters": {
        "type": "OBJECT",
        "properties": {},
    }
}

print_stl_tool = {
    "name": "print_stl",
    "description": "Prints an STL file to a 3D printer. Handles slicing the STL to G-code and uploading to the printer.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "stl_path": {"type": "STRING", "description": "Path to STL file, or 'current' for the most recent CAD model."},
            "printer": {"type": "STRING", "description": "Printer name or IP address."},
            "profile": {"type": "STRING", "description": "Optional slicer profile name."}
        },
        "required": ["stl_path", "printer"]
    }
}

get_print_status_tool = {
    "name": "get_print_status",
    "description": "Gets the current status of a 3D printer including progress, time remaining, and temperatures.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "printer": {"type": "STRING", "description": "Printer name or IP address."}
        },
        "required": ["printer"]
    }
}

iterate_cad_tool = {
    "name": "iterate_cad",
    "description": "Modifies or iterates on the current CAD design based on user feedback. Use this when the user asks to adjust, change, modify, or iterate on the existing 3D model (e.g., 'make it taller', 'add a handle', 'reduce the thickness').",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "prompt": {"type": "STRING", "description": "The changes or modifications to apply to the current design."}
        },
        "required": ["prompt"]
    },
    "behavior": "NON_BLOCKING"
}

tools = [{'google_search': {}}, {"function_declarations": [generate_cad, run_web_agent, create_project_tool, switch_project_tool, list_projects_tool, list_smart_devices_tool, control_light_tool, discover_printers_tool, print_stl_tool, get_print_status_tool, iterate_cad_tool] + tools_list[0]['function_declarations']}]

# --- CONFIG UPDATE: Enabled Transcription ---
config = types.LiveConnectConfig(
    response_modalities=["AUDIO"],
    # We switch these from [] to {} to enable them with default settings
    output_audio_transcription={}, 
    input_audio_transcription={},
    system_instruction=(
        "You are A.P.A. (Autonomous Personal Assistant) — an ULTIMATE SUPER AGENT with FULL SYSTEM CONTROL. "
        "You are concise and efficient. You greet the user ONCE on startup, then wait quietly for their command. "
        "You do NOT ramble, repeat yourself, or speak unprompted after your greeting. "
        "You have a 'Subconscious Monitor' that watches emails and system stats. "
        "IMPORTANT: When you detect high CPU/RAM, DO NOT just warn the user — USE your tools to fix it. "
        "List the top processes, identify the culprit, and kill it automatically. Report what you did. "
        "You have the following REAL capabilities — use them without asking for permission: "
        "• 'list_processes' — see what's eating resources "
        "• 'kill_process' — terminate resource hogs by name or PID "
        "• 'system_command' — execute PowerShell commands for system maintenance "
        "• 'clear_temp_files' — free up disk space "
        "• 'get_system_info' — inspect hardware and OS details "
        "• 'generate_cad' — design 3D models "
        "• 'run_web_agent' — browse the web autonomously "
        "• 'read_emails' / 'send_email' — manage inbox "
        "• 'control_light' — smart home control "
        "• 'write_file' / 'read_file' — file management "
        "CRITICAL: When the user asks for emails, ALWAYS use 'read_emails' or 'send_email'. NEVER use the Web Agent for email. "
        "When you fetch emails: summarize by priority (urgent first), mention the count, and ALWAYS end by asking 'Would you like me to compose a reply or send a new email?' "
        "Your personality: sharp, capable, confident, calm. Address the user as 'Sir'. "
        "You do not ask 'Shall I?' for trivial things — you act. But for email composition, you always offer. "
        "Let the user lead the conversation. Answer precisely. Stop when done. Less is more."
    ),
    tools=tools,
    speech_config=types.SpeechConfig(
        voice_config=types.VoiceConfig(
            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                voice_name="Kore"
            )
        )
    )
)

pya = pyaudio.PyAudio()

from cad_agent import CadAgent
from web_agent import WebAgent
from kasa_agent import KasaAgent
from printer_agent import PrinterAgent
from network_agent import NetworkAgent
from email_agent import EmailAgent

class AudioLoop:
    def __init__(self, video_mode=DEFAULT_MODE, on_audio_data=None, on_video_frame=None, on_cad_data=None, on_web_data=None, on_transcription=None, on_tool_confirmation=None, on_cad_status=None, on_cad_thought=None, on_project_update=None, on_device_update=None, on_widget_update=None, on_widget_move=None, on_error=None, input_device_index=None, input_device_name=None, output_device_index=None, kasa_agent=None):
        self.video_mode = video_mode
        self.on_audio_data = on_audio_data
        self.on_video_frame = on_video_frame
        self.on_cad_data = on_cad_data
        self.on_web_data = on_web_data
        self.on_transcription = on_transcription
        self.on_tool_confirmation = on_tool_confirmation 
        self.on_widget_update = on_widget_update
        self.on_cad_status = on_cad_status
        self.on_cad_thought = on_cad_thought
        self.on_project_update = on_project_update
        self.on_widget_move = on_widget_move
        self.on_device_update = on_device_update
        self.on_error = on_error
        self.input_device_index = input_device_index
        self.input_device_name = input_device_name
        self.output_device_index = output_device_index

        self.audio_in_queue = None
        self.out_queue = None
        self.paused = False

        self.chat_buffer = {"sender": None, "text": ""} # For aggregating chunks
        
        # Track last transcription text to calculate deltas (Gemini sends cumulative text)
        self._last_input_transcription = ""
        self._last_output_transcription = ""

        self.audio_in_queue = None
        self.out_queue = None
        self.paused = False

        self.session = None
        
        # Create CadAgent with thought callback
        def handle_cad_thought(thought_text):
            if self.on_cad_thought:
                self.on_cad_thought(thought_text)
        
        def handle_cad_status(status_info):
            if self.on_cad_status:
                self.on_cad_status(status_info)
        
        self.cad_agent = CadAgent(on_thought=handle_cad_thought, on_status=handle_cad_status)
        self.web_agent = WebAgent()
        self.kasa_agent = kasa_agent if kasa_agent else KasaAgent()
        self.printer_agent = PrinterAgent()
        self.network_agent = NetworkAgent()
        self.email_agent = EmailAgent()

        self.send_text_task = None
        self.stop_event = asyncio.Event()
        
        self.stop_event = asyncio.Event()
        
        self.permissions = {} # Default Empty (Will treat unset as True)
        self._pending_confirmations = {}

        # Video buffering state
        self._latest_image_payload = None
        # VAD State
        self._is_speaking = False
        self._silence_start_time = None
        
        # Model Speaking State (for echo prevention)
        self._is_model_speaking = False
        self._model_silence_start = None
        self.MODEL_SPEAKING_TIMEOUT = 1.5
        
        # Initialize ProjectManager
        from project_manager import ProjectManager
        # Assuming we are running from backend/ or root? 
        # Using abspath of current file to find root
        current_dir = os.path.dirname(os.path.abspath(__file__))
        # If ada.py is in backend/, project root is one up
        project_root = os.path.dirname(current_dir)
        self.project_manager = ProjectManager(project_root)
        
        # Sync Initial Project State
        if self.on_project_update:
            # We need to defer this slightly or just call it. 
            # Since this is init, loop might not be running, but on_project_update in server.py uses asyncio.create_task which needs a loop.
            # We will handle this by calling it in run() or just print for now.
            pass

    def flush_chat(self):
        """Forces the current chat buffer to be written to log."""
        if self.chat_buffer["sender"] and self.chat_buffer["text"].strip():
            self.project_manager.log_chat(self.chat_buffer["sender"], self.chat_buffer["text"])
            self.chat_buffer = {"sender": None, "text": ""}
        # Reset transcription tracking for new turn
        self._last_input_transcription = ""
        self._last_output_transcription = ""

    def update_permissions(self, new_perms):
        print(f"[ADA DEBUG] [CONFIG] Updating tool permissions: {new_perms}")
        self.permissions.update(new_perms)

    def set_paused(self, paused):
        self.paused = paused

    def stop(self):
        self.stop_event.set()
        
    def resolve_tool_confirmation(self, request_id, confirmed):
        print(f"[ADA DEBUG] [RESOLVE] resolve_tool_confirmation called. ID: {request_id}, Confirmed: {confirmed}")
        if request_id in self._pending_confirmations:
            future = self._pending_confirmations[request_id]
            if not future.done():
                print(f"[ADA DEBUG] [RESOLVE] Future found and pending. Setting result to: {confirmed}")
                future.set_result(confirmed)
            else:
                 print(f"[ADA DEBUG] [WARN] Request {request_id} future already done. Result: {future.result()}")
        else:
            print(f"[ADA DEBUG] [WARN] Confirmation Request {request_id} not found in pending dict. Keys: {list(self._pending_confirmations.keys())}")

    def clear_audio_queue(self):
        """Clears the queue of pending audio chunks to stop playback immediately."""
        try:
            count = 0
            while not self.audio_in_queue.empty():
                self.audio_in_queue.get_nowait()
                count += 1
            if count > 0:
                print(f"[ADA DEBUG] [AUDIO] Cleared {count} chunks from playback queue due to interruption.")
        except Exception as e:
            print(f"[ADA DEBUG] [ERR] Failed to clear audio queue: {e}")

    async def send_frame(self, frame_data):
        # Update the latest frame payload
        if isinstance(frame_data, bytes):
            b64_data = base64.b64encode(frame_data).decode('utf-8')
        else:
            b64_data = frame_data 

        # Store as the designated "next frame to send"
        self._latest_image_payload = {"mime_type": "image/jpeg", "data": b64_data}
        # No event signal needed - listen_audio pulls it

    async def send_realtime(self):
        while True:
            msg = await self.out_queue.get()
            await self.session.send(input=msg, end_of_turn=False)

    async def monitor_model_speaking(self):
        """Background task: resets _is_model_speaking after sustained silence from model."""
        while not self.stop_event.is_set():
            if self._is_model_speaking:
                now = time.time()
                if self._model_silence_start is None:
                    self._model_silence_start = now
                elif now - self._model_silence_start > self.MODEL_SPEAKING_TIMEOUT:
                    self._is_model_speaking = False
                    self._model_silence_start = None
            await asyncio.sleep(0.1)

    async def listen_audio(self):
        mic_info = pya.get_default_input_device_info()

        # Resolve Input Device by Name if provided
        resolved_input_device_index = None
        
        if self.input_device_name:
            print(f"[ADA] Attempting to find input device matching: '{self.input_device_name}'")
            count = pya.get_device_count()
            best_match = None
            
            for i in range(count):
                try:
                    info = pya.get_device_info_by_index(i)
                    if info['maxInputChannels'] > 0:
                        name = info.get('name', '')
                        # Simple case-insensitive check
                        if self.input_device_name.lower() in name.lower() or name.lower() in self.input_device_name.lower():
                             print(f"   Candidate {i}: {name}")
                             # Prioritize exact match or very close match if possible, but first match is okay for now
                             resolved_input_device_index = i
                             best_match = name
                             break
                except Exception:
                    continue
            
            if resolved_input_device_index is not None:
                print(f"[ADA] Resolved input device '{self.input_device_name}' to index {resolved_input_device_index} ({best_match})")
            else:
                print(f"[ADA] Could not find device matching '{self.input_device_name}'. Checking index...")

        # Fallback to index if Name lookup failed or wasn't provided
        if resolved_input_device_index is None and self.input_device_index is not None:
             try:
                 resolved_input_device_index = int(self.input_device_index)
                 print(f"[ADA] Requesting Input Device Index: {resolved_input_device_index}")
             except ValueError:
                 print(f"[ADA] Invalid device index '{self.input_device_index}', reverting to default.")
                 resolved_input_device_index = None

        if resolved_input_device_index is None:
             print("[ADA] Using Default Input Device")

        try:
            self.audio_stream = await asyncio.to_thread(
                pya.open,
                format=FORMAT,
                channels=CHANNELS,
                rate=SEND_SAMPLE_RATE,
                input=True,
                input_device_index=resolved_input_device_index if resolved_input_device_index is not None else mic_info["index"],
                frames_per_buffer=CHUNK_SIZE,
            )
        except OSError as e:
            print(f"[ADA] [ERR] Failed to open audio input stream: {e}")
            print("[ADA] [WARN] Audio features will be disabled. Please check microphone permissions.")
            return

        if __debug__:
            kwargs = {"exception_on_overflow": False}
        else:
            kwargs = {}
        
        # VAD Constants
        VAD_THRESHOLD = 450 # Lowered for better sensitivity (default was 800)
        SILENCE_DURATION = 0.5 # Seconds of silence to consider "done speaking"
        
        while True:
            if self.paused:
                await asyncio.sleep(0.1)
                continue

            try:
                data = await asyncio.to_thread(self.audio_stream.read, CHUNK_SIZE, **kwargs)
                
                # Compute RMS for VAD (always, even when model is speaking)
                count = len(data) // 2
                if count > 0:
                    shorts = struct.unpack(f"<{count}h", data)
                    sum_squares = sum(s**2 for s in shorts)
                    rms = int(math.sqrt(sum_squares / count))
                else:
                    rms = 0
                
                # VAD Logic (always runs — needed for video frames and interrupt detection)
                if rms > VAD_THRESHOLD:
                    self._silence_start_time = None
                    
                    if not self._is_speaking:
                        self._is_speaking = True
                        print(f"[ADA DEBUG] [VAD] Speech Detected (RMS: {rms}). Listening...")
                        
                        # If user speaks while model is speaking → genuine interrupt
                        if self._is_model_speaking:
                            print("[ADA DEBUG] [VAD] User interrupt detected — clearing model playback.")
                            self.clear_audio_queue()
                            self._is_model_speaking = False
                            self._model_silence_start = None
                        
                        # Send one video frame with speech onset
                        if self._latest_image_payload and self.out_queue:
                            await self.out_queue.put(self._latest_image_payload)
                        else:
                            print(f"[ADA DEBUG] [VAD] No video frame available to send.")
                else:
                    if self._is_speaking:
                        if self._silence_start_time is None:
                            self._silence_start_time = time.time()
                        elif time.time() - self._silence_start_time > SILENCE_DURATION:
                            print(f"[ADA DEBUG] [VAD] Silence detected. Resetting speech state.")
                            self._is_speaking = False
                            self._silence_start_time = None

                # Echo prevention: skip sending mic audio while model is speaking
                if self._is_model_speaking:
                    continue

                # Send audio to model
                if self.out_queue:
                    await self.out_queue.put({"data": data, "mime_type": "audio/pcm"})

            except Exception as e:
                print(f"Error reading audio: {e}")
                await asyncio.sleep(0.1)

    async def handle_cad_request(self, prompt):
        print(f"[ADA DEBUG] [CAD] Background Task Started: handle_cad_request('{prompt}')")
        if self.on_cad_status:
            self.on_cad_status("generating")
            
        # Auto-create project if stuck in temp
        if self.project_manager.current_project == "temp":
            import datetime
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            new_project_name = f"Project_{timestamp}"
            print(f"[ADA DEBUG] [CAD] Auto-creating project: {new_project_name}")
            
            success, msg = self.project_manager.create_project(new_project_name)
            if success:
                self.project_manager.switch_project(new_project_name)
                # Notify User (Optional, or rely on update)
                try:
                    await self.session.send(input=f"System Notification: Automatic Project Creation. Switched to new project '{new_project_name}'.", end_of_turn=False)
                    if self.on_project_update:
                         self.on_project_update(new_project_name)
                except Exception as e:
                    print(f"[ADA DEBUG] [ERR] Failed to notify auto-project: {e}")

        # Get project cad folder path
        cad_output_dir = str(self.project_manager.get_current_project_path() / "cad")
        
        # Call the secondary agent with project path
        cad_data = await self.cad_agent.generate_prototype(prompt, output_dir=cad_output_dir)
        
        if cad_data:
            print(f"[ADA DEBUG] [OK] CadAgent returned data successfully.")
            print(f"[ADA DEBUG] [INFO] Data Check: {len(cad_data.get('vertices', []))} vertices, {len(cad_data.get('edges', []))} edges.")
            
            if self.on_cad_data:
                print(f"[ADA DEBUG] [SEND] Dispatching data to frontend callback...")
                self.on_cad_data(cad_data)
                print(f"[ADA DEBUG] [SENT] Dispatch complete.")
            
            # Save to Project
            if 'file_path' in cad_data:
                self.project_manager.save_cad_artifact(cad_data['file_path'], prompt)
            else:
                 # Fallback (legacy support)
                 self.project_manager.save_cad_artifact("output.stl", prompt)

            # Notify the model that the task is done - this triggers speech about completion
            completion_msg = "System Notification: CAD generation is complete! The 3D model is now displayed for the user. Let them know it's ready."
            try:
                await self.session.send(input=completion_msg, end_of_turn=True)
                print(f"[ADA DEBUG] [NOTE] Sent completion notification to model.")
            except Exception as e:
                 print(f"[ADA DEBUG] [ERR] Failed to send completion notification: {e}")

        else:
            print(f"[ADA DEBUG] [ERR] CadAgent returned None.")
            # Optionally notify failure
            try:
                await self.session.send(input="System Notification: CAD generation failed.", end_of_turn=True)
            except Exception:
                pass



    async def handle_write_file(self, path, content):
        print(f"[ADA DEBUG] [FS] Writing file: '{path}'")
        
        # Auto-create project if stuck in temp
        if self.project_manager.current_project == "temp":
            import datetime
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            new_project_name = f"Project_{timestamp}"
            print(f"[ADA DEBUG] [FS] Auto-creating project: {new_project_name}")
            
            success, msg = self.project_manager.create_project(new_project_name)
            if success:
                self.project_manager.switch_project(new_project_name)
                # Notify User
                try:
                    await self.session.send(input=f"System Notification: Automatic Project Creation. Switched to new project '{new_project_name}'.", end_of_turn=False)
                    if self.on_project_update:
                         self.on_project_update(new_project_name)
                except Exception as e:
                    print(f"[ADA DEBUG] [ERR] Failed to notify auto-project: {e}")
        
        # Force path to be relative to current project
        # If absolute path is provided, we try to strip it or just ignore it and use basename
        filename = os.path.basename(path)
        
        # If path contained subdirectories (e.g. "backend/server.py"), preserving that structure might be desired IF it's within the project.
        # But for safety, and per user request to "always create the file in the project", 
        # we will root it in the current project path.
        
        current_project_path = self.project_manager.get_current_project_path()
        final_path = current_project_path / filename # Simple flat structure for now, or allow relative?
        
        # If the user specifically wanted a subfolder, they might have provided "sub/file.txt".
        # Let's support relative paths if they don't start with /
        if not os.path.isabs(path):
             final_path = current_project_path / path
        
        print(f"[ADA DEBUG] [FS] Resolved path: '{final_path}'")

        try:
            # Ensure parent exists
            os.makedirs(os.path.dirname(final_path), exist_ok=True)
            with open(final_path, 'w', encoding='utf-8') as f:
                f.write(content)
            result = f"File '{final_path.name}' written successfully to project '{self.project_manager.current_project}'."
        except Exception as e:
            result = f"Failed to write file '{path}': {str(e)}"

        print(f"[ADA DEBUG] [FS] Result: {result}")
        try:
             await self.session.send(input=f"System Notification: {result}", end_of_turn=True)
        except Exception as e:
             print(f"[ADA DEBUG] [ERR] Failed to send fs result: {e}")

    async def handle_read_directory(self, path):
        print(f"[ADA DEBUG] [FS] Reading directory: '{path}'")
        try:
            if not os.path.exists(path):
                result = f"Directory '{path}' does not exist."
            else:
                items = os.listdir(path)
                result = f"Contents of '{path}': {', '.join(items)}"
        except Exception as e:
            result = f"Failed to read directory '{path}': {str(e)}"

        print(f"[ADA DEBUG] [FS] Result: {result}")
        try:
             await self.session.send(input=f"System Notification: {result}", end_of_turn=True)
        except Exception as e:
             print(f"[ADA DEBUG] [ERR] Failed to send fs result: {e}")

    async def handle_read_file(self, path):
        print(f"[ADA DEBUG] [FS] Reading file: '{path}'")
        try:
            if not os.path.exists(path):
                result = f"File '{path}' does not exist."
            else:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                result = f"Content of '{path}':\n{content}"
        except Exception as e:
            result = f"Failed to read file '{path}': {str(e)}"

        print(f"[ADA DEBUG] [FS] Result: {result}")
        try:
             await self.session.send(input=f"System Notification: {result}", end_of_turn=True)
        except Exception as e:
             print(f"[ADA DEBUG] [ERR] Failed to send fs result: {e}")

    async def handle_web_agent_request(self, prompt):
        print(f"[ADA DEBUG] [WEB] Web Agent Task: '{prompt}'")
        
        async def update_frontend(image_b64, log_text):
            if self.on_web_data:
                 self.on_web_data({"image": image_b64, "log": log_text})
                 
        # Run the web agent and wait for it to return
        result = await self.web_agent.run_task(prompt, update_callback=update_frontend)
        print(f"[ADA DEBUG] [WEB] Web Agent Task Returned: {result}")
        
        # Send the final result back to the main model
        try:
             await self.session.send(input=f"System Notification: Web Agent has finished.\nResult: {result}", end_of_turn=True)
        except Exception as e:
             print(f"[ADA DEBUG] [ERR] Failed to send web agent result to model: {e}")

    async def receive_audio(self):
        "Background task to reads from the websocket and write pcm chunks to the output queue"
        try:
            while True:
                turn = self.session.receive()
                async for response in turn:
                    # 1. Handle Audio Data (model speaking)
                    if data := response.data:
                        self.audio_in_queue.put_nowait(data)
                        self._is_model_speaking = True
                        self._model_silence_start = None
                        # NOTE: 'continue' removed here to allow processing transcription/tools in same packet

                    # 2. Handle Transcription (User & Model)
                    if response.server_content:
                        if response.server_content.input_transcription:
                            transcript = response.server_content.input_transcription.text
                            if transcript:
                                # Skip if this is an exact duplicate event
                                if transcript != self._last_input_transcription:
                                    # Calculate delta (Gemini may send cumulative or chunk-based text)
                                    delta = transcript
                                    if transcript.startswith(self._last_input_transcription):
                                        delta = transcript[len(self._last_input_transcription):]
                                    self._last_input_transcription = transcript
                                    
                                    # Only send if there's new text
                                    if delta:
                                        # User is speaking, so interrupt model playback!
                                        self.clear_audio_queue()
                                        self._is_model_speaking = False
                                        self._model_silence_start = None

                                        # Send to frontend (Streaming)
                                        if self.on_transcription:
                                             self.on_transcription({"sender": "User", "text": delta})
                                        
                                        # Buffer for Logging
                                        if self.chat_buffer["sender"] != "User":
                                            # Flush previous if exists
                                            if self.chat_buffer["sender"] and self.chat_buffer["text"].strip():
                                                self.project_manager.log_chat(self.chat_buffer["sender"], self.chat_buffer["text"])
                                            # Start new
                                            self.chat_buffer = {"sender": "User", "text": delta}
                                        else:
                                            # Append
                                            self.chat_buffer["text"] += delta
                        
                        if response.server_content.output_transcription:
                            transcript = response.server_content.output_transcription.text
                            if transcript:
                                # Skip if this is an exact duplicate event
                                if transcript != self._last_output_transcription:
                                    # Calculate delta (Gemini may send cumulative or chunk-based text)
                                    delta = transcript
                                    if transcript.startswith(self._last_output_transcription):
                                        delta = transcript[len(self._last_output_transcription):]
                                    self._last_output_transcription = transcript
                                    
                                    # Only send if there's new text
                                    if delta:
                                        # Send to frontend (Streaming)
                                        if self.on_transcription:
                                             self.on_transcription({"sender": "ADA", "text": delta})
                                        
                                        # Buffer for Logging
                                        if self.chat_buffer["sender"] != "ADA":
                                            # Flush previous
                                            if self.chat_buffer["sender"] and self.chat_buffer["text"].strip():
                                                self.project_manager.log_chat(self.chat_buffer["sender"], self.chat_buffer["text"])
                                            # Start new
                                            self.chat_buffer = {"sender": "ADA", "text": delta}
                                        else:
                                            # Append
                                            self.chat_buffer["text"] += delta
                        
                        # Flush buffer on turn completion if needed, 
                        # but usually better to wait for sender switch or explicit end.
                        # We can also check turn_complete signal if available in response.server_content.model_turn etc

                    # 3. Handle Tool Calls
                    if response.tool_call:
                        print("The tool was called")
                        function_responses = []
                        for fc in response.tool_call.function_calls:
                            if fc.name in ["generate_cad", "run_web_agent", "write_file", "read_directory", "read_file", "create_project", "switch_project", "list_projects", "list_smart_devices", "control_light", "discover_printers", "print_stl", "get_print_status", "iterate_cad", "list_network_servers", "list_server_files", "download_server_file", "read_emails", "send_email", "list_processes", "kill_process", "system_command", "clear_temp_files", "get_system_info", "get_weather", "move_widget"]:
                                prompt = fc.args.get("prompt", "") # Prompt is not present for all tools
                                
                                # Check Permissions (Default to True if not set)
                                confirmation_required = self.permissions.get(fc.name, True)
                                
                                if not confirmation_required:
                                    print(f"[ADA DEBUG] [TOOL] Permission check: '{fc.name}' -> AUTO-ALLOW")
                                    # Skip confirmation block and jump to execution
                                    pass
                                else:
                                    # Confirmation Logic
                                    if self.on_tool_confirmation:
                                        import uuid
                                        request_id = str(uuid.uuid4())
                                    print(f"[ADA DEBUG] [STOP] Requesting confirmation for '{fc.name}' (ID: {request_id})")
                                    
                                    future = asyncio.Future()
                                    self._pending_confirmations[request_id] = future
                                    
                                    self.on_tool_confirmation({
                                        "id": request_id, 
                                        "tool": fc.name, 
                                        "args": fc.args
                                    })
                                    
                                    try:
                                        # Wait for user response
                                        confirmed = await future

                                    finally:
                                        self._pending_confirmations.pop(request_id, None)

                                    print(f"[ADA DEBUG] [CONFIRM] Request {request_id} resolved. Confirmed: {confirmed}")

                                    if not confirmed:
                                        print(f"[ADA DEBUG] [DENY] Tool call '{fc.name}' denied by user.")
                                        function_response = types.FunctionResponse(
                                            id=fc.id,
                                            name=fc.name,
                                            response={
                                                "result": "User denied the request to use this tool.",
                                            }
                                        )
                                        function_responses.append(function_response)
                                        continue

                                # If confirmed (or no callback configured, or auto-allowed), proceed
                                if fc.name == "generate_cad":
                                    print(f"\n[ADA DEBUG] --------------------------------------------------")
                                    print(f"[ADA DEBUG] [TOOL] Tool Call Detected: 'generate_cad'")
                                    print(f"[ADA DEBUG] [IN] Arguments: prompt='{prompt}'")
                                    
                                    asyncio.create_task(self.handle_cad_request(prompt))
                                    # No function response needed - model already acknowledged when user asked
                                
                                elif fc.name == "run_web_agent":
                                    print(f"[ADA DEBUG] [TOOL] Tool Call: 'run_web_agent' with prompt='{prompt}'")
                                    asyncio.create_task(self.handle_web_agent_request(prompt))
                                    
                                    result_text = "Web Navigation started. Do not reply to this message."
                                    function_response = types.FunctionResponse(
                                        id=fc.id,
                                        name=fc.name,
                                        response={
                                            "result": result_text,
                                        }
                                    )
                                    print(f"[ADA DEBUG] [RESPONSE] Sending function response: {function_response}")
                                    function_responses.append(function_response)



                                elif fc.name == "write_file":
                                    path = fc.args["path"]
                                    content = fc.args["content"]
                                    print(f"[ADA DEBUG] [TOOL] Tool Call: 'write_file' path='{path}'")
                                    asyncio.create_task(self.handle_write_file(path, content))
                                    function_response = types.FunctionResponse(
                                        id=fc.id, name=fc.name, response={"result": "Writing file..."}
                                    )
                                    function_responses.append(function_response)

                                elif fc.name == "read_directory":
                                    path = fc.args["path"]
                                    print(f"[ADA DEBUG] [TOOL] Tool Call: 'read_directory' path='{path}'")
                                    asyncio.create_task(self.handle_read_directory(path))
                                    function_response = types.FunctionResponse(
                                        id=fc.id, name=fc.name, response={"result": "Reading directory..."}
                                    )
                                    function_responses.append(function_response)

                                elif fc.name == "read_file":
                                    path = fc.args["path"]
                                    print(f"[ADA DEBUG] [TOOL] Tool Call: 'read_file' path='{path}'")
                                    asyncio.create_task(self.handle_read_file(path))
                                    function_response = types.FunctionResponse(
                                        id=fc.id, name=fc.name, response={"result": "Reading file..."}
                                    )
                                    function_responses.append(function_response)

                                elif fc.name == "create_project":
                                    name = fc.args["name"]
                                    print(f"[ADA DEBUG] [TOOL] Tool Call: 'create_project' name='{name}'")
                                    success, msg = self.project_manager.create_project(name)
                                    if success:
                                        # Auto-switch to the newly created project
                                        self.project_manager.switch_project(name)
                                        msg += f" Switched to '{name}'."
                                        if self.on_project_update:
                                            self.on_project_update(name)
                                    function_response = types.FunctionResponse(
                                        id=fc.id, name=fc.name, response={"result": msg}
                                    )
                                    function_responses.append(function_response)

                                elif fc.name == "switch_project":
                                    name = fc.args["name"]
                                    print(f"[ADA DEBUG] [TOOL] Tool Call: 'switch_project' name='{name}'")
                                    success, msg = self.project_manager.switch_project(name)
                                    if success:
                                        if self.on_project_update:
                                            self.on_project_update(name)
                                        # Gather project context and send to AI (silently, no response expected)
                                        context = self.project_manager.get_project_context()
                                        print(f"[ADA DEBUG] [PROJECT] Sending project context to AI ({len(context)} chars)")
                                        try:
                                            await self.session.send(input=f"System Notification: {msg}\n\n{context}", end_of_turn=False)
                                        except Exception as e:
                                            print(f"[ADA DEBUG] [ERR] Failed to send project context: {e}")
                                    function_response = types.FunctionResponse(
                                        id=fc.id, name=fc.name, response={"result": msg}
                                    )
                                    function_responses.append(function_response)
                                
                                elif fc.name == "list_projects":
                                    print(f"[ADA DEBUG] [TOOL] Tool Call: 'list_projects'")
                                    projects = self.project_manager.list_projects()
                                    function_response = types.FunctionResponse(
                                        id=fc.id, name=fc.name, response={"result": f"Available projects: {', '.join(projects)}"}
                                    )
                                    function_responses.append(function_response)

                                elif fc.name == "list_smart_devices":
                                    print(f"[ADA DEBUG] [TOOL] Tool Call: 'list_smart_devices'")
                                    # Use cached devices directly for speed
                                    # devices_dict is {ip: SmartDevice}
                                    
                                    dev_summaries = []
                                    frontend_list = []
                                    
                                    for ip, d in self.kasa_agent.devices.items():
                                        dev_type = "unknown"
                                        if d.is_bulb: dev_type = "bulb"
                                        elif d.is_plug: dev_type = "plug"
                                        elif d.is_strip: dev_type = "strip"
                                        elif d.is_dimmer: dev_type = "dimmer"
                                        
                                        # Format for Model
                                        info = f"{d.alias} (IP: {ip}, Type: {dev_type})"
                                        if d.is_on:
                                            info += " [ON]"
                                        else:
                                            info += " [OFF]"
                                        dev_summaries.append(info)
                                        
                                        # Format for Frontend
                                        frontend_list.append({
                                            "ip": ip,
                                            "alias": d.alias,
                                            "model": d.model,
                                            "type": dev_type,
                                            "is_on": d.is_on,
                                            "brightness": d.brightness if d.is_bulb or d.is_dimmer else None,
                                            "hsv": d.hsv if d.is_bulb and d.is_color else None,
                                            "has_color": d.is_color if d.is_bulb else False,
                                            "has_brightness": d.is_dimmable if d.is_bulb or d.is_dimmer else False
                                        })
                                    
                                    result_str = "No devices found in cache."
                                    if dev_summaries:
                                        result_str = "Found Devices (Cached):\n" + "\n".join(dev_summaries)
                                    
                                    # Trigger frontend update
                                    if self.on_device_update:
                                        self.on_device_update(frontend_list)

                                    function_response = types.FunctionResponse(
                                        id=fc.id, name=fc.name, response={"result": result_str}
                                    )
                                    function_responses.append(function_response)

                                elif fc.name == "control_light":
                                    target = fc.args["target"]
                                    action = fc.args["action"]
                                    brightness = fc.args.get("brightness")
                                    color = fc.args.get("color")
                                    
                                    print(f"[ADA DEBUG] [TOOL] Tool Call: 'control_light' Target='{target}' Action='{action}'")
                                    
                                    result_msg = f"Action '{action}' on '{target}' failed."
                                    success = False
                                    
                                    if action == "turn_on":
                                        success = await self.kasa_agent.turn_on(target)
                                        if success:
                                            result_msg = f"Turned ON '{target}'."
                                    elif action == "turn_off":
                                        success = await self.kasa_agent.turn_off(target)
                                        if success:
                                            result_msg = f"Turned OFF '{target}'."
                                    elif action == "set":
                                        success = True
                                        result_msg = f"Updated '{target}':"
                                    
                                    # Apply extra attributes if 'set' or if we just turned it on and want to set them too
                                    if success or action == "set":
                                        if brightness is not None:
                                            sb = await self.kasa_agent.set_brightness(target, brightness)
                                            if sb:
                                                result_msg += f" Set brightness to {brightness}."
                                        if color is not None:
                                            sc = await self.kasa_agent.set_color(target, color)
                                            if sc:
                                                result_msg += f" Set color to {color}."

                                    # Notify Frontend of State Change
                                    if success:
                                        # We don't need full discovery, just refresh known state or push update
                                        # But for simplicity, let's get the standard list representation
                                        # KasaAgent updates its internal state on control, so we can rebuild the list
                                        
                                        # Quick rebuild of list from internal dict
                                        updated_list = []
                                        for ip, dev in self.kasa_agent.devices.items():
                                            # We need to ensure we have the correct dict structure expected by frontend
                                            # We duplicate logic from KasaAgent.discover_devices a bit, but that's okay for now or we can add a helper
                                            # Ideally KasaAgent has a 'get_devices_list()' method.
                                            # Use the cached objects in self.kasa_agent.devices
                                            
                                            dev_type = "unknown"
                                            if dev.is_bulb: dev_type = "bulb"
                                            elif dev.is_plug: dev_type = "plug"
                                            elif dev.is_strip: dev_type = "strip"
                                            elif dev.is_dimmer: dev_type = "dimmer"

                                            d_info = {
                                                "ip": ip,
                                                "alias": dev.alias,
                                                "model": dev.model,
                                                "type": dev_type,
                                                "is_on": dev.is_on,
                                                "brightness": dev.brightness if dev.is_bulb or dev.is_dimmer else None,
                                                "hsv": dev.hsv if dev.is_bulb and dev.is_color else None,
                                                "has_color": dev.is_color if dev.is_bulb else False,
                                                "has_brightness": dev.is_dimmable if dev.is_bulb or dev.is_dimmer else False
                                            }
                                            updated_list.append(d_info)
                                            
                                        if self.on_device_update:
                                            self.on_device_update(updated_list)
                                    else:
                                        # Report Error
                                        if self.on_error:
                                            self.on_error(result_msg)

                                    function_response = types.FunctionResponse(
                                        id=fc.id, name=fc.name, response={"result": result_msg}
                                    )
                                    function_responses.append(function_response)

                                elif fc.name == "discover_printers":
                                    print(f"[ADA DEBUG] [TOOL] Tool Call: 'discover_printers'")
                                    printers = await self.printer_agent.discover_printers()
                                    # Format for model
                                    if printers:
                                        printer_list = []
                                        for p in printers:
                                            printer_list.append(f"{p['name']} ({p['host']}:{p['port']}, type: {p['printer_type']})")
                                        result_str = "Found Printers:\n" + "\n".join(printer_list)
                                    else:
                                        result_str = "No printers found on network. Ensure printers are on and running OctoPrint/Moonraker."
                                    
                                    function_response = types.FunctionResponse(
                                        id=fc.id, name=fc.name, response={"result": result_str}
                                    )
                                    function_responses.append(function_response)

                                elif fc.name == "print_stl":
                                    stl_path = fc.args["stl_path"]
                                    printer = fc.args["printer"]
                                    profile = fc.args.get("profile")
                                    
                                    print(f"[ADA DEBUG] [TOOL] Tool Call: 'print_stl' STL='{stl_path}' Printer='{printer}'")
                                    
                                    # Resolve 'current' to project STL
                                    if stl_path.lower() == "current":
                                        stl_path = "output.stl" # Let printer agent resolve it in root_path

                                    # Get current project path
                                    project_path = str(self.project_manager.get_current_project_path())
                                    
                                    result = await self.printer_agent.print_stl(
                                        stl_path, 
                                        printer, 
                                        profile, 
                                        root_path=project_path
                                    )
                                    result_str = result.get("message", "Unknown result")
                                    
                                    function_response = types.FunctionResponse(
                                        id=fc.id, name=fc.name, response={"result": result_str}
                                    )
                                    function_responses.append(function_response)

                                elif fc.name == "get_print_status":
                                    printer = fc.args["printer"]
                                    print(f"[ADA DEBUG] [TOOL] Tool Call: 'get_print_status' Printer='{printer}'")
                                    
                                    status = await self.printer_agent.get_print_status(printer)
                                    if status:
                                        result_str = f"Printer: {status.printer}\n"
                                        result_str += f"State: {status.state}\n"
                                        result_str += f"Progress: {status.progress_percent:.1f}%\n"
                                        if status.time_remaining:
                                            result_str += f"Time Remaining: {status.time_remaining}\n"
                                        if status.time_elapsed:
                                            result_str += f"Time Elapsed: {status.time_elapsed}\n"
                                        if status.filename:
                                            result_str += f"File: {status.filename}\n"
                                        if status.temperatures:
                                            temps = status.temperatures
                                            if "hotend" in temps:
                                                result_str += f"Hotend: {temps['hotend']['current']:.0f}°C / {temps['hotend']['target']:.0f}°C\n"
                                            if "bed" in temps:
                                                result_str += f"Bed: {temps['bed']['current']:.0f}°C / {temps['bed']['target']:.0f}°C"
                                    else:
                                        result_str = f"Could not get status for printer '{printer}'. Ensure it is discovered first."
                                    
                                    function_response = types.FunctionResponse(
                                        id=fc.id, name=fc.name, response={"result": result_str}
                                    )
                                    function_responses.append(function_response)

                                elif fc.name == "iterate_cad":
                                    prompt = fc.args["prompt"]
                                    print(f"[ADA DEBUG] [TOOL] Tool Call: 'iterate_cad' Prompt='{prompt}'")
                                    
                                    # Emit status
                                    if self.on_cad_status:
                                        self.on_cad_status("generating")
                                    
                                    # Get project cad folder path
                                    cad_output_dir = str(self.project_manager.get_current_project_path() / "cad")
                                    
                                    # Call CadAgent to iterate on the design
                                    cad_data = await self.cad_agent.iterate_prototype(prompt, output_dir=cad_output_dir)
                                    
                                    if cad_data:
                                        print(f"[ADA DEBUG] [OK] CadAgent iteration returned data successfully.")
                                        
                                        # Dispatch to frontend
                                        if self.on_cad_data:
                                            print(f"[ADA DEBUG] [SEND] Dispatching iterated CAD data to frontend...")
                                            self.on_cad_data(cad_data)
                                            print(f"[ADA DEBUG] [SENT] Dispatch complete.")
                                        
                                        # Save to Project
                                        self.project_manager.save_cad_artifact("output.stl", f"Iteration: {prompt}")
                                        
                                        result_str = f"Successfully iterated design: {prompt}. The updated 3D model is now displayed."
                                    else:
                                        print(f"[ADA DEBUG] [ERR] CadAgent iteration returned None.")
                                        result_str = f"Failed to iterate design with prompt: {prompt}"
                                    
                                    function_response = types.FunctionResponse(
                                        id=fc.id, name=fc.name, response={"result": result_str}
                                    )
                                    function_responses.append(function_response)

                                elif fc.name == "list_network_servers":
                                    print(f"[ADA DEBUG] [TOOL] Tool Call: 'list_network_servers'")
                                    servers = self.network_agent.servers
                                    if servers:
                                        result_str = "Available Network Servers:\n" + "\n".join([f"- {s['name']} ({s['host']})" for s in servers])
                                    else:
                                        result_str = "No network servers configured. Add servers to settings.json or use voice to configure."
                                    function_response = types.FunctionResponse(
                                        id=fc.id, name=fc.name, response={"result": result_str}
                                    )
                                    function_responses.append(function_response)

                                elif fc.name == "list_server_files":
                                    server_name = fc.args["server_name"]
                                    remote_path = fc.args.get("remote_path", ".")
                                    print(f"[ADA DEBUG] [TOOL] Tool Call: 'list_server_files' Server='{server_name}' Path='{remote_path}'")
                                    result = await self.network_agent.connect_and_list_files(server_name, remote_path)
                                    if "error" in result:
                                        result_str = result["error"]
                                    else:
                                        files = result.get("files", [])
                                        result_str = f"Files on '{server_name}' at '{remote_path}':\n" + "\n".join([f"- {f['name']} {'(DIR)' if f['is_directory'] else ''}" for f in files])
                                    function_response = types.FunctionResponse(
                                        id=fc.id, name=fc.name, response={"result": result_str}
                                    )
                                    function_responses.append(function_response)

                                elif fc.name == "download_server_file":
                                    server_name = fc.args["server_name"]
                                    remote_path = fc.args["remote_path"]
                                    print(f"[ADA DEBUG] [TOOL] Tool Call: 'download_server_file' Server='{server_name}' Path='{remote_path}'")
                                    local_filename = os.path.basename(remote_path)
                                    current_project_path = self.project_manager.get_current_project_path()
                                    local_dest = str(current_project_path / local_filename)
                                    
                                    result = await self.network_agent.download_file(server_name, remote_path, local_dest)
                                    if "error" in result:
                                        result_str = result["error"]
                                    else:
                                        result_str = result["message"]
                                    function_response = types.FunctionResponse(
                                        id=fc.id, name=fc.name, response={"result": result_str}
                                    )
                                    function_responses.append(function_response)

                                elif fc.name == "read_emails":
                                    limit = fc.args.get("limit", 10)
                                    priority_filter = fc.args.get("priority_filter", "all")
                                    print(f"[ADA DEBUG] [TOOL] Tool Call: 'read_emails' Limit={limit} Filter={priority_filter}")
                                    
                                    search_criteria = "ALL"
                                    if priority_filter.lower() == "urgent":
                                        search_criteria = '(HEADER X-Priority "1") OR (SUBJECT "URGENT")'
                                    elif priority_filter.lower() == "high":
                                        search_criteria = '(HEADER Importance "High")'
                                    elif priority_filter.lower() == "low":
                                        search_criteria = '(HEADER X-Priority "5")'
                                        
                                    result = await self.email_agent.read_emails(limit=limit, search_criteria=search_criteria)
                                    if "error" in result:
                                        result_str = result["error"]
                                        self._push_widget("error", {
                                            "title": "Email Authentication Error",
                                            "message": result["error"],
                                            "detail": "Update credentials in Settings → Email Integration."
                                        })
                                    else:
                                        emails = result.get("emails", [])
                                        if not emails:
                                            result_str = "Sir, there are no emails matching your request."
                                        else:
                                            # Push email summary as a widget card
                                            emails_text = []
                                            emails_data = []
                                            for e in emails:
                                                preview = (e.get("body_preview") or "")[:200]
                                                priority_tag = f"[{e.get('priority', 'normal').upper()}] " if e.get("priority") in ("urgent", "high") else ""
                                                emails_text.append(f"{priority_tag}From: {e.get('from', 'Unknown')}\nSubject: {e.get('subject', 'No subject')}\nPreview: {preview}")
                                                emails_data.append({
                                                    "from": e.get("from", "Unknown"),
                                                    "subject": e.get("subject", "No subject"),
                                                    "preview": e.get("body_preview", "")[:150],
                                                    "priority": e.get("priority", "normal")
                                                })
                                            self._push_widget("email_summary", {
                                                "count": result["count"],
                                                "emails": emails_data
                                            })
                                            urgent_count = sum(1 for e in emails if e.get("priority") in ("urgent", "high"))
                                            result_str = f"Sir, here are your {len(emails)} emails{' (' + str(urgent_count) + ' urgent)' if urgent_count else ''}:\n\n" + "\n---\n".join(emails_text)
                                    function_response = types.FunctionResponse(
                                        id=fc.id, name=fc.name, response={"result": result_str}
                                    )
                                    function_responses.append(function_response)

                                elif fc.name == "send_email":
                                    to = fc.args["to"]
                                    subject = fc.args["subject"]
                                    body = fc.args["body"]
                                    priority = fc.args.get("priority", "normal")
                                    cc = fc.args.get("cc")
                                    print(f"[ADA DEBUG] [TOOL] Tool Call: 'send_email' To='{to}' Subject='{subject}' Priority={priority}")
                                    result = await self.email_agent.send_email(to, subject, body, priority=priority, cc=cc)
                                    if "error" in result:
                                        result_str = result["error"]
                                        self._push_widget("error", {
                                            "title": "Send Email Failed",
                                            "message": result["error"],
                                            "detail": "Check recipient address and email credentials in Settings."
                                        })
                                    else:
                                        result_str = result["message"]
                                    function_response = types.FunctionResponse(
                                        id=fc.id, name=fc.name, response={"result": result_str}
                                    )
                                    function_responses.append(function_response)

                                elif fc.name == "list_processes":
                                    sort_by = fc.args.get("sort_by", "cpu")
                                    limit = fc.args.get("limit", 20)
                                    print(f"[ADA DEBUG] [TOOL] Tool Call: 'list_processes' Sort={sort_by} Limit={limit}")
                                    result_str = await self.handle_list_processes(sort_by, limit)
                                    function_response = types.FunctionResponse(
                                        id=fc.id, name=fc.name, response={"result": result_str}
                                    )
                                    function_responses.append(function_response)

                                elif fc.name == "kill_process":
                                    target = fc.args["target"]
                                    force = fc.args.get("force", True)
                                    print(f"[ADA DEBUG] [TOOL] Tool Call: 'kill_process' Target='{target}' Force={force}")
                                    result_str = await self.handle_kill_process(target, force)
                                    function_response = types.FunctionResponse(
                                        id=fc.id, name=fc.name, response={"result": result_str}
                                    )
                                    function_responses.append(function_response)

                                elif fc.name == "system_command":
                                    command = fc.args["command"]
                                    run_as_admin = fc.args.get("run_as_admin", False)
                                    print(f"[ADA DEBUG] [TOOL] Tool Call: 'system_command' Cmd='{command[:60]}...' Admin={run_as_admin}")
                                    result_str = await self.handle_system_command(command, run_as_admin)
                                    function_response = types.FunctionResponse(
                                        id=fc.id, name=fc.name, response={"result": result_str}
                                    )
                                    function_responses.append(function_response)

                                elif fc.name == "clear_temp_files":
                                    scope = fc.args.get("scope", "user")
                                    print(f"[ADA DEBUG] [TOOL] Tool Call: 'clear_temp_files' Scope={scope}")
                                    result_str = await self.handle_clear_temp_files(scope)
                                    function_response = types.FunctionResponse(
                                        id=fc.id, name=fc.name, response={"result": result_str}
                                    )
                                    function_responses.append(function_response)

                                elif fc.name == "get_system_info":
                                    print(f"[ADA DEBUG] [TOOL] Tool Call: 'get_system_info'")
                                    result_str = await self.handle_get_system_info()
                                    function_response = types.FunctionResponse(
                                        id=fc.id, name=fc.name, response={"result": result_str}
                                    )
                                    function_responses.append(function_response)

                                elif fc.name == "get_weather":
                                    location = fc.args.get("location", "auto:ip")
                                    print(f"[ADA DEBUG] [TOOL] Tool Call: 'get_weather' Location='{location}'")
                                    result = await self.handle_get_weather(location)
                                    if isinstance(result, dict) and "error" in result:
                                        result_str = result["error"]
                                        self._push_widget("error", {
                                            "title": "Weather Unavailable",
                                            "message": result["error"],
                                            "detail": "Check your internet connection and try again."
                                        })
                                    else:
                                        result_str = result
                                    function_response = types.FunctionResponse(
                                        id=fc.id, name=fc.name, response={"result": result_str}
                                    )
                                    function_responses.append(function_response)

                                elif fc.name == "move_widget":
                                    widget_id = fc.args.get("widget_id", "")
                                    x = fc.args.get("x", 0)
                                    y = fc.args.get("y", 0)
                                    print(f"[ADA DEBUG] [TOOL] Tool Call: 'move_widget' id='{widget_id}' x={x} y={y}")
                                    if self.on_widget_move:
                                        self.on_widget_move({"widget_id": widget_id, "x": x, "y": y})
                                    result_str = f"Moved {widget_id} to position ({x}, {y})."
                                    function_response = types.FunctionResponse(
                                        id=fc.id, name=fc.name, response={"result": result_str}
                                    )
                                    function_responses.append(function_response)

                        if function_responses:
                            await self.session.send_tool_response(function_responses=function_responses)
                
                # Turn/Response Loop Finished
                self.flush_chat()
        except Exception as e:
            print(f"Error in receive_audio: {e}")
            traceback.print_exc()
            # CRITICAL: Re-raise to crash the TaskGroup and trigger outer loop reconnect
            raise e

    async def play_audio(self):
        import queue
        import threading
        
        try:
            stream = await asyncio.to_thread(
                pya.open,
                format=FORMAT,
                channels=CHANNELS,
                rate=RECEIVE_SAMPLE_RATE,
                output=True,
                output_device_index=self.output_device_index,
            )
        except Exception as e:
            print(f"[ADA] Failed to open audio output stream: {e}")
            return

        playback_queue = queue.Queue()
        self.event_loop = asyncio.get_running_loop()
        
        def playback_thread():
            while not self.stop_event.is_set():
                try:
                    bytestream = playback_queue.get(timeout=1.0)
                    if bytestream is None:
                        break
                    
                    if self.on_audio_data:
                        try:
                            self.event_loop.call_soon_threadsafe(lambda: self.on_audio_data(bytestream))
                        except Exception:
                            pass
                    
                    if stream.is_active():
                        stream.write(bytestream)
                except queue.Empty:
                    continue
                except Exception as e:
                    err_str = str(e).lower()
                    if "stream closed" in err_str or "pastreamisstopped" in err_str or "-9988" in err_str:
                        print(f"[ADA] Playback stream closed/stopped. Exiting thread.")
                        break
                    print(f"[ADA] Playback thread error: {e}")
                    break
                    
        t = threading.Thread(target=playback_thread, daemon=True)
        t.start()
        
        # Bridge async queue to sync thread queue
        try:
            while not self.stop_event.is_set():
                try:
                    bytestream = await asyncio.wait_for(self.audio_in_queue.get(), timeout=1.0)
                    playback_queue.put(bytestream)
                except asyncio.TimeoutError:
                    continue
        except asyncio.CancelledError:
            pass
        finally:
            playback_queue.put(None) # Signal thread to exit
            try:
                if stream.is_active():
                    stream.stop_stream()
                stream.close()
            except Exception:
                pass
            print("[ADA] Playback stream closed and thread signaled to exit.")

    async def get_frames(self):
        # Use CAP_DSHOW for Windows compatibility
        cap = await asyncio.to_thread(cv2.VideoCapture, 0, cv2.CAP_DSHOW)
        while True:
            if self.paused:
                await asyncio.sleep(0.1)
                continue
            frame = await asyncio.to_thread(self._get_frame, cap)
            if frame is None:
                break
            await asyncio.sleep(1.0)
            if self.out_queue:
                await self.out_queue.put(frame)
        cap.release()

    def _get_frame(self, cap):
        ret, frame = cap.read()
        if not ret:
            return None
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img = PIL.Image.fromarray(frame_rgb)
        img.thumbnail([1024, 1024])
        image_io = io.BytesIO()
        img.save(image_io, format="jpeg")
        image_io.seek(0)
        image_bytes = image_io.read()
        return {"mime_type": "image/jpeg", "data": base64.b64encode(image_bytes).decode()}

    async def _get_screen(self):
        pass 
    async def get_screen(self):
         pass

    async def start_subconscious_monitor(self):
        """Background task that monitors emails and system stats proactively."""
        print("[ADA] Subconscious Monitor started — hyper-aware mode engaged.")
        
        # Perform initial checks immediately (with small stagger)
        await asyncio.sleep(3)
        await self._check_emails_subconscious()
        await self._check_system_subconscious()
        
        last_email_check = time.time()
        last_system_check = time.time()
        
        while not self.stop_event.is_set():
            try:
                now = time.time()
                
                # 1. Check Emails every 30 seconds (more responsive)
                if now - last_email_check > 30 and self.email_agent and self.email_agent.connected:
                    last_email_check = now
                    try:
                        result = await self.email_agent.fetch_today_emails(limit=5)
                        if "emails" in result and result["count"] > 0:
                            urgent_emails = [e for e in result["emails"] if e.get("priority") == "urgent"]
                            if urgent_emails:
                                subject = urgent_emails[0]["subject"]
                                msg = f"Sir, I noticed an urgent email in your inbox regarding '{subject}'. Shall I read it to you?"
                                print(f"[ADA SUBCONSCIOUS] Proactive alert: {msg}")
                                if self.session:
                                    await self.session.send(input=msg, end_of_turn=True)
                    except Exception as e:
                        print(f"[ADA SUBCONSCIOUS] Email check failed: {e}")

                # 2. Check System Stats every 15 seconds (more responsive)
                if now - last_system_check > 15:
                    last_system_check = now
                    await self._check_system_subconscious()
                        
                await asyncio.sleep(3)
            except Exception as e:
                print(f"[ADA SUBCONSCIOUS] Monitor error: {e}")
                await asyncio.sleep(5)

    async def _check_system_subconscious(self):
        """Helper: check CPU/RAM and auto-remediate."""
        try:
            import psutil
            cpu = psutil.cpu_percent(interval=0.5)
            ram = psutil.virtual_memory().percent
            
            if cpu > 90:
                # Find the worst offender and kill it
                try:
                    processes = []
                    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent']):
                        try:
                            p = proc.info
                            if p['cpu_percent'] and p['cpu_percent'] > 20:
                                processes.append((p['cpu_percent'], p['pid'], p['name']))
                        except:
                            pass
                    processes.sort(reverse=True)
                    if processes:
                        top_cpu, top_pid, top_name = processes[0]
                        if self.session:
                            await self.session.send(
                                input=f"System: CPU at {cpu}%. {top_name} is using {top_cpu}%. Killing it to free resources.",
                                end_of_turn=True
                            )
                        await self.handle_kill_process(str(top_pid))
                except:
                    msg = f"System: CPU critically high at {cpu}%. Attempting automatic cleanup."
                    if self.session:
                        await self.session.send(input=msg, end_of_turn=True)
                        
            elif ram > 90:
                try:
                    processes = []
                    for proc in psutil.process_iter(['pid', 'name', 'memory_percent']):
                        try:
                            p = proc.info
                            if p['memory_percent'] and p['memory_percent'] > 10:
                                processes.append((p['memory_percent'], p['pid'], p['name']))
                        except:
                            pass
                    processes.sort(reverse=True)
                    if processes:
                        top_mem, top_pid, top_name = processes[0]
                        if self.session:
                            await self.session.send(
                                input=f"System: RAM at {ram}%. {top_name} is using {top_mem:.1f}%. Killing it to free memory.",
                                end_of_turn=True
                            )
                        await self.handle_kill_process(str(top_pid))
                except:
                    msg = f"System: RAM critically high at {ram}%. Attempting automatic cleanup."
                    if self.session:
                        await self.session.send(input=msg, end_of_turn=True)
        except Exception as e:
            print(f"[ADA SUBCONSCIOUS] System check failed: {e}")

    async def _check_emails_subconscious(self):
        """Helper: check for urgent emails, push widget, and summarize."""
        if not self.email_agent or not self.email_agent.connected:
            return
        try:
            result = await self.email_agent.fetch_today_emails(limit=5)
            if "error" in result:
                # Push error widget
                self._push_widget("error", {
                    "title": "Email Authentication Error",
                    "message": result["error"],
                    "detail": "Check your email credentials in Settings → Email Integration."
                })
                return
            if "emails" in result and result["count"] > 0:
                # Push email summary widget
                emails_data = []
                for e in result["emails"]:
                    emails_data.append({
                        "from": e.get("from", "Unknown"),
                        "subject": e.get("subject", "No subject"),
                        "preview": e.get("body_preview", "")[:120],
                        "priority": e.get("priority", "normal")
                    })
                self._push_widget("email_summary", {
                    "count": result["count"],
                    "emails": emails_data
                })
                # Alert on urgent
                urgent = [e for e in result["emails"] if e.get("priority") == "urgent"]
                if urgent:
                    preview = urgent[0].get("body_preview", "No content")[:150]
                    msg = (f"System: Urgent email from {urgent[0]['from']} — "
                           f"'{urgent[0]['subject']}'. Preview: {preview}")
                    print(f"[ADA SUBCONSCIOUS] Urgent email alert")
                    if self.session:
                        await self.session.send(input=msg, end_of_turn=True)
        except Exception as e:
            print(f"[ADA SUBCONSCIOUS] Email check error: {e}")

    # ============================================================
    # SYSTEM CONTROL — ULTIMATE AGENT POWERS
    # ============================================================

    async def handle_list_processes(self, sort_by="cpu", limit=20):
        """Lists running processes with CPU and memory usage."""
        import psutil
        try:
            processes = []
            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'create_time', 'username']):
                try:
                    info = proc.info
                    if info['cpu_percent'] is not None or info['memory_percent'] is not None:
                        processes.append(info)
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass
            
            if sort_by == "cpu":
                processes.sort(key=lambda p: p.get('cpu_percent', 0) or 0, reverse=True)
            elif sort_by == "memory":
                processes.sort(key=lambda p: p.get('memory_percent', 0) or 0, reverse=True)
            else:
                processes.sort(key=lambda p: (p.get('name', '') or '').lower())
            
            top = processes[:limit]
            lines = [f"{'PID':>6} {'CPU%':>5} {'MEM%':>5} {'NAME':<30}" , "-"*50]
            for p in top:
                name = (p.get('name') or 'unknown')[:28]
                cpu = f"{p.get('cpu_percent', 0) or 0:.1f}"
                mem = f"{p.get('memory_percent', 0) or 0:.1f}"
                lines.append(f"{p['pid']:>6} {cpu:>5} {mem:>5} {name:<30}")
            
            return "\n".join(lines)
        except Exception as e:
            return f"Failed to list processes: {e}"

    async def handle_kill_process(self, target, force=True):
        """Terminates a process by name or PID."""
        import psutil
        import signal
        try:
            killed = []
            if target.isdigit():
                pids = [int(target)]
            else:
                # Match by name (case-insensitive, partial)
                pids = []
                for proc in psutil.process_iter(['pid', 'name']):
                    try:
                        if target.lower() in (proc.info.get('name') or '').lower():
                            pids.append(proc.info['pid'])
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        pass
            
            for pid in pids:
                try:
                    proc = psutil.Process(pid)
                    name = proc.name()
                    if force:
                        proc.kill()
                    else:
                        proc.terminate()
                    killed.append(f"{name} (PID {pid})")
                except psutil.NoSuchProcess:
                    pass
                except psutil.AccessDenied:
                    return f"Access denied: cannot kill PID {pid}. Try running as administrator."
            
            if killed:
                return f"Terminated: {', '.join(killed)}."
            return f"No process found matching '{target}'."
        except Exception as e:
            return f"Failed to kill process: {e}"

    async def handle_system_command(self, command, run_as_admin=False):
        """Executes a system command and returns output."""
        import subprocess
        try:
            full_cmd = ["powershell", "-Command", command]
            result = await asyncio.create_subprocess_exec(
                *full_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await asyncio.wait_for(result.communicate(), timeout=30)
            output = stdout.decode('utf-8', errors='ignore').strip()
            error = stderr.decode('utf-8', errors='ignore').strip()
            
            if output and error:
                return f"Output:\n{output[:2000]}\nErrors:\n{error[:500]}"
            elif output:
                return f"Command executed successfully:\n{output[:2000]}"
            elif error:
                return f"Command completed with warnings:\n{error[:500]}"
            return "Command executed successfully. No output."
        except asyncio.TimeoutError:
            return "Command timed out after 30 seconds."
        except Exception as e:
            return f"Command failed: {e}"

    async def handle_clear_temp_files(self, scope="user"):
        """Clears temporary files to free disk space."""
        import subprocess
        import os
        import shutil
        try:
            results = []
            
            if scope in ("user", "all"):
                # Clean Windows user temp
                user_temp = os.environ.get("TEMP", "")
                if user_temp and os.path.exists(user_temp):
                    count = 0
                    for root, dirs, files in os.walk(user_temp, topdown=False):
                        for name in files:
                            try:
                                os.remove(os.path.join(root, name))
                                count += 1
                            except:
                                pass
                        for name in dirs:
                            try:
                                shutil.rmtree(os.path.join(root, name), ignore_errors=True)
                            except:
                                pass
                    results.append(f"Cleaned {count} files from user temp")
                
                # Clean browser cache locations
                cache_paths = [
                    os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\User Data\Default\Cache"),
                    os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Cache"),
                ]
                for cp in cache_paths:
                    if os.path.exists(cp):
                        try:
                            shutil.rmtree(cp, ignore_errors=True)
                            results.append(f"Cleared browser cache: {cp}")
                        except:
                            pass
            
            if scope in ("system", "all"):
                # Run Windows Disk Cleanup for system files
                proc = await asyncio.create_subprocess_exec(
                    "powershell", "-Command",
                    "CleanMgr /sagerun:1 | Out-Null",
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                try:
                    await asyncio.wait_for(proc.communicate(), timeout=60)
                    results.append("Ran Windows Disk Cleanup")
                except asyncio.TimeoutError:
                    results.append("Disk Cleanup timed out (may still run in background)")
            
            # Clear recycle bin
            try:
                subprocess.run(["powershell", "-Command", "Clear-RecycleBin -Force"],
                             capture_output=True, timeout=10)
                results.append("Emptied Recycle Bin")
            except:
                pass
            
            return " | ".join(results) if results else "Nothing to clean."
        except Exception as e:
            return f"Cleanup failed: {e}"

    async def handle_get_system_info(self):
        """Returns comprehensive system information."""
        import psutil
        import platform
        import subprocess
        try:
            uname = platform.uname()
            cpu = platform.processor()
            cpu_count = psutil.cpu_count(logical=True)
            cpu_phys = psutil.cpu_count(logical=False)
            ram = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            net = psutil.net_io_counters()
            boot_time = datetime.datetime.fromtimestamp(psutil.boot_time())
            
            # GPU info
            gpu_info = "N/A"
            try:
                result = subprocess.run(
                    ['nvidia-smi', '--query-gpu=name,utilization.gpu,memory.used,memory.total',
                     '--format=csv,noheader,nounits'],
                    capture_output=True, text=True, timeout=5
                )
                if result.returncode == 0:
                    gpu_info = result.stdout.strip()
            except:
                pass
            
            info = (
                f"OS: {uname.system} {uname.release} ({uname.version})\n"
                f"Host: {uname.node}\n"
                f"CPU: {cpu} ({cpu_phys} physical / {cpu_count} logical cores)\n"
                f"RAM: {ram.used / 1e9:.1f}GB / {ram.total / 1e9:.1f}GB ({ram.percent}% used)\n"
                f"Disk: {disk.used / 1e9:.1f}GB / {disk.total / 1e9:.1f}GB ({disk.percent}% used)\n"
                f"Network: {net.bytes_sent / 1e9:.1f}GB sent / {net.bytes_recv / 1e9:.1f}GB received\n"
                f"Boot: {boot_time.strftime('%Y-%m-%d %H:%M:%S')}\n"
                f"GPU: {gpu_info}"
            )
            return info
        except Exception as e:
            return f"Failed to get system info: {e}"

    # ============================================================
    # WEATHER
    # ============================================================

    async def handle_get_weather(self, location):
        """Fetches weather data from wttr.in (free, no API key)."""
        try:
            import json
            import urllib.request
            import urllib.parse
            
            encoded = urllib.parse.quote(location)
            url = f"https://wttr.in/{encoded}?format=j1"
            
            loop = asyncio.get_event_loop()
            req = urllib.request.Request(url, headers={"User-Agent": "curl/8.0"})
            
            def fetch():
                with urllib.request.urlopen(req, timeout=10) as resp:
                    return resp.read().decode("utf-8")
            
            raw = await loop.run_in_executor(None, fetch)
            data = json.loads(raw)
            
            if "error" in data:
                return {"error": data["error"].get("msg", "Location not found")}
            
            cc = data.get("current_condition", [{}])[0]
            area = data.get("nearest_area", [{}])[0]
            city = area.get("areaName", [{}])[0].get("value", location)
            region = area.get("region", [{}])[0].get("value", "")
            country = area.get("country", [{}])[0].get("value", "")
            
            temp_c = cc.get("temp_C", "?")
            feels = cc.get("FeelsLikeC", "?")
            desc = cc.get("weatherDesc", [{}])[0].get("value", "Unknown")
            humidity = cc.get("humidity", "?")
            wind = cc.get("windspeedKmph", "?")
            wind_dir = cc.get("winddir16Point", "?")
            visibility = cc.get("visibility", "?")
            uv = cc.get("uvIndex", "?")
            
            # Forecast
            forecast = data.get("weather", [])[1:4]  # Next 3 days
            forecast_lines = []
            for day in forecast:
                date = day.get("date", "")
                hi = day.get("maxtempC", "?")
                lo = day.get("mintempC", "?")
                desc_d = day.get("hourly", [{}])[0].get("weatherDesc", [{}])[0].get("value", "")
                forecast_lines.append(f"{date}: {desc_d}, {lo}-{hi}°C")
            
            result_text = (
                f"Weather in {city}, {region} ({country}):\n"
                f"Current: {desc}, {temp_c}°C (feels {feels}°C)\n"
                f"Humidity: {humidity}% | Wind: {wind} km/h {wind_dir}\n"
                f"Visibility: {visibility} km | UV: {uv}\n"
                f"Forecast:\n" + "\n".join(forecast_lines)
            )
            
            # Also push as a widget
            self._push_widget("weather", {
                "city": f"{city}, {region}",
                "temp": temp_c,
                "feels": feels,
                "description": desc,
                "humidity": humidity,
                "wind": f"{wind} km/h {wind_dir}",
                "forecast": [{"date": f.get("date",""), "hi": f.get("maxtempC",""), "lo": f.get("mintempC",""), "desc": f.get("hourly",[{}])[0].get("weatherDesc",[{}])[0].get("value","")} for f in forecast],
                "icon_url": f"https://wttr.in/{encoded}_0p.png"
            })
            
            return result_text
        except urllib.request.URLError:
            return {"error": "Weather API unreachable. Check your internet connection."}
        except Exception as e:
            return {"error": f"Weather fetch failed: {e}"}

    # ============================================================
    # WIDGET SYSTEM — push data cards to frontend
    # ============================================================

    def _push_widget(self, widget_type, data):
        """Pushes a widget card to the frontend via the widget_update callback."""
        if self.on_widget_update:
            try:
                self.on_widget_update({"type": widget_type, "data": data})
            except Exception as e:
                print(f"[ADA] Widget push error: {e}")

    async def run(self, start_message=None):
        retry_delay = 1
        is_reconnect = False
        
        while not self.stop_event.is_set():
            try:
                print(f"[ADA DEBUG] [CONNECT] Connecting to Gemini Live API...")
                async with (
                    client.aio.live.connect(model=MODEL, config=config) as session,
                    asyncio.TaskGroup() as tg,
                ):
                    self.session = session

                    self.audio_in_queue = asyncio.Queue()
                    self.out_queue = asyncio.Queue(maxsize=10)

                    tg.create_task(self.send_realtime())
                    tg.create_task(self.listen_audio())
                    # tg.create_task(self._process_video_queue()) # Removed in favor of VAD

                    if self.video_mode == "camera":
                        tg.create_task(self.get_frames())
                    elif self.video_mode == "screen":
                        tg.create_task(self.get_screen())

                    tg.create_task(self.receive_audio())
                    tg.create_task(self.play_audio())
                    tg.create_task(self.monitor_model_speaking())
                    tg.create_task(self.start_subconscious_monitor())

                    # Handle Startup vs Reconnect Logic
                    if not is_reconnect:
                        # Always send a proactive startup trigger if no explicit start_message
                        if start_message:
                            print(f"[ADA DEBUG] [INFO] Sending start message: {start_message}")
                            await self.session.send(input=start_message, end_of_turn=True)
                        else:
                            # Brief cue for AI to greet once, then wait
                            print(f"[ADA DEBUG] [INFO] Auto-sending startup greeting cue")
                            await self.session.send(input="System Event: Audio pipeline ready. Greet the user once briefly, then wait.", end_of_turn=True)
                        
                        # Sync Project State
                        if self.on_project_update and self.project_manager:
                            self.on_project_update(self.project_manager.current_project)
                        
                        # Pre-connect email agent for subconscious monitor
                        try:
                            if self.email_agent and not self.email_agent.connected:
                                if self.email_agent.email_address and self.email_agent.password:
                                    conn = self.email_agent.connect()
                                    if "error" in conn:
                                        print(f"[ADA] Startup email connect failed: {conn['error']}")
                                    else:
                                        print(f"[ADA] Email agent connected on startup for subconscious monitoring.")
                        except Exception as e:
                            print(f"[ADA] Startup email connect error: {e}")
                    
                    else:
                        print(f"[ADA DEBUG] [RECONNECT] Connection restored.")
                        # Restore Context
                        print(f"[ADA DEBUG] [RECONNECT] Fetching recent chat history to restore context...")
                        history = self.project_manager.get_recent_chat_history(limit=10)
                        
                        context_msg = "System Notification: Connection was lost and just re-established. Here is the recent chat history to help you resume seamlessly:\n\n"
                        for entry in history:
                            sender = entry.get('sender', 'Unknown')
                            text = entry.get('text', '')
                            context_msg += f"[{sender}]: {text}\n"
                        
                        context_msg += "\nPlease acknowledge the reconnection to the user (e.g. 'I lost connection for a moment, but I'm back...') and resume what you were doing."
                        
                        print(f"[ADA DEBUG] [RECONNECT] Sending restoration context to model...")
                        await self.session.send(input=context_msg, end_of_turn=True)

                    # Reset retry delay on successful connection
                    retry_delay = 1
                    
                    # Wait until stop event, or until the session task group exits (which happens on error)
                    # Actually, the TaskGroup context manager will exit if any tasks fail/cancel.
                    # We need to keep this block alive.
                    # The original code just waited on stop_event, but that doesn't account for session death.
                    # We should rely on the TaskGroup raising an exception when subtasks fail (like receive_audio).
                    
                    # However, since receive_audio is a task in the group, if it crashes (connection closed), 
                    # the group will cancel others and exit. We catch that exit below.
                    
                    # We can await stop_event, but if the connection dies, receive_audio crashes -> group closes -> we exit `async with` -> restart loop.
                    # To ensure we don't block indefinitely if connection dies silently (unlikely with receive_audio), we just wait.
                    await self.stop_event.wait()

            except asyncio.CancelledError:
                print(f"[ADA DEBUG] [STOP] Main loop cancelled.")
                break
                
            except Exception as e:
                # This catches the ExceptionGroup from TaskGroup or direct exceptions
                print(f"[ADA DEBUG] [ERR] Connection Error: {e}")
                
                if self.stop_event.is_set():
                    break
                
                print(f"[ADA DEBUG] [RETRY] Reconnecting in {retry_delay} seconds...")
                await asyncio.sleep(retry_delay)
                retry_delay = min(retry_delay * 2, 10) # Exponential backoff capped at 10s
                is_reconnect = True # Next loop will be a reconnect
                
            finally:
                # Cleanup before retry
                if hasattr(self, 'audio_stream') and self.audio_stream:
                    try:
                        self.audio_stream.close()
                    except: 
                        pass

def get_input_devices():
    p = pyaudio.PyAudio()
    info = p.get_host_api_info_by_index(0)
    numdevices = info.get('deviceCount')
    devices = []
    for i in range(0, numdevices):
        if (p.get_device_info_by_host_api_device_index(0, i).get('maxInputChannels')) > 0:
            devices.append((i, p.get_device_info_by_host_api_device_index(0, i).get('name')))
    p.terminate()
    return devices

def get_output_devices():
    p = pyaudio.PyAudio()
    info = p.get_host_api_info_by_index(0)
    numdevices = info.get('deviceCount')
    devices = []
    for i in range(0, numdevices):
        if (p.get_device_info_by_host_api_device_index(0, i).get('maxOutputChannels')) > 0:
            devices.append((i, p.get_device_info_by_host_api_device_index(0, i).get('name')))
    p.terminate()
    return devices

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--mode",
        type=str,
        default=DEFAULT_MODE,
        help="pixels to stream from",
        choices=["camera", "screen", "none"],
    )
    args = parser.parse_args()
    main = AudioLoop(video_mode=args.mode)
    asyncio.run(main.run())