"""Computer Control Bridge: gives A.P.A eyes and hands on the Windows desktop.

Native implementation (no external MCP server needed):
  - eyes:   Pillow ImageGrab screenshots, window list, Windows UI Automation tree
  - hands:  pyautogui mouse/keyboard, clipboard paste for Unicode text
  - pointer: A.P.A's OWN cursor, a click-through glowing ring drawn on top of the
            screen (pointer_overlay.py). It shows the user where to look
            without moving their real mouse (the idea comes from Bluey).

Safety model (unchanged):
  - read-only tools (look / list / point) run without confirmation;
  - actuator tools (click / type / keys / open) go through ADA's confirmation gate;
  - computer_emergency_stop instantly disables every actuator until resumed;
  - pyautogui FAILSAFE: slam the mouse into a screen corner to abort.

Coordinates: screenshots are sent to the model scaled to <= 1280 px wide.
Coordinates the model passes back are in THAT screenshot's pixel space and are
converted to native screen pixels here.
"""

import asyncio
import base64
import io
import os
import subprocess
import sys
import time

_HERE = os.path.dirname(os.path.abspath(__file__))

READONLY_COMPUTER_TOOLS = {
    "computer_list_windows",
    "computer_screenshot",
    "computer_find_text",
    "computer_point",          # A.P.A's own pointer: never touches the real mouse
}
SAFETY_COMPUTER_TOOLS = {"computer_emergency_stop"}
ACTUATOR_COMPUTER_TOOLS = {
    "computer_click_text",
    "computer_mouse_click",
    "computer_mouse_move",
    "computer_type",
    "computer_key",
    "computer_hotkey",
    "computer_focus_window",
    "computer_open",
}
ALLOWED_COMPUTER_TOOLS = READONLY_COMPUTER_TOOLS | SAFETY_COMPUTER_TOOLS | ACTUATOR_COMPUTER_TOOLS

MAX_RESULT_CHARS = 3500
SHOT_MAX_WIDTH = 1280

_state = {"stopped": False, "scale": 1.0, "dpi_set": False}


# ------------------------------------------------------------- helpers ----
def _dpi_aware():
    if _state["dpi_set"] or sys.platform != "win32":
        return
    try:
        import ctypes
        ctypes.windll.shcore.SetProcessDpiAwareness(2)   # per-monitor: real pixels
    except Exception:
        try:
            import ctypes
            ctypes.windll.user32.SetProcessDPIAware()
        except Exception:
            pass
    _state["dpi_set"] = True


def _pg():
    _dpi_aware()
    import pyautogui
    pyautogui.FAILSAFE = True
    pyautogui.PAUSE = 0.05
    return pyautogui


def _to_native(x, y):
    s = _state["scale"] or 1.0
    return int(round(float(x) / s)), int(round(float(y) / s))


def _screenshot():
    """Returns (jpeg_bytes, w, h, native_w, native_h) and remembers the scale."""
    _dpi_aware()
    from PIL import ImageGrab
    img = ImageGrab.grab(all_screens=False)
    nw, nh = img.size
    scale = min(1.0, SHOT_MAX_WIDTH / nw)
    if scale < 1.0:
        img = img.resize((int(nw * scale), int(nh * scale)))
    _state["scale"] = scale
    buf = io.BytesIO()
    img.convert("RGB").save(buf, format="JPEG", quality=70)
    return buf.getvalue(), img.size[0], img.size[1], nw, nh


def _windows():
    import pygetwindow as gw
    out = []
    for w in gw.getAllWindows():
        t = (w.title or "").strip()
        if not t or w.width < 80 or w.height < 60:
            continue
        out.append(w)
    return out


ADA_TITLES = ("A.P.A V2", "A.D.A")


def _hide_ada():
    """Minimise A.P.A's own window so screenshots/clicks hit the user's real desktop."""
    try:
        for w in _windows():
            if any(t in w.title for t in ADA_TITLES) and not w.isMinimized:
                w.minimize()
                time.sleep(0.45)
    except Exception:
        pass


def _target_window():
    """Top-most visible window that is not A.P.A itself."""
    for w in _windows():
        if not any(t in w.title for t in ADA_TITLES) and not w.isMinimized:
            return w
    return None


def _find_window(title):
    title = (title or "").lower()
    for w in _windows():
        if title in w.title.lower():
            return w
    return None


def _find_element(text, app=None, max_nodes=4000):
    """Breadth-first search of the UI Automation tree for an element whose Name matches."""
    import uiautomation as auto
    text_l = (text or "").strip().lower()
    if not text_l:
        return None
    if app:
        w = _find_window(app)
        root = auto.ControlFromHandle(w._hWnd) if w else auto.GetForegroundControl()
    else:
        tw = _target_window()
        root = auto.ControlFromHandle(tw._hWnd) if tw else auto.GetForegroundControl()
    if root is None:
        return None
    queue, seen, partial = [root], 0, None
    while queue and seen < max_nodes:
        ctrl = queue.pop(0)
        seen += 1
        try:
            name = (ctrl.Name or "").strip().lower()
            if name:
                if name == text_l:
                    return ctrl
                if partial is None and text_l in name:
                    partial = ctrl
            queue.extend(ctrl.GetChildren())
        except Exception:
            continue
    return partial


