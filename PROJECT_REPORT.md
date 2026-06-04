# A.P.A V2 — Autonomous Personal Assistant (Email Edition)

## Project Report

---

## 1. Executive Summary

A.P.A V2 is a voice-enabled desktop email assistant powered by Google's Gemini 2.5 Flash AI. It allows users to read, analyze, classify, and send emails through natural voice conversations or typed chat. The system uses zero-shot learning via a pre-trained Large Language Model (LLM) to perform email classification, sentiment analysis, priority detection, escalation identification, confidence scoring, and tone-matched draft reply generation — all without requiring a custom-trained model or labeled dataset.

The application runs as an Electron desktop app with a Python backend, using WebSocket (Socket.IO) for real-time communication and the Gemini Live API for bidirectional voice streaming.

---

## 2. Technologies Used

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **Vite** | Build tool and dev server |
| **Tailwind CSS** | Utility-first styling |
| **Socket.IO Client** | Real-time WebSocket communication |
| **Lucide React** | Icon library |
| **Electron 28** | Desktop application shell |

### Backend
| Technology | Purpose |
|---|---|
| **Python 3.12** | Runtime |
| **FastAPI** | HTTP server framework |
| **Socket.IO (python-socketio)** | WebSocket server |
| **Google Generative AI SDK** | Gemini API integration |
| **PyAudio** | Audio input/output stream handling |
| **smtplib / imaplib** | Email sending and fetching (SMTP/IMAP) |
| **uvicorn** | ASGI server |

