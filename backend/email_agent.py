import os
import imaplib
import smtplib
import email
import json
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

CATEGORIES = ["Academic", "Finance", "Administration", "General Inquiries"]
PRIORITIES = ["High", "Medium", "Low"]
SENTIMENTS = ["Positive", "Negative", "Neutral"]
INTENSITIES = ["Mild", "Moderate", "Severe"]

ANALYSIS_PROMPT = """Analyze this email and return a JSON object with:
- "category": one of Academic, Finance, Administration, General Inquiries
- "priority": High, Medium, or Low
- "sentiment": Positive, Negative, or Neutral
- "intensity": Mild, Moderate, or Severe (emotional intensity)
- "confidence": a float between 0.0 and 1.0 indicating how confident you are in this analysis
- "summary": one-sentence summary (max 20 words)
- "draft_reply": a draft reply (2-3 sentences) whose tone matches the sentiment and intensity:
  * Positive/Mild: warm and appreciative
  * Positive/Moderate: enthusiastic and grateful
  * Positive/Severe: deeply thankful and excited
  * Negative/Mild: polite and professional
  * Negative/Moderate: firm and direct
  * Negative/Severe: empathetic and urgent
  * Neutral: professional and straightforward

Email:
From: {sender}
Subject: {subject}
Body: {body}

Respond with ONLY the JSON object, no other text."""

BATCH_ANALYSIS_PROMPT = """Analyze each of the following emails and return a JSON ARRAY of objects in the same order.
Each object must have:
- "category": Academic, Finance, Administration, or General Inquiries
- "priority": High, Medium, or Low
- "sentiment": Positive, Negative, or Neutral
- "intensity": Mild, Moderate, or Severe
- "confidence": float between 0.0 and 1.0
- "summary": one-sentence summary (max 20 words)
- "draft_reply": 2-3 sentence draft reply matching tone to sentiment/intensity

Emails:
{emails_section}

Respond with ONLY the JSON array, no other text."""


