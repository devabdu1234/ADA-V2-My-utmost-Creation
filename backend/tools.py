generate_cad_prototype_tool = {
    "name": "generate_cad_prototype",
    "description": "Generates a 3D wireframe prototype based on a user's description. Use this when the user asks to 'visualize', 'prototype', 'create a wireframe', or 'design' something in 3D.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "prompt": {
                "type": "STRING",
                "description": "The user's description of the object to prototype."
            }
        },
        "required": ["prompt"]
    }
}




write_file_tool = {
    "name": "write_file",
    "description": "Writes content to a file at the specified path. Overwrites if exists.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "path": {
                "type": "STRING",
                "description": "The path of the file to write to."
            },
            "content": {
                "type": "STRING",
                "description": "The content to write to the file."
            }
        },
        "required": ["path", "content"]
    }
}

read_directory_tool = {
    "name": "read_directory",
    "description": "Lists the contents of a directory.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "path": {
                "type": "STRING",
                "description": "The path of the directory to list."
            }
        },
        "required": ["path"]
    }
}

read_file_tool = {
    "name": "read_file",
    "description": "Reads the content of a file.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "path": {
                "type": "STRING",
                "description": "The path of the file to read."
            }
        },
        "required": ["path"]
    }
}

list_network_servers_tool = {
    "name": "list_network_servers",
    "description": "Lists configured network servers available for file access.",
    "parameters": {
        "type": "OBJECT",
        "properties": {},
    }
}

list_server_files_tool = {
    "name": "list_server_files",
    "description": "Lists files on a remote network server.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "server_name": {"type": "STRING", "description": "The name or IP of the server."},
            "remote_path": {"type": "STRING", "description": "The path on the server to list (default: root)."}
        },
        "required": ["server_name"]
    }
}

download_server_file_tool = {
    "name": "download_server_file",
    "description": "Downloads a file from a network server to the current project.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "server_name": {"type": "STRING", "description": "The name or IP of the server."},
            "remote_path": {"type": "STRING", "description": "The full path of the file on the server."}
        },
        "required": ["server_name", "remote_path"]
    }
}

read_emails_tool = {
    "name": "read_emails",
    "description": "Reads emails from the inbox, sorted by priority (urgent first).",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "limit": {"type": "INTEGER", "description": "Number of emails to retrieve (default: 10)."},
            "priority_filter": {"type": "STRING", "description": "Filter by priority: 'urgent', 'normal', 'low', or 'all'."}
        },
    }
}

send_email_tool = {
    "name": "send_email",
    "description": "Sends an email with optional priority flag.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "to": {"type": "STRING", "description": "Recipient email address."},
            "subject": {"type": "STRING", "description": "Email subject line."},
            "body": {"type": "STRING", "description": "Email body content."},
            "priority": {"type": "STRING", "description": "Email priority: 'normal', 'high', or 'low'."},
            "cc": {"type": "STRING", "description": "Optional CC recipients (comma-separated)."}
        },
        "required": ["to", "subject", "body"]
    }
}

# --- SYSTEM CONTROL TOOLS (ULTIMATE AGENT) ---

list_processes_tool = {
    "name": "list_processes",
    "description": "Lists running processes with their PID, CPU%, and memory usage. Use this to identify resource hogs.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "sort_by": {
                "type": "STRING",
                "description": "Sort by: 'cpu', 'memory', or 'name' (default: 'cpu').",
                "enum": ["cpu", "memory", "name"]
            },
            "limit": {
                "type": "INTEGER",
                "description": "Number of processes to return (default: 20)."
            }
        }
    }
}

kill_process_tool = {
    "name": "kill_process",
    "description": "Terminates a running process by name or PID. Use this to free system resources when CPU/RAM is high.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "target": {
                "type": "STRING",
                "description": "Process name (e.g. 'chrome.exe') or PID number."
            },
            "force": {
                "type": "BOOLEAN",
                "description": "Force kill (default: true). Use extreme caution."
            }
        },
        "required": ["target"]
    }
}

system_command_tool = {
    "name": "system_command",
    "description": "Executes a system command or PowerShell script. Use this for system maintenance, settings changes, or automation.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "command": {
                "type": "STRING",
                "description": "The command to execute (PowerShell syntax on Windows)."
            },
            "run_as_admin": {
                "type": "BOOLEAN",
                "description": "Whether to request admin elevation (default: false)."
            }
        },
        "required": ["command"]
    }
}

clear_temp_files_tool = {
    "name": "clear_temp_files",
    "description": "Clears temporary files from the system to free up disk space and improve performance.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "scope": {
                "type": "STRING",
                "description": "Cleanup scope: 'user' (user temp only), 'system' (includes system temp, prefetch), 'all' (everything including browser caches).",
                "enum": ["user", "system", "all"]
            }
        }
    }
}

get_system_info_tool = {
    "name": "get_system_info",
    "description": "Gets detailed system information including OS, hardware specs, disk usage, network, and running services.",
    "parameters": {
        "type": "OBJECT",
        "properties": {}
    }
}

# --- WEATHER TOOL ---

get_weather_tool = {
    "name": "get_weather",
    "description": "Gets current weather and forecast for a location. Uses wttr.in (no API key needed).",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "location": {
                "type": "STRING",
                "description": "City name or coordinates (e.g. 'London', 'New York', 'Tokyo')."
            }
        },
        "required": ["location"]
    }
}

move_widget_tool = {
    "name": "move_widget",
    "description": "Moves a user interface widget/window to a specific position on screen. Widget IDs: 'visualizer', 'chat', 'cad', 'browser', 'email', 'kasa', 'printer', 'tools'. Use when the user asks to move, reposition, or rearrange UI elements.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "widget_id": {
                "type": "STRING",
                "description": "The ID of the widget to move (visualizer, chat, cad, browser, email, kasa, printer, tools)."
            },
            "x": {
                "type": "NUMBER",
                "description": "Horizontal position in pixels (center of screen is window.innerWidth/2)."
            },
            "y": {
                "type": "NUMBER",
                "description": "Vertical position in pixels (center of screen is window.innerHeight/2)."
            }
        },
        "required": ["widget_id", "x", "y"]
    }
}

tools_list = [{"function_declarations": [
    generate_cad_prototype_tool,
    write_file_tool,
    read_directory_tool,
    read_file_tool,
    list_network_servers_tool,
    list_server_files_tool,
    download_server_file_tool,
    read_emails_tool,
    send_email_tool,
    list_processes_tool,
    kill_process_tool,
    system_command_tool,
    clear_temp_files_tool,
    get_system_info_tool,
    get_weather_tool,
    move_widget_tool
]}]