### AI / ML
| Technology | Purpose |
|---|---|
| **Gemini 2.5 Flash** | Core LLM for all NLP tasks |
| **Gemini Live API** | Bidirectional voice streaming with low latency |
| **Zero-shot Prompting** | Task execution without fine-tuning |
| **Few-shot Prompting** | Category examples embedded in prompts |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Google Gmail (IMAP/SMTP)** | Email service provider |
| **Google Sheets API** | Audit logging (via service account) |
| **dotenv** | Environment variable management |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Electron App                       │
│  ┌───────────────────────────────────────────────┐  │
│  │              React Frontend                    │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │  │
│  │  │ Visualizer│ │ChatModule│ │ EmailWindow  │  │  │
│  │  └──────────┘ └──────────┘ └──────────────┘  │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │  │
│  │  │TopAudioBar│ │ComposeWin│ │ SettingsWin  │  │  │
│  │  └──────────┘ └──────────┘ └──────────────┘  │  │
│  │  ┌──────────┐ ┌──────────────────────────┐   │  │
│  │  │WidgetCont│ │     ToolsModule           │   │  │
│  │  └──────────┘ └──────────────────────────┘   │  │
│  └───────────────────────────────────────────────┘  │
│                       │ Socket.IO                    │
│                       ▼                              │
│  ┌───────────────────────────────────────────────┐  │
│  │              Python Backend                    │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │  │
│  │  │ server.py│ │ ada.py   │ │ email_agent  │  │  │
│  │  │ (FastAPI)│ │(AudioLoop│ │ .py          │  │  │
│  │  │          │ │+ Gemini) │ │ (IMAP/SMTP)  │  │  │
│  │  └──────────┘ └──────────┘ └──────────────┘  │  │
│  │  ┌──────────┐ ┌──────────────────────────┐   │  │
│  │  │tools.py  │ │   sheets_logger.py       │   │  │
│  │  │ (defns)  │ │   (Google Sheets Audit)  │   │  │
│  │  └──────────┘ └──────────────────────────┘   │  │
│  └───────────────────────────────────────────────┘  │
│                       │                              │
│                       ▼                              │
│              ┌──────────────────┐                    │
│              │  Gemini 2.5 Flash│                    │
│              │  + Gemini Live   │                    │
│              │  (Google AI)     │                    │
│              └──────────────────┘                    │
└─────────────────────────────────────────────────────┘
```

### Data Flow

1. **Voice Input:** User speaks → Microphone → PyAudio stream → Gemini Live API
2. **Voice Output:** Gemini Live API → Audio stream → PyAudio playback → Speakers
3. **Text Chat:** ChatModule → Socket.IO → server.py → ada.py `send_text()` → Gemini Live
4. **Email Reading:** Voice command → Gemini tool call → `read_emails()` → IMAP fetch → Batch analysis via Gemini API → Results returned to Gemini → Spoken summary to user + Widget/EmailWindow update
5. **Email Sending:** User command → Gemini tool call → `send_email()` → SMTP send → Confirmation

---

## 4. Machine Learning & AI Implementation

### 4.1 Model Used

**Google Gemini 2.5 Flash** via the Gemini Live API for voice and the standard API for batch email analysis.

- **Type:** Pre-trained autoregressive transformer (LLM)
- **Modality:** Text + Audio (Gemini Live supports bidirectional audio streaming)
- **Training data:** Internet-scale text corpus (not disclosed by Google)
- **Access method:** API inference only — no custom training or fine-tuning performed

### 4.2 Learning Paradigm: Zero-Shot Learning

Zero-shot learning is the ability of a model to perform tasks it was never explicitly trained on, using only its pre-existing knowledge and task descriptions provided at inference time.

**How it works in this project:**

All NLP tasks are performed by the same Gemini model through carefully crafted prompts. The model has never been fine-tuned on our specific email categories, yet it can classify, analyze sentiment, detect urgency, and write replies because its pre-training gave it a general understanding of language semantics, categories, and emotional nuance.

**Tasks performed as zero-shot:**

| Task | Prompt Strategy |
|---|---|
| Email Classification | Ask model to assign one of 4 categories with brief descriptions |
| Priority Detection | Ask model to evaluate urgency based on keywords, deadlines, tone |
| Sentiment Analysis | Ask model to classify emotional polarity (Positive/Neutral/Negative) |
| Sentiment Intensity | Ask model to rate Mild/Moderate/Severe based on language strength |
| Escalation Detection | Rule: Negative + High Priority + Moderate/Severe Intensity |
| Confidence Scoring | Ask model to self-report 0.0–1.0 confidence in its predictions |
| Tone-Matched Draft Reply | Ask model to write a reply matching the detected sentiment+intensity |
| Email Summary Generation | Ask model to produce a concise summary of each email |

### 4.3 Prompt Engineering

The system uses a **structured few-shot prompt** for batch email analysis. The prompt:

1. Defines the 4 email categories with examples (few-shot)
2. Explains priority levels (High/Medium/Low)
3. Describes sentiment types and intensity levels
4. Requests a confidence score
5. Specifies the exact JSON output format
6. Requires ordered output matching the input sequence

**Sample prompt structure (simplified):**

```
Classify each email below into one of these categories:
- Academic: Coursework, research, grades, lectures, deadlines
- Finance: Payments, fees, scholarships, invoices, refunds
- Administration: Registration, forms, policies, official notices
- General Inquiries: Questions, invitations, notifications, casual

For each email, provide: category, priority (High/Medium/Low),
sentiment (Positive/Neutral/Negative), intensity (Mild/Moderate/Severe),
confidence (0.0-1.0), a brief summary, and a draft reply.