class EmailAgent:
    def __init__(self, imap_server=None, smtp_server=None, email_address=None, password=None):
        self.imap_server = imap_server or os.getenv("EMAIL_IMAP_SERVER", "imap.gmail.com")
        self.smtp_server = smtp_server or os.getenv("EMAIL_SMTP_SERVER", "smtp.gmail.com")
        self.email_address = email_address or os.getenv("EMAIL_ADDRESS")
        self.password = password or os.getenv("EMAIL_PASSWORD")
        self.connected = False
        self._analysis_cache = {}

        api_key = os.getenv("GEMINI_API_KEY")
        self.ai_client = genai.Client(http_options={"api_version": "v1beta"}, api_key=api_key) if api_key else None

    def connect(self):
        if not all([self.email_address, self.password]):
            return {"error": "Email credentials not configured."}
        try:
            imap = imaplib.IMAP4_SSL(self.imap_server)
            imap.login(self.email_address, self.password)
            imap.logout()
            smtp = smtplib.SMTP_SSL(self.smtp_server, 465)
            smtp.login(self.email_address, self.password)
            smtp.quit()
            self.connected = True
            return {"success": True}
        except Exception as e:
            return {"error": f"Failed to connect: {str(e)}"}

    def _ensure_connected(self):
        if not self.connected:
            conn = self.connect()
            if "error" in conn:
                return conn
        return None

    def _get_body(self, msg):
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    payload = part.get_payload(decode=True)
                    if payload:
                        return payload.decode("utf-8", errors="ignore")
        else:
            payload = msg.get_payload(decode=True)
            if payload:
                return payload.decode("utf-8", errors="ignore")
        return ""

    def _get_body_preview(self, msg, max_length=200):
        text = self._get_body(msg)
        return text[:max_length] + ("..." if len(text) > max_length else "")

    def _check_escalation(self, analysis):
        sentiment = analysis.get("sentiment", "Neutral")
        priority = analysis.get("priority", "Medium")
        intensity = analysis.get("intensity", "Mild")
        if sentiment == "Negative" and priority == "High" and intensity in ("Moderate", "Severe"):
            return True
        return False

    def _default_analysis(self, subject):
        return {"category": "General Inquiries", "priority": "Medium", "sentiment": "Neutral", "intensity": "Mild", "confidence": 0.5, "summary": subject[:50], "draft_reply": "", "is_escalated": False}

    def _parse_analysis_json(self, raw_result):
        text = raw_result.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[-1].rsplit("\n", 1)[0]
        return json.loads(text)

    def _validate_analysis(self, result):
        if result.get("category") not in CATEGORIES:
            result["category"] = "General Inquiries"
        if result.get("priority") not in PRIORITIES:
            result["priority"] = "Medium"
        if result.get("sentiment") not in SENTIMENTS:
            result["sentiment"] = "Neutral"
        if result.get("intensity") not in INTENSITIES:
            result["intensity"] = "Mild"
        confidence = result.get("confidence")
        if not isinstance(confidence, (int, float)) or confidence < 0 or confidence > 1:
            result["confidence"] = 0.5
        result["is_escalated"] = self._check_escalation(result)
        return result

    def _cache_key(self, sender, subject):
        return f"{sender}|{subject[:100]}"

    async def _batch_analyze_emails(self, email_list):
        """Analyze all emails in a single Gemini API call. Falls back to defaults on any failure."""
        if not self.ai_client or not email_list:
            return [self._default_analysis(e.get("subject", "")) for e in email_list]

        # Check cache first
        uncached = []
        cached_results = {}
        for e in email_list:
            key = self._cache_key(e.get("from", ""), e.get("subject", ""))
            if key in self._analysis_cache:
                cached_results[key] = self._analysis_cache[key]
            else:
                uncached.append(e)

        if not uncached:
            return [cached_results[self._cache_key(e.get("from", ""), e.get("subject", ""))] for e in email_list]

        # Build batch prompt for uncached emails
        lines = []
        for i, e in enumerate(uncached):
            sender = e.get("from", "Unknown")[:80]
            subject = e.get("subject", "No subject")[:100]
            body = e.get("body", "")[:800]
            lines.append(f"[Email {i+1}]\nFrom: {sender}\nSubject: {subject}\nBody: {body}")
        emails_section = "\n\n".join(lines)

        prompt = BATCH_ANALYSIS_PROMPT.format(emails_section=emails_section)
        try:
            response = await asyncio.wait_for(
                self.ai_client.aio.models.generate_content(
                    model="models/gemini-2.5-flash",
                    contents=prompt,
                    config=types.GenerateContentConfig(response_mime_type="application/json")
                ),
                timeout=30.0
            )
            results = self._parse_analysis_json(response.text)
            if not isinstance(results, list):
                raise ValueError("Response was not a list")
            validated = []
            for r in results:
                validated.append(self._validate_analysis(r))
            # Cache them
            for e, r in zip(uncached, validated):
                key = self._cache_key(e.get("from", ""), e.get("subject", ""))
                self._analysis_cache[key] = r
            # Merge with cached
            all_results = []
            for e in email_list:
                key = self._cache_key(e.get("from", ""), e.get("subject", ""))
                all_results.append(cached_results.get(key) or self._analysis_cache.get(key) or self._default_analysis(e.get("subject", "")))
            return all_results
        except Exception as e:
            print(f"[EMAIL AI] Batch analysis failed (using defaults): {e}")
            return [self._default_analysis(e.get("subject", "")) for e in email_list]

    def _fetch_emails_raw(self, search_criteria="ALL", limit=10):
        conn_err = self._ensure_connected()
        if conn_err:
            return conn_err
        try:
            import socket
            imap = imaplib.IMAP4_SSL(self.imap_server, timeout=15)
            imap.login(self.email_address, self.password)
            imap.select("inbox")
            status, messages = imap.search(None, search_criteria)
            if status != "OK":
                imap.logout()
                return {"error": "Failed to search emails."}
            email_ids = messages[0].split()
            email_ids = email_ids[-limit:]
            emails = []
            for eid in reversed(email_ids):
                status, msg_data = imap.fetch(eid, "(RFC822)")
                if status == "OK":
                    parsed = email.message_from_bytes(msg_data[0][1])
                    emails.append({
                        "id": eid.decode(),
                        "from": parsed.get("From"),
                        "to": parsed.get("To"),
                        "subject": parsed.get("Subject"),
                        "date": parsed.get("Date"),
                        "body": self._get_body(parsed),
                        "body_preview": self._get_body_preview(parsed),
                    })
            imap.logout()
            return {"emails": emails, "count": len(emails)}
        except Exception as e:
            return {"error": f"Failed to read emails: {str(e)}"}

    async def read_emails(self, limit=10, search_criteria="ALL"):
        result = await asyncio.to_thread(self._fetch_emails_raw, search_criteria, limit)
        if "error" in result:
            return result
        emails = result["emails"]
        if not emails:
            return {"emails": [], "count": 0, "escalation_count": 0, "low_confidence_count": 0}

        # Single batch API call for all emails instead of N individual calls
        analyses = await self._batch_analyze_emails(emails)

        escalation_count = 0
        low_confidence_count = 0
        for e, analysis in zip(emails, analyses):
            e["category"] = analysis["category"]
            e["priority"] = analysis["priority"]
            e["sentiment"] = analysis["sentiment"]
            e["intensity"] = analysis["intensity"]
            e["confidence"] = analysis["confidence"]
            e["is_escalated"] = analysis["is_escalated"]
            e["summary"] = analysis["summary"]
            e["draft_reply"] = analysis["draft_reply"]
            if e["is_escalated"]:
                escalation_count += 1
            if e["confidence"] < 0.6:
                low_confidence_count += 1
            del e["body"]

        def sort_key(x):
            esc = 0 if x.get("is_escalated") else 1
            pri = {"High": 0, "Medium": 1, "Low": 2}.get(x.get("priority", "Medium"), 1)
            return (esc, pri)
        emails.sort(key=sort_key)
        return {"emails": emails, "count": len(emails), "escalation_count": escalation_count, "low_confidence_count": low_confidence_count}

    async def fetch_today_emails(self, limit=20):
        today_str = datetime.now().strftime("%d-%b-%Y")
        return await self.read_emails(limit=limit, search_criteria=f'(ON "{today_str}")')

    async def fetch_by_category(self, category, limit=20):
        all_emails = await self.read_emails(limit=limit)
        if "error" in all_emails:
            return all_emails
        filtered = [e for e in all_emails["emails"] if e.get("category") == category]
        return {"emails": filtered, "count": len(filtered)}

    async def fetch_by_priority(self, priority, limit=20):
        if priority not in PRIORITIES:
            return {"error": f"Invalid priority. Must be one of: {', '.join(PRIORITIES)}"}
        all_emails = await self.read_emails(limit=limit)
        if "error" in all_emails:
            return all_emails
        filtered = [e for e in all_emails["emails"] if e.get("priority") == priority]
        return {"emails": filtered, "count": len(filtered)}

    async def reply_with_draft(self, email_id, custom_message=None):
        """Sends a reply to a specific email, using the AI-generated draft or custom message."""
        result = await asyncio.to_thread(self._fetch_emails_raw, "ALL", 50)
        if "error" in result:
            return result
        original = None
        for e in result["emails"]:
            if e["id"] == email_id:
                original = e
                break
        if not original:
            return {"error": f"Email with id {email_id} not found."}

        body = custom_message or ""
        if not body:
            analyses = await self._batch_analyze_emails([original])
            body = analyses[0].get("draft_reply", "") if analyses else ""

        subject = original["subject"]
        if not subject.lower().startswith("re:"):
            subject = f"Re: {subject}"

        return await self.send_email(original["from"], subject, body)

    async def send_email(self, to, subject, body, priority="normal", cc=None):
        conn_err = self._ensure_connected()
        if conn_err:
            return conn_err
        # Sanitize headers to prevent injection and RFC violations
        to = to.replace('\r', '').replace('\n', ' ').strip() if to else to
        subject = subject.replace('\r', '').replace('\n', ' ').strip() if subject else subject
        cc = cc.replace('\r', '').replace('\n', ' ').strip() if cc else None
        def _do_send():
            msg = MIMEMultipart()
            msg["From"] = self.email_address
            msg["To"] = to
            if priority.lower() == "high" and "[URGENT]" not in subject.upper():
                msg["Subject"] = f"[URGENT] {subject}"
                msg["X-Priority"] = "1 (Highest)"
                msg["X-MSMail-Priority"] = "High"
                msg["Importance"] = "High"
            elif priority.lower() == "low":
                msg["Subject"] = subject
                msg["X-Priority"] = "5 (Lowest)"
                msg["Importance"] = "Low"
            else:
                msg["Subject"] = subject
            if cc:
                msg["Cc"] = cc
            msg.attach(MIMEText(body, "plain"))
            smtp = smtplib.SMTP_SSL(self.smtp_server, 465, timeout=15)
            smtp.login(self.email_address, self.password)
            recipients = [to]
            if cc:
                recipients.extend(cc.split(","))
            smtp.sendmail(self.email_address, recipients, msg.as_string())
            smtp.quit()
            return {"success": True, "message": f"Email sent to {to}."}
        try:
            return await asyncio.wait_for(
                asyncio.to_thread(_do_send),
                timeout=30.0
            )
        except asyncio.TimeoutError:
            return {"error": "Sending email timed out. Check your internet connection."}
        except Exception as e:
            return {"error": f"Failed to send email: {str(e)}"}
