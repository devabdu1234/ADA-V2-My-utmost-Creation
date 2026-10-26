"""Computer Control Bridge — gives A.P.A hands on the desktop.

Wraps the local MCP server `opencode_computer_use` (Windows GUI automation:
screenshots, DPI-correct mouse, Unicode keyboard, window management, UIA/OCR).

Safety model:
  - read-only tools (look/list/wait) run without confirmation;
  - actuator tools (click/type/hotkey...) go through the normal ADA
    confirmation gate unless the user has explicitly allowed them;
  - we never spawn shells and never touch files; the MCP server itself is
    GUI-only by design (no shell/registry/file tools exist).
"""

import asyncio
import sys

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

READONLY_COMPUTER_TOOLS = {
    "computer_list_monitors",
    "computer_list_windows",
    "computer_get_active_window",
    "computer_screenshot",
    "computer_screenshot_annotated",
    "computer_ui_tree",
    "computer_find_element",
    "computer_find_text",
    "computer_element_exists",
    "computer_wait",
    "computer_wait_for_text",
    "computer_wait_for_window",
    "computer_mouse_position",
}

# Emergency stop is a kill-switch — it may only disable input, never enable harm.
SAFETY_COMPUTER_TOOLS = {"computer_emergency_stop"}

ALLOWED_COMPUTER_TOOLS = READONLY_COMPUTER_TOOLS | SAFETY_COMPUTER_TOOLS | {
    "computer_mouse_move",
    "computer_mouse_click",
    "computer_mouse_double_click",
    "computer_mouse_down",
    "computer_mouse_up",
    "computer_mouse_drag",
    "computer_mouse_scroll",
    "computer_type",
    "computer_key",
    "computer_hotkey",
    "computer_key_down",
    "computer_key_up",
    "computer_focus_window",
    "computer_minimize_window",
    "computer_maximize_window",
    "computer_restore_window",
    "computer_click_text",
    "computer_invoke_element",
    "computer_batch",
    "computer_overlay_show",
    "computer_overlay_hide",
}

MAX_RESULT_CHARS = 3500


async def call_computer_tool(name, args=None, timeout=45.0):
    """Spawn the MCP server, run one tool, return {texts, images, is_error}."""
    if name not in ALLOWED_COMPUTER_TOOLS:
        return {"texts": [f"Computer tool '{name}' is not permitted."], "images": [], "is_error": True}

    params = StdioServerParameters(command=sys.executable, args=["-m", "opencode_computer_use"])
    out = {"texts": [], "images": [], "is_error": False}
    try:
        async with stdio_client(params) as (read, write):
            async with ClientSession(read, write) as session:
                await asyncio.wait_for(session.initialize(), timeout=20)
                response = await asyncio.wait_for(session.call_tool(name, dict(args or {})), timeout=timeout)
        for item in response.content:
            if item.type == "text":
                out["texts"].append(item.text)
            elif item.type == "image":
                out["images"].append(item.data)
        out["is_error"] = bool(getattr(response, "isError", False))
    except asyncio.TimeoutError:
        out["texts"].append(f"Computer tool '{name}' timed out.")
        out["is_error"] = True
    except Exception as e:
        out["texts"].append(f"Computer control error: {e}")
        out["is_error"] = True

    joined = "\n".join(out["texts"])
    if len(joined) > MAX_RESULT_CHARS:
        out["texts"] = [joined[:MAX_RESULT_CHARS] + " ...[truncated]"]
    return out
