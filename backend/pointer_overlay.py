"""A.P.A's own on-screen pointer: a glowing ring + label drawn on top of every window.

Usage: python pointer_overlay.py X Y [label] [seconds] [color]
It is click-through and never touches the real mouse. Runs as its own process
so Tkinter never fights the asyncio backend.
"""
import sys
import tkinter as tk

x, y = int(sys.argv[1]), int(sys.argv[2])
label = sys.argv[3] if len(sys.argv) > 3 else ""
seconds = float(sys.argv[4]) if len(sys.argv) > 4 else 4.0
color = sys.argv[5] if len(sys.argv) > 5 else "#22d3ee"

try:
    import ctypes
    ctypes.windll.shcore.SetProcessDpiAwareness(2)
except Exception:
    pass

W, H = 260, 120
KEY = "#010203"  # transparent colour
root = tk.Tk()
root.overrideredirect(True)
root.attributes("-topmost", True)
try:
    root.attributes("-transparentcolor", KEY)
except tk.TclError:
    root.attributes("-alpha", 0.85)
root.geometry(f"{W}x{H}+{x - 40}+{y - 40}")
c = tk.Canvas(root, width=W, height=H, bg=KEY, highlightthickness=0)
c.pack()

# click-through: WS_EX_LAYERED | WS_EX_TRANSPARENT
try:
    import ctypes
    hwnd = ctypes.windll.user32.GetParent(root.winfo_id())
    ex = ctypes.windll.user32.GetWindowLongW(hwnd, -20)
    ctypes.windll.user32.SetWindowLongW(hwnd, -20, ex | 0x80000 | 0x20)
except Exception:
    pass

cx, cy = 40, 40
ring = c.create_oval(cx - 30, cy - 30, cx + 30, cy + 30, outline=color, width=3)
c.create_oval(cx - 5, cy - 5, cx + 5, cy + 5, fill=color, outline="")
c.create_polygon(cx + 10, cy + 10, cx + 34, cy + 18, cx + 18, cy + 34, fill=color, outline="")
if label:
    c.create_rectangle(cx + 34, cy + 30, cx + 40 + 7 * len(label) + 16, cy + 54, fill="#03101c", outline=color)
    c.create_text(cx + 48, cy + 42, text=label, fill="white", anchor="w", font=("Consolas", 10, "bold"))

r, step = 30, 0


def pulse():
    global r, step
    step += 1
    r = 22 + (step % 12) * 1.2
    c.coords(ring, cx - r, cy - r, cx + r, cy + r)
    root.after(60, pulse)


pulse()
root.after(int(seconds * 1000), root.destroy)
root.mainloop()
