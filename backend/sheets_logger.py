import os
import json
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]


class SheetsLogger:
    def __init__(self, spreadsheet_id=None, credentials_file=None):
        self.spreadsheet_id = spreadsheet_id or os.getenv("SHEETS_ID", "")
        self.credentials_file = credentials_file or os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "credentials.json")
        self.service = None
        self._initialized = False

    def _ensure_service(self):
        if self._initialized:
            return True
        if not self.spreadsheet_id:
            print("[SHEETS] No spreadsheet ID configured. Skipping logging.")
            return False
        try:
            from google.auth.transport.requests import Request
            from google.oauth2.credentials import Credentials
            from google_auth_oauthlib.flow import InstalledAppFlow
            from googleapiclient.discovery import build
            from googleapiclient.errors import HttpError

            creds = None
            token_file = "token_sheets.json"
            if os.path.exists(token_file):
                creds = Credentials.from_authorized_user_file(token_file, SCOPES)
            if not creds or not creds.valid:
                if creds and creds.expired and creds.refresh_token:
                    creds.refresh(Request())
                else:
                    if not os.path.exists(self.credentials_file):
                        print(f"[SHEETS] Credentials file not found: {self.credentials_file}")
                        return False
                    flow = InstalledAppFlow.from_client_secrets_file(self.credentials_file, SCOPES)
                    creds = flow.run_local_server(port=0)
                with open(token_file, "w") as f:
                    f.write(creds.to_json())

            self.service = build("sheets", "v4", credentials=creds)
            self._initialized = True
            print("[SHEETS] Logger initialized successfully.")
            return True
        except Exception as e:
            print(f"[SHEETS] Init failed: {e}")
            return False

    def _append_row(self, values):
        if not self._ensure_service():
            return
        try:
            body = {"values": [values]}
            result = self.service.spreadsheets().values().append(
                spreadsheetId=self.spreadsheet_id,
                range="Sheet1!A:Z",
                valueInputOption="USER_ENTERED",
                insertDataOption="INSERT_ROWS",
                body=body
            ).execute()
            print(f"[SHEETS] Appended row: {result.get('updates', {}).get('updatedCells', 0)} cells")
        except Exception as e:
            print(f"[SHEETS] Append failed: {e}")

    def log_email_fetched(self, emails_data):
        """Logs fetched emails to the sheet."""
        timestamp = datetime.now().isoformat()
        for email_data in emails_data:
            row = [
                timestamp,
                "FETCH",
                email_data.get("from", ""),
                email_data.get("subject", ""),
                email_data.get("category", ""),
                email_data.get("priority", ""),
                email_data.get("sentiment", ""),
                email_data.get("summary", ""),
            ]
            self._append_row(row)

    def log_email_sent(self, to, subject, priority="normal"):
        """Logs a sent email to the sheet."""
        row = [
            datetime.now().isoformat(),
            "SENT",
            to,
            subject,
            "",
            priority,
            "",
            "",
        ]
        self._append_row(row)

    def log_batch(self, emails_data, action="FETCH"):
        """Logs multiple emails in one batch call."""
        if not self._ensure_service():
            return
        timestamp = datetime.now().isoformat()
        rows = []
        for email_data in emails_data:
            rows.append([
                timestamp,
                action,
                email_data.get("from", ""),
                email_data.get("subject", ""),
                email_data.get("category", ""),
                email_data.get("priority", ""),
                email_data.get("sentiment", ""),
                email_data.get("summary", ""),
            ])
        if rows:
            try:
                body = {"values": rows}
                self.service.spreadsheets().values().append(
                    spreadsheetId=self.spreadsheet_id,
                    range="Sheet1!A:Z",
                    valueInputOption="USER_ENTERED",
                    insertDataOption="INSERT_ROWS",
                    body=body
                ).execute()
                print(f"[SHEETS] Batch logged {len(rows)} rows.")
            except Exception as e:
                print(f"[SHEETS] Batch append failed: {e}")
