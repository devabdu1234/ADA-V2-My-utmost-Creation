read_emails_tool = {
    "name": "read_emails",
    "description": "Reads and AI-analyses emails from the university inbox. Returns each email with category, priority, sentiment, summary, and a draft reply.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "limit": {"type": "INTEGER", "description": "Number of emails to retrieve (default: 10)."}
        }
    }
}

send_email_tool = {    "name": "send_email",
    "description": "Sends an email with optional priority flag.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "to": {"type": "STRING", "description": "Recipient email address."},
            "subject": {"type": "STRING", "description": "Email subject line."},
            "body": {"type": "STRING", "description": "Email body content."},
            "priority": {"type": "STRING", "description": "Priority: normal, high, or low.", "enum": ["normal", "high", "low"]},
            "cc": {"type": "STRING", "description": "Optional CC address."}
        },
        "required": ["to", "subject", "body"]
    }
}

get_weather_tool = {
    "name": "get_weather",
    "description": "Locks the 3D globe onto a city and shows its live weather. Use whenever the user asks about weather anywhere.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "city": {"type": "STRING", "description": "City name, e.g. Tokyo, Colombo, London."}
        },
        "required": ["city"]
    }
}

computer_list_windows_tool = {
    "name": "computer_list_windows",
    "description": "Lists all open windows on the user's computer with titles and app names. Read-only; use this first to see what the user is working with.",
    "parameters": {"type": "OBJECT", "properties": {}}
}

computer_screenshot_tool = {
    "name": "computer_screenshot",
    "description": "Takes a screenshot of the user's screen and shows it on the A.P.A interface. Read-only.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "monitor": {"type": "INTEGER", "description": "Monitor id (default: primary)."}
        }
    }
}

computer_click_text_tool = {
    "name": "computer_click_text",
    "description": "Clicks the visible UI element whose on-screen text matches the given text on the user's computer. Requires user confirmation.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "text": {"type": "STRING", "description": "Exact visible text of the button/element to click."},
            "app": {"type": "STRING", "description": "Optional app/window title to look within."}
        },
        "required": ["text"]
    }
}

computer_type_tool = {
    "name": "computer_type",
    "description": "Types the given text into whatever is focused on the user's computer. Requires user confirmation.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "text": {"type": "STRING", "description": "Text to type."}
        },
        "required": ["text"]
    }
}

computer_key_tool = {
    "name": "computer_key",
    "description": "Presses a single keyboard key on the user's computer (e.g. ENTER, TAB, ESC). Requires user confirmation.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "key": {"type": "STRING", "description": "Key name, e.g. ENTER, ESC, TAB, F5."}
        },
        "required": ["key"]
    }
}

computer_hotkey_tool = {
    "name": "computer_hotkey",
    "description": "Presses a keyboard shortcut on the user's computer, e.g. WIN+R or CTRL+S. Requires user confirmation.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "keys": {"type": "ARRAY", "items": {"type": "STRING"}, "description": "Keys combination, e.g. [\"CTRL\", \"S\"]."}
        },
        "required": ["keys"]
    }
}

computer_mouse_click_tool = {
    "name": "computer_mouse_click",
    "description": "Moves the mouse to screen coordinates and clicks on the user's computer. Coordinates come from a screenshot (native pixels). Requires user confirmation.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "x": {"type": "INTEGER", "description": "X pixel coordinate (native screen pixels)."},
            "y": {"type": "INTEGER", "description": "Y pixel coordinate (native screen pixels)."},
            "button": {"type": "STRING", "description": "left, right, or middle (default: left)."}
        },
        "required": ["x", "y"]
    }
}

computer_emergency_stop_tool = {
    "name": "computer_emergency_stop",
    "description": "Emergency kill-switch that immediately disables all mouse and keyboard control of the computer. Use if the user asks to stop all computer control at once.",
    "parameters": {"type": "OBJECT", "properties": {}}
}

tools_list = [{
    "function_declarations": [
        read_emails_tool,
        send_email_tool,
        get_weather_tool,
        computer_list_windows_tool,
        computer_screenshot_tool,
        computer_click_text_tool,
        computer_type_tool,
        computer_key_tool,
        computer_hotkey_tool,
        computer_mouse_click_tool,
        computer_emergency_stop_tool,
    ]
}]
