# A.P.A V2: Autonomous Personal Assistant

**Final Year Project** | HDIT Final Project | ICST University Park

*A voice-driven Windows desktop agent with a proactive interruption engine*

> **Speaker notes:** Introduce yourself and the project. A.P.A stands for Autonomous Personal Assistant: a voice-driven Windows desktop assistant that reads email, speaks up when something is urgent, and can carefully control the desktop. Outline: introduction, problem, aim and objectives, existing solutions and gap, proposed solution, methodology, system design, implementation progress, findings, remaining work and conclusion.

---

## Slide 2: Introduction / Background

A.P.A V2 is a voice-driven Windows desktop assistant. It holds natural voice conversations, reads and sends email with AI triage, answers weather questions on a 3D globe, and decides when to speak up. It is the foundation for a longer vision: an assistant that helps busy professionals by eventually operating the PC for them.

- **Voice assistants today:** Siri, Alexa and Google normalised speech but kept it shallow: timers, search, smart home. The limit is device and cloud lock-in, not speech technology.
- **Realtime voice agents:** Native-audio APIs with function calling let a voice model invoke local tools mid-conversation (read mail, send mail, fetch weather) and speak the result.
- **Zero-shot email understanding:** A large model is prompted once per inbox fetch for category, priority, sentiment and draft replies. No classifier training is needed.

> **Speaker notes:** Define A.P.A V2 in one sentence. Phase 1 built the foundation: voice conversation, Gmail triage with AI, weather on a 3D globe and a desktop interface. The longer vision is a proactive assistant that speaks up when something needs attention. Then give the three background points: commercial assistants are shallow and locked in, realtime voice APIs now allow tool calling mid-conversation, and large models can classify email zero-shot with no training.

---

## Slide 3: Problem Statement

Why existing tools fall short:

- **Phone assistants:** Live on mobile devices. No access to the desktop inbox, files or applications.
- **Cloud assistants:** Closed ecosystems. Specialised workflows such as escalation triage and audit logging are impossible.
- **Agent frameworks:** Powerful but text-only. No persistent presence, no spoken interaction, no glanceable visual state.

**Problem statement:** Busy PC-based professionals lose hours every week to inbox triage and routine checks. They need a local, voice-driven assistant that triages email intelligently, answers routine queries with visual proof and grows toward proactive PC operation, without surrendering credentials or data to closed ecosystems.

> **Speaker notes:** Start with the time burden: professionals lose hours every week to inbox triage, routine checks and switching apps. The information never comes to the user with a spoken summary and a ready draft. Then the three reasons existing tools fail, and read the problem statement.

---

## Slide 4: Research Aim & Objectives

**Aim:** To design, build and demonstrate a voice-driven desktop assistant that converses naturally, triages email intelligently and decides when to interrupt, as the foundation for later autonomy.

| # | Objective |
| --- | --- |
| O1 | Realtime voice loop with speech gating, transcription and text fallback |
| O2 | Gmail read/send with zero-shot triage (priority, sentiment, escalation, drafts) and audit logging |
| O3 | Keyless city weather hunt with globe lock-on and forecast card |
| O4 | Cinematic HUD (state orb, staged cards) in a packaged desktop shell |
| O5 | Verify end-to-end behaviour on the host machine and record defects |
| O6 | Evaluate email accuracy and voice reliability against defined tests |

**Not in scope:** wake-word, autonomous background agency, browser control, Outlook, mobile, and any claim of sentience or production readiness.

> **Speaker notes:** Read the aim, then the six objectives briefly. O1 to O4 are the build objectives, O5 is verification, O6 is evaluation. Mention the non-objectives to show you kept the scope controlled.

---

## Slide 5: Existing Solutions & Research Gap

| System | Voice | Desktop presence | Email workflow | Visual proof | Autonomy |
| --- | --- | --- | --- | --- | --- |
| Siri / Alexa / Google | Yes | No (mobile, speaker) | Basic read-out | None | Routines only |
| Hermes Agent (Nous) | Voice memos only | No (terminal, chat) | Via integrations | None | High (memory, cron) |
| God's Eye View | Yes (scene control) | Browser globe | None | Photoreal globe | Scene director only |
| **A.P.A V2** | Full duplex + tools | Yes (Electron HUD) | Triage, drafts, audit | Globe + staged cards | Gated interruptions |

**The research gap:** No open, locally runnable desktop assistant unifies realtime voice tool-calling, audited zero-shot email triage and visual proof in one extensible body designed to grow into proactive PC operation. The contribution is systems integration, not a new algorithm.

