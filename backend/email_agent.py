import os
import imaplib
import smtplib
import email
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

class EmailAgent:
    def __init__(self, imap_server=None, smtp_server=None, email_address=None, password=None):
        self.imap_server = imap_server or os.getenv("EMAIL_IMAP_SERVER", "imap.gmail.com")
        self.smtp_server = smtp_server or os.getenv("EMAIL_SMTP_SERVER", "smtp.gmail.com")
        self.email_address = email_address or os.getenv("EMAIL_ADDRESS")
        self.password = password or os.getenv("EMAIL_PASSWORD")
        self.connected = False

    def connect(self):
        """Establishes connection to IMAP and SMTP servers."""
        if not all([self.email_address, self.password]):
            return {"error": "Email credentials not configured. Set EMAIL_ADDRESS and EMAIL_PASSWORD in .env"}
        
        try:
            # Test IMAP connection
            imap = imaplib.IMAP4_SSL(self.imap_server)
            imap.login(self.email_address, self.password)
            imap.logout()
            
            # Test SMTP connection
            smtp = smtplib.SMTP_SSL(self.smtp_server, 465)
            smtp.login(self.email_address, self.password)
            smtp.quit()
            
            self.connected = True
            return {"success": True, "message": "Connected to email servers successfully."}
        except Exception as e:
            return {"error": f"Failed to connect to email servers: {str(e)}"}

    async def read_emails(self, limit=10, search_criteria="ALL", sort_by_priority=True):
        """Reads emails from the inbox, optionally sorted by priority."""
        if not self.connected:
            conn_status = self.connect()
            if "error" in conn_status:
                return conn_status

        try:
            imap = imaplib.IMAP4_SSL(self.imap_server)
            imap.login(self.email_address, self.password)
            imap.select("inbox")

            status, messages = imap.search(None, search_criteria)
            if status != "OK":
                return {"error": "Failed to search emails."}

            email_ids = messages[0].split()
            email_ids = email_ids[-limit:]  # Get latest N emails

            emails_list = []
            for eid in reversed(email_ids):
                status, msg_data = imap.fetch(eid, "(RFC822)")
                if status == "OK":
                    raw_email = msg_data[0][1]
                    parsed_email = email.message_from_bytes(raw_email)
                    
                    # Extract priority from headers or subject
                    priority = self._detect_priority(parsed_email)
                    
                    emails_list.append({
                        "id": eid.decode(),
                        "from": parsed_email.get("From"),
                        "to": parsed_email.get("To"),
                        "subject": parsed_email.get("Subject"),
                        "date": parsed_email.get("Date"),
                        "priority": priority,
                        "body_preview": self._get_body_preview(parsed_email, 200)
                    })

            imap.logout()

            # Sort by priority if requested
            if sort_by_priority:
                priority_order = {"high": 0, "urgent": 0, "normal": 1, "low": 2}
                emails_list.sort(key=lambda x: priority_order.get(x["priority"], 1))

            return {"emails": emails_list, "count": len(emails_list)}
        except Exception as e:
            return {"error": f"Failed to read emails: {str(e)}"}

    async def send_email(self, to, subject, body, priority="normal", cc=None, bcc=None):
        """Sends an email with optional priority flag."""
        if not self.connected:
            conn_status = self.connect()
            if "error" in conn_status:
                return conn_status

        try:
            msg = MIMEMultipart()
            msg["From"] = self.email_address
            msg["To"] = to
            msg["Subject"] = subject
            
            # Add priority header
            if priority.lower() in ["high", "urgent"]:
                msg["X-Priority"] = "1 (Highest)"
                msg["X-MSMail-Priority"] = "High"
                msg["Importance"] = "High"
                # Prepend to subject for visibility
                if "[URGENT]" not in subject.upper():
                    msg["Subject"] = f"[URGENT] {subject}"
            elif priority.lower() == "low":
                msg["X-Priority"] = "5 (Lowest)"
                msg["Importance"] = "Low"

            if cc:
                msg["Cc"] = cc
            if bcc:
                msg["Bcc"] = bcc

            msg.attach(MIMEText(body, "plain"))

            smtp = smtplib.SMTP_SSL(self.smtp_server, 465)
            smtp.login(self.email_address, self.password)
            
            recipients = [to]
            if cc:
                recipients.extend(cc.split(","))
            if bcc:
                recipients.extend(bcc.split(","))
                
            smtp.sendmail(self.email_address, recipients, msg.as_string())
            smtp.quit()

            return {"success": True, "message": f"Email sent to {to} with {priority} priority."}
        except Exception as e:
            return {"error": f"Failed to send email: {str(e)}"}

    def _detect_priority(self, msg):
        """Detects email priority from headers or subject."""
        subject = (msg.get("Subject") or "").lower()
        x_priority = msg.get("X-Priority", "")
        importance = msg.get("Importance", "")

        if "urgent" in subject or "high" in subject or x_priority.startswith("1") or importance.lower() == "high":
            return "urgent"
        if "low" in subject or x_priority.startswith("5") or importance.lower() == "low":
            return "low"
        return "normal"

    def _get_body_preview(self, msg, max_length=200):
        """Extracts a plain text preview of the email body."""
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    payload = part.get_payload(decode=True)
                    if payload:
                        text = payload.decode("utf-8", errors="ignore")
                        return text[:max_length] + ("..." if len(text) > max_length else "")
        else:
            payload = msg.get_payload(decode=True)
            if payload:
                text = payload.decode("utf-8", errors="ignore")
                return text[:max_length] + ("..." if len(text) > max_length else "")
        return "No preview available."

    async def fetch_today_emails(self, limit=20):
        """Fetches emails received today."""
        if not self.connected:
            conn_status = self.connect()
            if "error" in conn_status:
                return conn_status

        # IMAP date format: DD-Mon-YYYY (e.g., 18-May-2026)
        today_str = datetime.now().strftime("%d-%b-%Y")
        search_criteria = f'(ON "{today_str}")'
        
        print(f"[EMAIL AGENT] Fetching today's emails with criteria: {search_criteria}")

        try:
            imap = imaplib.IMAP4_SSL(self.imap_server)
            imap.login(self.email_address, self.password)
            imap.select("inbox")

            status, messages = imap.search(None, search_criteria)
            if status != "OK":
                return {"error": "Failed to search emails for today."}

            email_ids = messages[0].split()
            # Get the most recent ones up to the limit
            email_ids = email_ids[-limit:]

            emails_list = []
            for eid in reversed(email_ids):
                status, msg_data = imap.fetch(eid, "(RFC822)")
                if status == "OK":
                    raw_email = msg_data[0][1]
                    parsed_email = email.message_from_bytes(raw_email)
                    
                    emails_list.append({
                        "id": eid.decode(),
                        "from": parsed_email.get("From"),
                        "subject": parsed_email.get("Subject"),
                        "date": parsed_email.get("Date"),
                        "priority": self._detect_priority(parsed_email),
                        "body_preview": self._get_body_preview(parsed_email, 250)
                    })

            imap.logout()
            return {"emails": emails_list, "count": len(emails_list)}
        except Exception as e:
            return {"error": f"Failed to fetch today's emails: {str(e)}"}