Return as a JSON array in the SAME ORDER as the input emails.
```

### 4.4 Batch Analysis Optimization

To minimize API quota usage, all uncached emails are analyzed in a **single Gemini API call** rather than one call per email:

- **Without batching:** N emails × 1 API call = N calls per fetch
- **With batching:** 1 API call per fetch regardless of email count

The prompt requests a JSON array response in the same order as the input, which is then mapped back to individual email objects programmatically.

### 4.5 Caching (Memoization)

An in-memory cache (`_analysis_cache` dictionary) stores analysis results keyed by `sender|subject[:100]`. On subsequent fetches, previously analyzed emails skip the API call entirely. The cache persists for the lifetime of the server process.

### 4.6 Confidence Scoring

Each email analysis includes a self-reported confidence score (0.0–1.0). The AI model evaluates its own certainty for each classification. Emails with confidence < 0.6 trigger a yellow warning banner in the UI, prompting manual review.

---

## 5. Dataset

**No custom dataset was collected or used for this project.**

The system relies entirely on **zero-shot learning** with Gemini 2.5 Flash, which was pre-trained by Google on a large-scale, undisclosed corpus of internet text data.

**Implications:**
- No data collection costs
- No privacy concerns (user emails are never stored for training)
- No labeling effort required
- No training infrastructure needed
- Instant deployment — no training time

**The only data the system accesses is:**
- User's live inbox emails (fetched in real-time via IMAP, analyzed once, cached in memory)
- Email configuration credentials (stored locally, never transmitted to third parties except Gmail)

---

## 6. Features Implemented

### 6.1 Email Classification
Emails are classified into 4 categories:
- **Academic** — Coursework, research, grades, lectures
- **Finance** — Payments, fees, scholarships, invoices
- **Administration** — Registration, policies, official notices
- **General Inquiries** — Questions, invitations, casual

### 6.2 Priority Detection
- **High** — Deadlines, urgent requests, time-sensitive
- **Medium** — Standard importance
- **Low** — Informational, newsletters, casual

### 6.3 Sentiment Analysis
- **Positive** — Appreciation, acceptance, good news
- **Neutral** — Informational, matter-of-fact
- **Negative** — Complaints, rejections, issues

### 6.4 Sentiment Intensity
- **Mild** — Slight preference or minor concern
- **Moderate** — Clear emotion but measured tone
- **Severe** — Strong language, urgent emotion, all-caps

### 6.5 Tone-Matched Draft Replies
Gemini generates a draft reply whose tone adapts to the sender's sentiment and intensity:
- Negative + Severe → Empathetic, apologetic, formal
- Positive + Mild → Warm, appreciative, casual
- Neutral → Professional, concise, direct

### 6.6 Escalation Detection
An email is flagged as "escalated" when:
- Sentiment = Negative
- Priority = High
- Intensity = Moderate or Severe

Escalated emails appear with a red banner, are sorted to the top of the inbox, and trigger a pulsing counter badge in the top bar.

### 6.7 Confidence Scoring
- Each analysis includes a 0.0–1.0 confidence score
- < 0.6 triggers a yellow warning banner
- Enables manual review for uncertain classifications

### 6.8 Google Sheets Audit Logging
All email fetches, sends, and analysis results are logged to a Google Sheet via a service account, providing an auditable trail.

### 6.9 AI Chat Assistant
Users can type messages in the ChatModule, which are forwarded to the Gemini Live session for real-time conversational AI responses alongside voice.

### 6.10 Email Compose Window
A dedicated compose form with To/Subject/Body fields and priority (Normal/High/Low) toggle, sent via the `send_email` socket handler.

---

## 7. API & Quota Management

| API | Usage | Quota Consideration |
|---|---|---|
| Gemini 2.5 Flash (standard) | Batch email analysis | 1 call per inbox fetch (all emails batched) |
| Gemini Live API | Voice conversation session | Continuous during active session |
| Gmail IMAP | Fetch emails | Standard Gmail limits |
| Gmail SMTP | Send emails | Standard Gmail limits |
| Google Sheets API | Audit logging | Free tier: 100 requests/100 seconds |

**Optimization:**
- Batch analysis reduces Gemini API calls from N per fetch to 1 per fetch
- In-memory caching eliminates re-analysis on repeated fetches
- Subconscious monitor (every 120s) uses cache for repeat emails
- 10-second timeout per analysis call prevents hanging

---

## 8. Development & Deployment

### Build Process
- Frontend: Vite builds React into static assets (`dist/`)
- Backend: Python scripts run directly (no build step)
- Electron: Loads Vite dev server in development, built assets in production

### Running the Application
```
npm run dev     # Starts Vite + Electron concurrently
cd backend && python server.py   # Or started by Electron automatically
```

### Environment Variables (`.env`)
```
GEMINI_API_KEY=your_gemini_api_key
VERTEX_ENABLED=false
```

---

## 9. Conclusion

A.P.A V2 demonstrates that a powerful email assistant can be built using pre-trained LLMs with zero-shot learning, eliminating the need for custom datasets, model training, and ML infrastructure. The system achieves accurate email classification, sentiment analysis, and intelligent reply generation through prompt engineering alone, while batch processing and caching optimize API costs.

This approach represents a modern paradigm in applied ML: leveraging foundation models as the AI backbone and focusing engineering effort on integration, UX, and optimization rather than model development.