> **Speaker notes:** Compare three kinds of existing system. Siri, Alexa and Google are voice-first but closed and PC-blind. Hermes Agent has strong autonomy but no voice or desktop face. God's Eye View has a photorealistic globe but no email workflow. State honestly that A.P.A V2 does not beat Hermes at autonomy or God's Eye at photorealism. Its contribution is the combination, which none of them offers: full-duplex voice with local tools, a persistent desktop face and an audited email workflow.

---

## Slide 6: Proposed Solution

- **Voice:** Natural speech-to-speech with live transcription and tool calling in one session.
- **Email intelligence:** Batched triage: category, priority, sentiment, escalation and draft replies.
- **Safe desktop control:** GUI automation (screenshots, mouse, keyboard) only after confirmation.
- **Proactive interruptions:** A score plus seven gates decides whether to speak, defer or stay silent.
- **Gemini 2.5 Flash (zero-shot):** Live API for voice, JSON API for email. No training, no custom dataset.
- **Separation of powers:** The model proposes tool calls. Deterministic host policy decides and logs.

> **Speaker notes:** Explain A.P.A V2 as five ideas: voice, email intelligence, proactive interruptions, safe desktop control, and the Gemini zero-shot engine underneath. Close on separation of powers: the model proposes a tool call but the host decides and logs. This is why actions are safe and auditable.

---

## Slide 7: Research Methodology

**Four phases:** 1 Review → 2 Design → 3 Build → 4 Verify

| Phase | Activity |
| --- | --- |
| 1 Review | Comparable systems and gap analysis |
| 2 Design | Layered architecture, tool-calling with confirmation |
| 3 Build | Iterative prototype with frozen scope |
| 4 Verify | Test on the running app, log defects, evaluate |

- **Zero-shot prompt engineering:** Language understanding comes from prompts to a foundation model, returned as strict JSON and validated in Python.
- **Tools plus confirmation:** The model proposes; the host executes under policy. Reads are free, actions need confirmation.
- **Evidence-based progress:** Each change is verified on the running app. Defects are recorded and claims limited to what is measured.

> **Speaker notes:** Describe the approach as design-and-build research: review comparable systems, design the architecture, build iteratively with the scope frozen, then verify and evaluate. The three method cards explain how: zero-shot prompt engineering instead of training models, tools plus confirmation as the action pattern, and every change checked on the running app with defects recorded. Evaluation data: a hand-labelled sample of 50 to 100 inbox messages, scripted voice utterance sets and session logs.

---

## Slide 8: System Design

*(The slide includes an architecture diagram, which is not reproduced in this file.)*

- **UI + Transport:** Electron + React 18, Tailwind; real-time Socket.IO link.
- **Python host:** Python 3.12, FastAPI: policy, validation, routing.
- **Gemini:** Live API for voice, 2.5 Flash for email; PyAudio.
- **Services:** IMAP/SMTP email, computer_use MCP, JSONL + Sheets audit.

**Key principle:** Gemini proposes and understands; deterministic host policy controls actions.

> **Speaker notes:** Read the diagram left to right. The React interface talks to the Python backend over Socket.IO, which is the single nervous system: every event travels one channel so new capabilities plug in easily. The Python host calls Gemini, reads and sends email, controls the desktop and writes the audit trail. Nothing acts without passing through the host. Stack in one breath: Electron and React for the app, Python FastAPI for the brain, Socket.IO for real time, Gemini for AI, PyAudio for sound, IMAP and SMTP for mail so there is no provider lock-in, and Google Sheets plus JSONL for audit.

---

## Slide 9: Implementation Progress

*(The slide includes a one-page infographic image, which is not reproduced in this file.)*

- ✅ Desktop stack running: Electron, React, FastAPI
- ✅ Voice loop: Gemini Live, RMS gate
- ✅ Email: IMAP/SMTP, 1 batched call, cache
- ✅ Weather hunt with 3D globe
- ✅ Cinematic HUD: state orb, staged cards
- ✅ Interruption engine: score ≥ 6.0 + 7 gates
- ✅ Desktop control: actuators need confirmation
- ✅ Audit trail: JSONL and Google Sheets

