"""Bluey: A.P.A's desktop companion and background HUD.

A googly-eyed blueberry that lives on top of your screen.
- Eyes follow your real mouse; blinks; bobs.
- Background HUD: while A.P.A works minimised, a mini panel next to Bluey shows
  every step live (running / done / denied) and what Ada is saying.
- Ask Bluey: click Bluey, type a command, press Enter; Ada does it.
- Double-click Bluey: bring the A.P.A window back.
- When A.P.A points at something, Bluey flies there and points at it.
- Only Bluey's own pixels catch clicks; everything transparent passes through.

Runs as its own process. Backend -> Bluey: JSON lines appended to BLUEY_CMD_FILE.
Bluey -> backend: POST http://127.0.0.1:8000/bluey/ask with a per-run secret token
(custom header, so web pages cannot forge it).
"""
import json
import math
import os
import sys
import tempfile
import time

BLUEY_CMD_FILE = os.path.join(tempfile.gettempdir(), "apa_bluey_cmds.jsonl")
BLUEY_PID_FILE = os.path.join(tempfile.gettempdir(), "apa_bluey.pid")
BACKEND = "http://127.0.0.1:8000"


# ----------------------------------------------------------- backend side ----
def send_command(action, **kw):
    """Queue a command for Bluey (append-only, so fast bursts are never lost)."""
    try:
        if os.path.exists(BLUEY_CMD_FILE) and os.path.getsize(BLUEY_CMD_FILE) > 200_000:
            open(BLUEY_CMD_FILE, "w").close()
        with open(BLUEY_CMD_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps({"action": action, **kw}) + "\n")
    except Exception as e:
        print(f"[BLUEY] send failed: {e}")


def _alive():
    try:
        import psutil
        with open(BLUEY_PID_FILE) as f:
            pid = int(f.read().strip())
        return psutil.pid_exists(pid) and "python" in psutil.Process(pid).name().lower()
    except Exception:
        return False


def ensure_running():
    """Start Bluey if it isn't on screen. Returns True when it is (or is starting)."""
    if sys.platform != "win32":
        return False
    if _alive():
        return True
    import subprocess
    subprocess.Popen([sys.executable, os.path.abspath(__file__)], creationflags=0x08000000)
    return True


def restart():
    """Fresh Bluey for a fresh backend (new auth token)."""
    if _alive():
        send_command("quit")
        for _ in range(20):
            time.sleep(0.1)
            if not _alive():
                break
    try:
        open(BLUEY_CMD_FILE, "w").close()
    except Exception:
        pass
    return ensure_running()


# ------------------------------------------------------------- Bluey side ----
TOOL_LABELS = {
    "read_emails": "Scanning inbox", "send_email": "Sending email", "get_weather": "Weather lock",
    "show_map": "Map lock", "gods_eye": "God's Eye scan", "start_focus_session": "Starting focus",
    "control_focus_session": "Focus control", "computer_screenshot": "Looking at screen",
    "computer_list_windows": "Listing windows", "computer_open": "Opening", "computer_click_text": "Clicking",
    "computer_mouse_click": "Clicking", "computer_type": "Typing", "computer_key": "Pressing key",
    "computer_hotkey": "Shortcut", "computer_focus_window": "Switching window", "computer_point": "Pointing",
    "computer_find_text": "Searching screen", "computer_mouse_move": "Moving mouse",
}


