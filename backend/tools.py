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

send_email_tool = {
    "name": "send_email",
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

tools_list = [{"function_declarations": [read_emails_tool, send_email_tool]}]
