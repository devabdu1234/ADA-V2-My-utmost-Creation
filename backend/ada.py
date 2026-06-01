import asyncio
import os
import sys
import traceback
from dotenv import load_dotenv
import pyaudio
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
DEFAULT_MODE = "none"

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

config = types.LiveConnectConfig(
    response_modalities=["AUDIO"],
    output_audio_transcription={},
    input_audio_transcription={},
    system_instruction=(
        "You are A.P.A. (Autonomous Personal Assistant) — a friendly and helpful voice assistant. "
        "You can have natural conversations, answer questions, and help with tasks. "
        "You also have email capabilities: you can read, analyze, and send emails when asked. "
        "When the user asks about emails, use your tools to fetch and manage their inbox. "
        "For non-email topics, be conversational and helpful like a normal assistant. "
        "Be concise, warm, and natural. Address the user as 'Sir'."
    ),
    tools=tools_list,
    speech_config=types.SpeechConfig(
        voice_config=types.VoiceConfig(
            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                voice_name="Kore"
            )
        )
    )
)

pya = pyaudio.PyAudio()

from email_agent import EmailAgent


class AudioLoop:
    def __init__(self, video_mode=DEFAULT_MODE, on_audio_data=None, on_transcription=None, on_tool_confirmation=None, on_widget_update=None, on_error=None, input_device_index=None, input_device_name=None, output_device_index=None, sheets_logger=None):
        self.video_mode = video_mode
        self.on_audio_data = on_audio_data
        self.on_transcription = on_transcription
        self.on_tool_confirmation = on_tool_confirmation
        self.on_widget_update = on_widget_update
        self.on_error = on_error
        self.input_device_index = input_device_index
        self.input_device_name = input_device_name
        self.output_device_index = output_device_index
        self.sheets_logger = sheets_logger

        self.audio_in_queue = None
        self.out_queue = None
        self.paused = False

        self.chat_buffer = {"sender": None, "text": ""}
        self._last_input_transcription = ""
        self._last_output_transcription = ""

        self.session = None

        self.email_agent = EmailAgent()

        self.stop_event = asyncio.Event()

        self.permissions = {}
        self._pending_confirmations = {}

        self._is_speaking = False
        self._silence_start_time = None

        self._is_model_speaking = False
        self._model_silence_start = None
        self.MODEL_SPEAKING_TIMEOUT = 1.5

    def flush_chat(self):
        if self.chat_buffer["sender"] and self.chat_buffer["text"].strip():
            self.chat_buffer = {"sender": None, "text": ""}
        self._last_input_transcription = ""
        self._last_output_transcription = ""

    def update_permissions(self, new_perms):
        print(f"[ADA DEBUG] [CONFIG] Updating tool permissions: {new_perms}")
        self.permissions.update(new_perms)

    def set_paused(self, paused):
        self.paused = paused

    async def send_text(self, text):
        if self.session:
            await self.session.send(input=text, end_of_turn=True)

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
                print(f"[ADA DEBUG] [WARN] Request {request_id} future already done.")
        else:
            print(f"[ADA DEBUG] [WARN] Confirmation Request {request_id} not found in pending dict.")

    def clear_audio_queue(self):
        try:
            count = 0
            while not self.audio_in_queue.empty():
                self.audio_in_queue.get_nowait()
                count += 1
            if count > 0:
                print(f"[ADA DEBUG] [AUDIO] Cleared {count} chunks from playback queue due to interruption.")
        except Exception as e:
            print(f"[ADA DEBUG] [ERR] Failed to clear audio queue: {e}")

    async def send_realtime(self):
        while True:
            msg = await self.out_queue.get()
            await self.session.send(input=msg, end_of_turn=False)

    async def monitor_model_speaking(self):
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

        resolved_input_device_index = None

        if self.input_device_name:
            print(f"[ADA] Attempting to find input device matching: '{self.input_device_name}'")
            count = pya.get_device_count()
            best_match = None

            for i in range(count):
                dev_info = pya.get_device_info_by_index(i)
                dev_name = dev_info.get('name', '')
                if dev_info.get('maxInputChannels', 0) > 0:
                    if self.input_device_name.lower() in dev_name.lower():
                        best_match = i
                        print(f"[ADA] Found matching device: Index {i} -> {dev_name}")

            if best_match is not None:
                resolved_input_device_index = best_match
            else:
                print(f"[ADA] Could not find device with name '{self.input_device_name}'. Using default.")
        else:
            resolved_input_device_index = self.input_device_index if self.input_device_index is not None else mic_info.get('index')

        device_info = pya.get_device_info_by_index(resolved_input_device_index) if resolved_input_device_index is not None else mic_info
        print(f"[ADA] Using input device: Index {resolved_input_device_index} -> {device_info.get('name', 'Unknown')}")

        try:
            in_stream = await asyncio.to_thread(
                pya.open,
                format=FORMAT,
                channels=CHANNELS,
                rate=SEND_SAMPLE_RATE,
                input=True,
                input_device_index=resolved_input_device_index,
                frames_per_buffer=CHUNK_SIZE,
            )
        except Exception as e:
            print(f"[ADA] Failed to open input stream: {e}")
            return

        print("[ADA] Input stream opened successfully.")

        while not self.stop_event.is_set():
            if self.paused:
                await asyncio.sleep(0.1)
                continue
            try:
                data = await asyncio.to_thread(in_stream.read, CHUNK_SIZE, exception_on_overflow=False)
                if self._is_model_speaking:
                    continue
                await self.out_queue.put({"data": data, "mime_type": "audio/pcm;rate=16000"})
            except Exception as e:
                print(f"[ADA] Error reading audio stream: {e}")
                break

    async def receive_audio(self):
        try:
            while True:
                turn = self.session.receive()
                async for response in turn:
                    if data := response.data:
                        self.audio_in_queue.put_nowait(data)
                        self._is_model_speaking = True
                        self._model_silence_start = None

                    if response.server_content:
                        if response.server_content.input_transcription:
                            transcript = response.server_content.input_transcription.text
                            if transcript:
                                if transcript != self._last_input_transcription:
                                    delta = transcript
                                    if transcript.startswith(self._last_input_transcription):
                                        delta = transcript[len(self._last_input_transcription):]
                                    self._last_input_transcription = transcript
                                    if delta:
                                        self.clear_audio_queue()
                                        self._is_model_speaking = False
                                        self._model_silence_start = None
                                        if self.on_transcription:
                                            self.on_transcription({"sender": "User", "text": delta})
                                        if self.chat_buffer["sender"] != "User":
                                            if self.chat_buffer["sender"] and self.chat_buffer["text"].strip():
                                                pass
                                            self.chat_buffer = {"sender": "User", "text": delta}
                                        else:
                                            self.chat_buffer["text"] += delta

                        if response.server_content.output_transcription:
                            transcript = response.server_content.output_transcription.text
                            if transcript:
                                if transcript != self._last_output_transcription:
                                    delta = transcript
                                    if transcript.startswith(self._last_output_transcription):
                                        delta = transcript[len(self._last_output_transcription):]
                                    self._last_output_transcription = transcript
                                    if delta:
                                        if self.on_transcription:
                                            self.on_transcription({"sender": "ADA", "text": delta})
                                        if self.chat_buffer["sender"] != "ADA":
                                            if self.chat_buffer["sender"] and self.chat_buffer["text"].strip():
                                                pass
                                            self.chat_buffer = {"sender": "ADA", "text": delta}
                                        else:
                                            self.chat_buffer["text"] += delta

                    if response.tool_call:
                        print("The tool was called")
                        function_responses = []
                        for fc in response.tool_call.function_calls:
                            if fc.name in ["read_emails", "send_email"]:
                                prompt = fc.args.get("prompt", "")
                                confirmation_required = self.permissions.get(fc.name, True)

                                if not confirmation_required:
                                    print(f"[ADA DEBUG] [TOOL] Permission check: '{fc.name}' -> AUTO-ALLOW")
                                    pass
                                else:
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
                                        confirmed = await future
                                    finally:
                                        self._pending_confirmations.pop(request_id, None)

                                    print(f"[ADA DEBUG] [CONFIRM] Request {request_id} resolved. Confirmed: {confirmed}")

                                    if not confirmed:
                                        print(f"[ADA DEBUG] [DENY] Tool call '{fc.name}' denied by user.")
                                        function_response = types.FunctionResponse(
                                            id=fc.id,
                                            name=fc.name,
                                            response={"result": "User denied the request to use this tool."}
                                        )
                                        function_responses.append(function_response)
                                        continue

                                if fc.name == "read_emails":
                                    limit = fc.args.get("limit", 10)
                                    print(f"[ADA DEBUG] [TOOL] Tool Call: 'read_emails' Limit={limit}")
                                    result = await asyncio.wait_for(self.email_agent.read_emails(limit=limit), timeout=30.0)
                                    if "error" in result:
                                        result_str = result["error"]
                                        self._push_widget("error", {
                                            "title": "Email Error",
                                            "message": result["error"],
                                            "detail": "Update credentials in Settings."
                                        })
                                    else:
                                        emails = result.get("emails", [])
                                        if not emails:
                                            result_str = "Sir, there are no emails matching your request."
                                        else:
                                            emails_text = []
                                            emails_data = []
                                            for e in emails:
                                                priority_tag = f"[{e.get('priority', 'Medium').upper()}] " if e.get("priority") == "High" else ""
                                                escalation_tag = "🚨 ESCALATED " if e.get("is_escalated") else ""
                                                emails_text.append(f"{escalation_tag}{priority_tag}From: {e.get('from', 'Unknown')}\nCategory: {e.get('category', 'N/A')}\nPriority: {e.get('priority', 'Medium')}\nSubject: {e.get('subject', 'No subject')}\nSummary: {e.get('summary', '')}")
                                                emails_data.append({
                                                    "from": e.get("from", "Unknown"),
                                                    "subject": e.get("subject", "No subject"),
                                                    "category": e.get("category", ""),
                                                    "priority": e.get("priority", "Medium"),
                                                    "sentiment": e.get("sentiment", "Neutral"),
                                                    "intensity": e.get("intensity", "Mild"),
                                                    "confidence": e.get("confidence", 0.5),
                                                    "is_escalated": e.get("is_escalated", False),
                                                    "summary": e.get("summary", ""),
                                                    "draft_reply": e.get("draft_reply", "")
                                                })
                                            if self.sheets_logger:
                                                try:
                                                    self.sheets_logger.log_batch(emails_data)
                                                except Exception as e:
                                                    print(f"[ADA SHEETS] Log batch failed: {e}")
                                            escalation_count = result.get("escalation_count", 0)
                                            low_conf_count = result.get("low_confidence_count", 0)
                                            self._push_widget("email_summary", {
                                                "count": result["count"],
                                                "emails": emails_data,
                                                "escalation_count": escalation_count,
                                                "low_confidence_count": low_conf_count
                                            })
                                            high_count = sum(1 for e in emails if e.get("priority") == "High")
                                            parts = [f"Sir, here are your {len(emails)} emails"]
                                            if escalation_count:
                                                parts.append(f"{escalation_count} require immediate attention")
                                            if high_count:
                                                parts.append(f"{high_count} high priority")
                                            result_str = f"{', '.join(parts)}:\n\n" + "\n---\n".join(emails_text)
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
                                    result = await asyncio.wait_for(self.email_agent.send_email(to, subject, body, priority=priority, cc=cc), timeout=30.0)
                                    if "error" in result:
                                        result_str = result["error"]
                                        self._push_widget("error", {
                                            "title": "Send Email Failed",
                                            "message": result["error"],
                                            "detail": "Check recipient address and email credentials in Settings."
                                        })
                                    else:
                                        if self.sheets_logger:
                                            try:
                                                self.sheets_logger.log_email_sent(to, subject, priority)
                                            except Exception as e:
                                                print(f"[ADA SHEETS] Log send failed: {e}")
                                        result_str = result["message"]
                                    function_response = types.FunctionResponse(
                                        id=fc.id, name=fc.name, response={"result": result_str}
                                    )
                                    function_responses.append(function_response)

                        if function_responses:
                            await self.session.send_tool_response(function_responses=function_responses)

                self.flush_chat()
        except Exception as e:
            print(f"Error in receive_audio: {e}")
            traceback.print_exc()
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
            playback_queue.put(None)
            try:
                if stream.is_active():
                    stream.stop_stream()
                stream.close()
            except Exception:
                pass
            print("[ADA] Playback stream closed and thread signaled to exit.")

    async def start_subconscious_monitor(self):
        """Background task that monitors emails proactively."""
        print("[ADA] Subconscious Monitor started — watching inbox.")
        await asyncio.sleep(3)
        await self._check_emails_subconscious()

        last_email_check = time.time()

        while not self.stop_event.is_set():
            try:
                now = time.time()
                if now - last_email_check > 120:
                    last_email_check = now
                    await self._check_emails_subconscious()
                await asyncio.sleep(3)
            except Exception as e:
                print(f"[ADA SUBCONSCIOUS] Monitor error: {e}")
                await asyncio.sleep(5)

    async def _check_emails_subconscious(self):
        if not self.email_agent or not self.email_agent.connected:
            return
        try:
            result = await asyncio.wait_for(self.email_agent.fetch_today_emails(limit=5), timeout=30.0)
            if "error" in result:
                self._push_widget("error", {
                    "title": "Email Authentication Error",
                    "message": result["error"],
                    "detail": "Check your email credentials in Settings."
                })
                return
            if "emails" in result and result["count"] > 0:
                emails_data = []
                for e in result["emails"]:
                    emails_data.append({
                        "from": e.get("from", "Unknown"),
                        "subject": e.get("subject", "No subject"),
                        "category": e.get("category", ""),
                        "priority": e.get("priority", "Medium"),
                        "sentiment": e.get("sentiment", "Neutral"),
                        "summary": e.get("summary", ""),
                    })
                self._push_widget("email_summary", {
                    "count": result["count"],
                    "emails": emails_data
                })
                high_priority = [e for e in result["emails"] if e.get("priority") == "High"]
                if high_priority:
                    print(f"[ADA SUBCONSCIOUS] High priority email (widget only, no interrupt)")
        except Exception as e:
            print(f"[ADA SUBCONSCIOUS] Email check error: {e}")

    def _push_widget(self, widget_type, data):
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
                    tg.create_task(self.receive_audio())
                    tg.create_task(self.play_audio())
                    tg.create_task(self.monitor_model_speaking())
                    tg.create_task(self.start_subconscious_monitor())

                    if not is_reconnect:
                        if start_message:
                            print(f"[ADA DEBUG] [INFO] Sending start message: {start_message}")
                            await self.session.send(input=start_message, end_of_turn=True)
                        else:
                            print(f"[ADA DEBUG] [INFO] Auto-sending startup greeting cue")
                            await self.session.send(input="System Event: Audio pipeline ready. Greet the user once briefly, then wait.", end_of_turn=True)

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

                    retry_delay = 1
                    await self.stop_event.wait()

            except asyncio.CancelledError:
                print(f"[ADA DEBUG] [STOP] Main loop cancelled.")
                break

            except Exception as e:
                print(f"[ADA DEBUG] [ERR] Connection Error: {e}")
                if self.stop_event.is_set():
                    break
                print(f"[ADA DEBUG] [RETRY] Reconnecting in {retry_delay} seconds...")
                await asyncio.sleep(retry_delay)
                retry_delay = min(retry_delay * 2, 10)
                is_reconnect = True

            finally:
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
    main = AudioLoop(video_mode="none")
    asyncio.run(main.run())