def _center(ctrl):
    r = ctrl.BoundingRectangle
    return (r.left + r.right) // 2, (r.top + r.bottom) // 2


def _show_pointer(x, y, label="", seconds=4.0, color="#22d3ee"):
    """Spawn A.P.A's pointer overlay at native pixel (x, y). Non-blocking."""
    script = os.path.join(_HERE, "pointer_overlay.py")
    flags = 0x08000000 if sys.platform == "win32" else 0   # CREATE_NO_WINDOW
    subprocess.Popen([sys.executable, script, str(int(x)), str(int(y)), str(label)[:60], str(seconds), color],
                     creationflags=flags)


KEY_ALIASES = {"ENTER": "enter", "RETURN": "enter", "ESC": "esc", "ESCAPE": "esc", "WIN": "win",
               "WINDOWS": "win", "CTRL": "ctrl", "CONTROL": "ctrl", "ALT": "alt", "SHIFT": "shift",
               "DEL": "delete", "BACKSPACE": "backspace", "SPACE": "space", "TAB": "tab",
               "UP": "up", "DOWN": "down", "LEFT": "left", "RIGHT": "right", "PGUP": "pageup", "PGDN": "pagedown"}


def _key(k):
    k = str(k).strip()
    return KEY_ALIASES.get(k.upper(), k.lower())


KNOWN_FOLDERS = {"desktop": "Desktop", "documents": "Documents", "downloads": "Downloads",
                 "pictures": "Pictures", "music": "Music", "videos": "Videos"}


def _resolve_path(target):
    """Folder/file under the user's home (OneDrive-redirected Desktop included)."""
    home = os.path.expanduser("~")
    t = (target or "").strip().strip('"')
    if os.path.isabs(t):
        return t if os.path.exists(t) else None
    parts = [p for p in t.replace("\\", "/").split("/") if p]
    if parts and parts[0].lower() in KNOWN_FOLDERS:
        base_name = KNOWN_FOLDERS[parts[0].lower()]
        for base in (os.path.join(home, "OneDrive", base_name), os.path.join(home, base_name)):
            cand = os.path.join(base, *parts[1:])
            if os.path.exists(cand):
                return cand
            # forgiving match for the last part ("assignment" vs "assingment")
            parent = os.path.dirname(cand)
            if parts[1:] and os.path.isdir(parent):
                import difflib
                names = os.listdir(parent)
                lower = {n.lower(): n for n in names}
                hit = difflib.get_close_matches(parts[-1].lower(), list(lower), n=1, cutoff=0.75)
                if hit:
                    return os.path.join(parent, lower[hit[0]])
    return None


SAFE_APPS = {"notepad": "notepad.exe", "calculator": "calc.exe", "calc": "calc.exe", "paint": "mspaint.exe",
             "explorer": "explorer.exe", "file explorer": "explorer.exe", "cmd": None, "terminal": None}