> **Speaker notes:** Use the infographic as your one-page overview and point to each numbered box. Then read the checklist: everything on it is built and running. Voice loop: the microphone captures 16 kHz audio, a local RMS gate (threshold 400, 8-chunk hangover) keeps silence from reaching Gemini Live, the host checks policy before any tool runs, and speakers play 24 kHz audio. Microphone chunks are discarded while the assistant speaks so it never answers itself. Email: IMAP fetch with cache, all new emails in ONE Gemini call (20 mails = 1 request), Python validation, escalation computed in code, amber badge under 0.6 confidence. Interruption engine: score = urgency + 3.0 x confidence + relevance + social - 0.5; it speaks only at 6.0 or above AND when all seven gates pass (example: 8.4); outcomes are speak, defer or silence, with a 10-minute cooldown and a cap of five a day. Safety: read-only tools run freely, actuators need confirmation and denial aborts, the emergency stop is never gated, and automation is GUI-only. Every decision goes to a JSONL evidence file and a Google Sheets log.

---

## Slide 10: Research Progress & Findings

**Result: 8 / 8** interruption scenarios passed: urgent mail, mid-speech, cooldown, noise cases and more.

- **Verified so far:** Boot, email (real Gmail IMAP/SMTP) and weather (Tokyo) tested end to end. Computer bridge verified live at protocol and tool level.
- **Defects found and fixed:** Mute control did nothing (missing backend handlers). Silence caused hallucinated speech; fixed by the RMS voice gate.
- **Key findings:** One batched call plus cache keeps API cost low; the voice gate also cuts audio tokens; code-based escalation is auditable.

> **Speaker notes:** State what has been verified: boot, email with a real Gmail login, weather for Tokyo, the interruption matrix at 8 of 8, and the computer bridge live. Then the two defects found and fixed: the mute control did nothing because the backend lacked matching handlers, and silence caused hallucinated speech, fixed by the RMS gate. Findings: batching and caching keep API cost low, and the gate also cuts audio token use. Be clear the 8/8 covers only those scenarios and email accuracy is not yet measured.

---

## Slide 11: Remaining Work & Timeline

| Period | Work |
| --- | --- |
| Weeks 1-2 | Hardening: reconnection, settings, installer |
| Weeks 3-4 | Evaluation: labelling, tests, latency |
| Weeks 5-6 | Report and demo script |
| Phase 2 | Wake-word, monitoring, browser, Outlook |
| Phase 3 | Supervised PC control, pilot users |

**What is left to evaluate:**

- **Email:** Hand-label 50-100 messages; target above 75% agreement before claiming usefulness.
- **Voice:** Gating false-cut rate, ghost transcripts, tool-call correctness.
- **Safety:** Send without confirmation must fail; credentials never in logs.
- **Performance:** Cold-start time, fetch-to-summary latency, API cost per session.

> **Speaker notes:** Be honest about what is left: evaluation. Email accuracy has not been measured yet, so the plan is to hand-label 50 to 100 messages and compare; the target is above 75 percent agreement before claiming usefulness. Voice reliability, interface walkthrough, performance and safety tests follow. Then the timeline: weeks 1-2 hardening, weeks 3-4 evaluation, weeks 5-6 report and demo. Phase 2 adds awareness (wake-word, scheduled monitoring, browser awareness, Outlook). Phase 3 adds supervised PC control and a pilot.

---

## Slide 12: Conclusion

**Voice, email and desktop control in one Windows assistant.**

**Contribution:** A working, extensible desktop assistant foundation: realtime voice tool-calling, audited email triage, a gated interruption engine, integrated and reported with defects included.

Key points:

- Gemini 2.5 Flash, zero-shot: no custom training
- Email analysed in ONE batch, cached and validated
- Speaks only when score ≥ 6.0 AND every gate passes
- Actions need confirmation; every decision is logged

**Limits, stated honestly:** Single-machine prototype. Email accuracy not yet measured. No claim of autonomy or production readiness.

> **Speaker notes:** Summarise: A.P.A V2 combines voice, email intelligence and gated desktop control. Gemini is used zero-shot with no custom training. Email is analysed in one batch, cached and validated. The assistant speaks only when the score and every gate pass. Actions need confirmation and every decision is logged. State the contribution as systems integration and be honest about the limits: no autonomy, self-awareness or production readiness is claimed. End on the key principle: the model proposes; the policy decides. Then invite questions. Likely answers: two Gemini interfaces because the Live API handles native audio and tool calling while the standard API suits batched JSON email analysis; escalation is computed in code (negative sentiment AND high priority AND moderate-or-severe intensity); the interruption threshold is a score of at least 6.0 with every gate passing; host policy, not Gemini, decides whether a click is allowed. Future work: wake-word, background monitoring, browser awareness, Outlook and wider PC operation under the same safety policy.