def main():
    import tkinter as tk
    try:
        import ctypes
        import ctypes.wintypes as wintypes
        ctypes.windll.shcore.SetProcessDpiAwareness(2)
        user32 = ctypes.windll.user32
    except Exception:
        ctypes = wintypes = user32 = None

    with open(BLUEY_PID_FILE, "w") as f:
        f.write(str(os.getpid()))
    token = os.environ.get("APA_BLUEY_TOKEN", "")

    KEY = "#010203"
    W, H = 470, 330
    BX, BY, R = 395, 262, 44          # Bluey centre inside the window
    HUD_X, HUD_Y, HUD_W = 8, 8, 330   # background HUD card

    root = tk.Tk()
    root.overrideredirect(True)
    root.attributes("-topmost", True)
    try:
        root.attributes("-transparentcolor", KEY)   # keyed pixels are click-through on Windows
    except tk.TclError:
        pass
    sw, sh = root.winfo_screenwidth(), root.winfo_screenheight()
    home = (sw - W - 16, sh - H - 56)
    pos = [float(home[0]), float(home[1])]
    root.geometry(f"{W}x{H}+{int(pos[0])}+{int(pos[1])}")
    c = tk.Canvas(root, width=W, height=H, bg=KEY, highlightthickness=0)
    c.pack()
    hwnd = None
    try:  # no taskbar button, never steals focus while idle
        hwnd = user32.GetParent(root.winfo_id())
        ex = user32.GetWindowLongW(hwnd, -20)
        user32.SetWindowLongW(hwnd, -20, ex | 0x80 | 0x08000000)   # TOOLWINDOW | NOACTIVATE
    except Exception:
        pass

    st = {"target": None, "label": "", "return_at": 0, "say": "", "say_until": 0, "mood": "happy",
          "blink": 0, "bob": 0.0, "offset": 0, "tasks": [], "caption": "", "caption_at": 0,
          "working_until": 0, "done_at": 0, "asking": False, "hello": time.time()}

    entry = tk.Entry(root, font=("Segoe UI", 11), bg="#0a1238", fg="white", insertbackground="white",
                     relief="flat", highlightthickness=2, highlightcolor="#5b7bff", highlightbackground="#5b7bff")

    def mouse():
        try:
            pt = wintypes.POINT()
            user32.GetCursorPos(ctypes.byref(pt))
            return pt.x, pt.y
        except Exception:
            return sw // 2, sh // 2

    # ---------------- talking to the backend ----------------
    def post(path, payload):
        import urllib.request
        req = urllib.request.Request(BACKEND + path, data=json.dumps(payload).encode(),
                                     headers={"Content-Type": "application/json", "X-Bluey-Token": token})
        try:
            with urllib.request.urlopen(req, timeout=4) as r:
                return json.loads(r.read() or b"{}")
        except Exception as e:
            return {"ok": False, "error": str(e)}

    def submit(_=None):
        text = entry.get().strip()
        close_ask()
        if not text:
            return
        res = post("/bluey/ask", {"text": text})
        if res.get("ok"):
            say(f"On it: \"{text[:60]}\"", "focus", 4)
            st["working_until"] = time.time() + 20
        else:
            say(res.get("error") or "A.P.A's voice is off. Turn it on first!", "worried", 6)

    def open_ask(_=None):
        if st["asking"]:
            return
        st["asking"] = True
        entry.delete(0, "end")
        c.create_window(HUD_X + 6, H - 52, window=entry, anchor="nw", width=HUD_W - 12, height=30, tags="entry")
        try:  # we need the keyboard now
            user32.SetWindowLongW(hwnd, -20, user32.GetWindowLongW(hwnd, -20) & ~0x08000000)
        except Exception:
            pass
        root.focus_force()
        entry.focus_set()

    def close_ask(_=None):
        st["asking"] = False
        c.delete("entry")
        try:
            user32.SetWindowLongW(hwnd, -20, user32.GetWindowLongW(hwnd, -20) | 0x08000000)
        except Exception:
            pass

    entry.bind("<Return>", submit)
    entry.bind("<Escape>", close_ask)

    def restore_apa(_=None):
        close_ask()
        try:
            import pygetwindow as gw
            for w in gw.getAllWindows():
                if "A.P.A" in (w.title or "") or "A.D.A" in (w.title or ""):
                    if w.isMinimized:
                        w.restore()
                    w.activate()
                    say("Here's A.P.A!", "happy", 3)
                    return
        except Exception:
            pass
        say("I couldn't find the A.P.A window.", "worried", 4)

    def on_click(e):
        if math.hypot(e.x - BX, e.y - (BY + math.sin(st["bob"]) * 4)) <= R + 8:
            open_ask()

    c.bind("<Button-1>", on_click)
    c.bind("<Double-Button-1>", restore_apa)

    def say(text, mood="happy", seconds=7):
        st["say"], st["mood"], st["say_until"] = text[:160], mood, time.time() + seconds

    # ---------------- drawing ----------------
    def wrap_lines(text, width_chars):
        words, lines, cur = text.split(), [], ""
        for w_ in words:
            if len(cur) + len(w_) + 1 > width_chars:
                lines.append(cur)
                cur = w_
            else:
                cur = f"{cur} {w_}".strip()
        if cur:
            lines.append(cur)
        return lines

    def draw_hud():
        now = time.time()
        working = now < st["working_until"] or any(t["state"] == "running" for t in st["tasks"][-4:])
        recent = [t for t in st["tasks"] if now - t["t"] < 40][-4:]
        caption = st["caption"] if now - st["caption_at"] < 12 else ""
        text = st["say"] if now < st["say_until"] else st["label"]
        if not (working or recent or caption or text):
            return
        y = HUD_Y
        rows = len(recent) + (2 if caption else 0) + (len(wrap_lines(text, 40)) if text else 0)
        h = 34 + rows * 18 + (8 if caption or text else 0)
        c.create_rectangle(HUD_X, y, HUD_X + HUD_W, y + h, fill="#030b18", outline="#22d3ee", width=1)
        for (x0, y0, dx, dy) in ((HUD_X, y, 1, 1), (HUD_X + HUD_W, y, -1, 1), (HUD_X, y + h, 1, -1), (HUD_X + HUD_W, y + h, -1, -1)):
            c.create_line(x0, y0, x0 + 12 * dx, y0, fill="#67e8f9", width=2)
            c.create_line(x0, y0, x0, y0 + 12 * dy, fill="#67e8f9", width=2)
        dot = "#fbbf24" if working else "#34d399"
        if working and int(now * 2) % 2:
            dot = "#7c5b10"
        c.create_oval(HUD_X + 12, y + 12, HUD_X + 20, y + 20, fill=dot, outline="")
        c.create_text(HUD_X + 28, y + 16, anchor="w", fill="#a5f3fc", font=("Consolas", 9, "bold"),
                      text="A.P.A · WORKING IN BACKGROUND" if working else "A.P.A · STANDING BY")
        yy = y + 34
        spin = "|/-\\"[int(now * 8) % 4]
        for t in recent:
            icon, col = {"running": (spin, "#fbbf24"), "done": ("✓", "#34d399"), "denied": ("✕", "#fb7185"),
                         "failed": ("✕", "#fb7185")}.get(t["state"], ("•", "#94a3b8"))
            c.create_text(HUD_X + 14, yy, anchor="w", fill=col, font=("Consolas", 10, "bold"), text=icon)
            c.create_text(HUD_X + 30, yy, anchor="w", fill="#e2e8f0", font=("Segoe UI", 9),
                          text=(t["label"] + (f" · {t['detail']}" if t.get("detail") else ""))[:46])
            yy += 18
        if caption:
            c.create_text(HUD_X + 14, yy + 4, anchor="nw", fill="#67e8f9", font=("Segoe UI", 9, "italic"),
                          width=HUD_W - 26, text=f"“{caption[-110:]}”")
            yy += 36
        if text:
            for line in wrap_lines(text, 40):
                c.create_text(HUD_X + 14, yy + 2, anchor="nw", fill="white", font=("Segoe UI", 10, "bold"), text=line)
                yy += 18
        # little connector from the card to Bluey
        c.create_line(HUD_X + HUD_W, y + h - 10, BX - R + 6, BY - 16, fill="#22d3ee", dash=(2, 4))

    def draw_bluey():
        bob = math.sin(st["bob"]) * 4
        cx, cy = BX, BY + bob
        c.create_oval(cx - 26, BY + R + 2, cx + 26, BY + R + 10, fill="#05070d", outline="")
        for i, col in enumerate(("#0b1a4a", "#142a7a", "#1d3aa8", "#2a4fd1", "#3a63e6")):
            rr = R - i * 4
            c.create_oval(cx - rr, cy - rr, cx + rr, cy + rr, fill=col, outline="")
        c.create_oval(cx - R * 0.55, cy - R * 0.7, cx - R * 0.15, cy - R * 0.35, fill="#7f9cff", outline="")
        pts = []
        for k in range(10):
            a = -math.pi / 2 + k * math.pi / 5
            rr = 15 if k % 2 == 0 else 6
            pts += [cx + math.cos(a) * rr, cy - R + 6 + math.sin(a) * rr * 0.6]
        c.create_polygon(pts, fill="#0a1238", outline="#5b7bff")
        if st["target"]:
            lx, ly = st["target"][0] - pos[0], st["target"][1] - pos[1]
        elif st["asking"]:
            lx, ly = HUD_X + 100, H - 40
        else:
            mx, my = mouse()
            lx, ly = mx - pos[0], my - pos[1]
        sleepy = st["mood"] == "sleepy"
        for ex_ in (-16, 16):
            exx, eyy = cx + ex_, cy - 4
            dx, dy = lx - exx, ly - eyy
            d = math.hypot(dx, dy) or 1
            px, py = exx + dx / d * 6, eyy + dy / d * 6
            if st["blink"] > 0 or sleepy:
                c.create_line(exx - 10, eyy, exx + 10, eyy, fill="white", width=3)
            else:
                c.create_oval(exx - 12, eyy - 13, exx + 12, eyy + 13, fill="white", outline="#0a1238", width=2)
                c.create_oval(px - 6, py - 6, px + 6, py + 6, fill="#05070d", outline="")
                c.create_oval(px - 3, py - 4, px, py - 1, fill="white", outline="")
        c.create_oval(cx - 33, cy + 10, cx - 21, cy + 17, fill="#f472b6", outline="")
        c.create_oval(cx + 21, cy + 10, cx + 33, cy + 17, fill="#f472b6", outline="")
        mood = st["mood"]
        if mood == "worried":
            c.create_arc(cx - 9, cy + 16, cx + 9, cy + 28, start=0, extent=180, style="arc", outline="white", width=2)
        elif mood == "focus":
            c.create_line(cx - 7, cy + 20, cx + 7, cy + 20, fill="white", width=2)
            c.create_line(cx - 26, cy - 22, cx - 8, cy - 18, fill="#0a1238", width=3)
            c.create_line(cx + 26, cy - 22, cx + 8, cy - 18, fill="#0a1238", width=3)
        else:
            c.create_arc(cx - 10, cy + 8, cx + 10, cy + 24, start=200, extent=140, style="arc", outline="white", width=2)
        if st["target"]:
            tx, ty = st["target"][0] - pos[0], st["target"][1] - pos[1]
            ang = math.atan2(ty - cy, tx - cx)
            sx, sy = cx + math.cos(ang) * R, cy + math.sin(ang) * R
            ex2, ey2 = sx + math.cos(ang) * 26, sy + math.sin(ang) * 26
            c.create_line(sx, sy, ex2, ey2, fill="#3a63e6", width=6, capstyle="round")
            c.create_oval(ex2 - 6, ey2 - 6, ex2 + 6, ey2 + 6, fill="#5b7bff", outline="")
        if st["asking"]:
            c.create_text(HUD_X + 8, H - 62, anchor="w", fill="#a5f3fc", font=("Consolas", 9, "bold"),
                          text="ASK A.P.A · Enter to send · Esc to cancel")
        elif time.time() - st["hello"] < 8:
            c.create_text(W - 8, BY + R + 18, anchor="e", fill="#94a3b8", font=("Segoe UI", 8),
                          text="click me to ask · double-click: open A.P.A")

    # ---------------- commands from the backend ----------------
    def read_cmds():
        try:
            size = os.path.getsize(BLUEY_CMD_FILE)
        except OSError:
            return
        if size < st["offset"]:
            st["offset"] = 0
        if size == st["offset"]:
            return
        with open(BLUEY_CMD_FILE, "r", encoding="utf-8") as f:
            f.seek(st["offset"])
            chunk = f.read()
            st["offset"] = f.tell()
        for line in chunk.splitlines():
            try:
                cmd = json.loads(line)
            except Exception:
                continue
            a = cmd.get("action")
            if a == "point":
                st["target"] = (int(cmd["x"]), int(cmd["y"]))
                st["label"] = cmd.get("label", "")
                st["return_at"] = time.time() + float(cmd.get("seconds", 4)) + 1.2
            elif a == "say":
                say(cmd.get("text", ""), cmd.get("mood", "happy"), float(cmd.get("seconds", 8)))
            elif a == "mood":
                st["mood"] = cmd.get("mood", "happy")
            elif a == "task":
                tid = cmd.get("id")
                label = TOOL_LABELS.get(cmd.get("tool"), (cmd.get("tool") or "task").replace("_", " "))
                arg = cmd.get("arg") or ""
                found = next((t for t in st["tasks"] if t["id"] == tid), None)
                if found:
                    found.update(state=cmd.get("state", "done"), t=time.time())
                else:
                    st["tasks"].append({"id": tid, "label": label + (f": {arg}" if arg else ""), "state": cmd.get("state", "running"),
                                        "detail": "", "t": time.time()})
                    st["tasks"] = st["tasks"][-12:]
                st["working_until"] = time.time() + 4
                if cmd.get("state") == "running":
                    st["mood"] = "focus"
            elif a == "caption":
                st["caption"] = (st["caption"] + cmd.get("text", ""))[-300:] if time.time() - st["caption_at"] < 4 else cmd.get("text", "")
                st["caption_at"] = time.time()
            elif a == "quit":
                root.destroy()
                return

    def tick():
        try:
            read_cmds()
        except Exception:
            pass
        if not root.winfo_exists():
            return
        st["bob"] += 0.12
        if st["blink"] > 0:
            st["blink"] -= 1
        elif time.time() % 4.3 < 0.05:
            st["blink"] = 4
        if st["mood"] == "focus" and time.time() > st["working_until"] + 2 and time.time() > st["say_until"]:
            st["mood"] = "happy"
        if st["target"] and time.time() < st["return_at"]:
            tx, ty = st["target"]
            goal = (tx - BX - 70, ty - BY - 50)
        else:
            st["target"], st["label"] = None, ""
            goal = home
        goal = (max(-HUD_W, min(sw - W, goal[0])), max(-H // 2, min(sh - H, goal[1])))
        pos[0] += (goal[0] - pos[0]) * 0.12
        pos[1] += (goal[1] - pos[1]) * 0.12
        root.geometry(f"{W}x{H}+{int(pos[0])}+{int(pos[1])}")
        for item in c.find_all():           # redraw everything except the text box
            if "entry" not in c.gettags(item):
                c.delete(item)
        draw_hud()
        draw_bluey()
        root.after(33, tick)

    say("Hi! I'm Bluey. Click me to ask A.P.A anything.", "happy", 6)
    tick()
    root.mainloop()
    try:
        os.remove(BLUEY_PID_FILE)
    except Exception:
        pass


if __name__ == "__main__":
    main()