# -------------------------------------------------------------- tools -----
def _run(name, args):
    out = {"texts": [], "images": [], "raw_images": [], "is_error": False}
    if name in ACTUATOR_COMPUTER_TOOLS and _state["stopped"]:
        return {**out, "texts": ["Computer control is under EMERGENCY STOP. Ask the user to resume it in A.P.A."], "is_error": True}

    if name in ACTUATOR_COMPUTER_TOOLS or name in ("computer_screenshot", "computer_point"):
        _hide_ada()

    if name == "computer_emergency_stop":
        _state["stopped"] = True
        out["texts"].append("Emergency stop engaged: all mouse and keyboard control disabled.")

    elif name == "computer_list_windows":
        ws = _windows()
        lines = [f"- {w.title} {'(active)' if w.isActive else ''} [{w.width}x{w.height}]" for w in ws[:40]]
        out["texts"].append("Open windows:\n" + "\n".join(lines) if lines else "No visible windows.")

    elif name == "computer_screenshot":
        jpg, w, h, nw, nh = _screenshot()
        out["raw_images"].append(jpg)
        out["images"].append(base64.b64encode(jpg).decode())
        out["texts"].append(f"Screenshot taken ({w}x{h}, native {nw}x{nh}). I am sending you the image now. "
                            "Coordinates you pass to computer_mouse_click / computer_point use THIS image's pixels.")

    elif name == "computer_find_text":
        ctrl = _find_element(args.get("text"), args.get("app"))
        if not ctrl:
            out["texts"].append(f"No element named '{args.get('text')}' found in the active window.")
            out["is_error"] = True
        else:
            x, y = _center(ctrl)
            s = _state["scale"]
            out["texts"].append(f"Found '{ctrl.Name}' ({ctrl.ControlTypeName}) at screenshot coords ({int(x*s)}, {int(y*s)}).")

    elif name == "computer_point":
        try:
            import bluey_buddy
        except Exception:
            bluey_buddy = None
        label = args.get("label") or args.get("text") or ""
        if args.get("text"):
            ctrl = _find_element(args["text"], args.get("app"))
            if not ctrl:
                return {**out, "texts": [f"Couldn't find '{args['text']}' on screen to point at."], "is_error": True}
            x, y = _center(ctrl)
        else:
            x, y = _to_native(args.get("x", 0), args.get("y", 0))
        if bluey_buddy and bluey_buddy.ensure_running():
            time.sleep(0.3)
            bluey_buddy.send_command("point", x=x, y=y, label=label, seconds=float(args.get("seconds", 4)))
        _show_pointer(x, y, "", float(args.get("seconds", 4)))
        out["texts"].append(f"Bluey flew over and is pointing at ({x}, {y}). The user's mouse was not moved.")

    elif name == "computer_mouse_move":
        pg = _pg()
        x, y = _to_native(args["x"], args["y"])
        pg.moveTo(x, y, duration=0.35)
        out["texts"].append(f"Mouse moved to ({x}, {y}).")

    elif name == "computer_mouse_click":
        pg = _pg()
        x, y = _to_native(args["x"], args["y"])
        _show_pointer(x, y, "click", 1.2, "#fbbf24")
        pg.click(x, y, button=(args.get("button") or "left").lower())
        out["texts"].append(f"Clicked at ({x}, {y}).")

    elif name == "computer_click_text":
        ctrl = _find_element(args.get("text"), args.get("app"))
        if not ctrl:
            return {**out, "texts": [f"Couldn't find '{args.get('text')}' to click. Take a screenshot and use computer_mouse_click instead."], "is_error": True}
        x, y = _center(ctrl)
        _show_pointer(x, y, "click", 1.2, "#fbbf24")
        _pg().click(x, y)
        out["texts"].append(f"Clicked '{ctrl.Name}'.")

    elif name == "computer_type":
        pg = _pg()
        text = str(args.get("text", ""))
        if text.isascii():
            pg.write(text, interval=0.01)
        else:                                   # Unicode: paste via clipboard
            import pyperclip
            old = pyperclip.paste()
            pyperclip.copy(text)
            pg.hotkey("ctrl", "v")
            time.sleep(0.2)
            pyperclip.copy(old)
        out["texts"].append(f"Typed {len(text)} characters.")

    elif name == "computer_key":
        _pg().press(_key(args.get("key", "enter")))
        out["texts"].append(f"Pressed {args.get('key')}.")

    elif name == "computer_hotkey":
        keys = [_key(k) for k in (args.get("keys") or [])]
        _pg().hotkey(*keys)
        out["texts"].append(f"Pressed {'+'.join(keys)}.")

    elif name == "computer_focus_window":
        w = _find_window(args.get("title"))
        if not w:
            return {**out, "texts": [f"No window titled like '{args.get('title')}'."], "is_error": True}
        try:
            if w.isMinimized:
                w.restore()
            w.activate()
        except Exception:
            _pg().click(w.left + w.width // 2, w.top + 10)
        out["texts"].append(f"Focused '{w.title}'.")

    elif name == "computer_open":
        target = str(args.get("target", "")).strip()
        path = _resolve_path(target)
        if path:
            os.startfile(path)                  # folders open in File Explorer
            out["texts"].append(f"Opened {path}.")
        else:
            exe = SAFE_APPS.get(target.lower())
            if not exe:
                return {**out, "texts": [f"I can open folders/files under your home (e.g. 'Desktop/assingment') "
                                         f"or these apps: {', '.join(k for k, v in SAFE_APPS.items() if v)}. '{target}' isn't one."],
                        "is_error": True}
            subprocess.Popen([exe])
            out["texts"].append(f"Launched {target}.")
    else:
        out["texts"].append(f"Computer tool '{name}' is not available.")
        out["is_error"] = True
    return out


async def call_computer_tool(name, args=None, timeout=45.0):
    """Run one computer tool off the event loop. Returns {texts, images, raw_images, is_error}."""
    if name not in ALLOWED_COMPUTER_TOOLS:
        return {"texts": [f"Computer tool '{name}' is not permitted."], "images": [], "raw_images": [], "is_error": True}
    try:
        out = await asyncio.wait_for(asyncio.to_thread(_run, name, dict(args or {})), timeout=timeout)
    except asyncio.TimeoutError:
        out = {"texts": [f"Computer tool '{name}' timed out."], "images": [], "raw_images": [], "is_error": True}
    except ModuleNotFoundError as e:
        out = {"texts": [f"Computer control needs a missing package ({e.name}). Run: pip install -r requirements.txt"],
               "images": [], "raw_images": [], "is_error": True}
    except Exception as e:
        msg = "Mouse hit a screen corner (fail-safe), so I stopped." if "FailSafe" in type(e).__name__ else f"Computer control error: {e}"
        out = {"texts": [msg], "images": [], "raw_images": [], "is_error": True}
    joined = "\n".join(out["texts"])
    if len(joined) > MAX_RESULT_CHARS:
        out["texts"] = [joined[:MAX_RESULT_CHARS] + " ...[truncated]"]
    return out


def resume_control():
    _state["stopped"] = False


def is_stopped():
    return _state["stopped"]
