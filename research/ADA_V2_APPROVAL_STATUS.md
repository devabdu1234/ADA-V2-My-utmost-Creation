# Approval Stage Status: ADA-V2

**Current Phase:** Proposal Preparation / Awaiting Lecturer Approval.
**Vision:** A unified AI personal companion (ADA-V2) integrating general intelligence, tool use, and proactive S2S interaction.

## 1. Verified Implementation Status (Preliminary Prototype)
The following components are implemented as "Proof of Feasibility":
- **Proactive Engine:** Weighted utility scoring for interruptions (`backend/proactive.py`).
- **S2S Interaction:** Native audio-to-audio loop via Gemini 2.5 Flash (`backend/ada.py`).
- **System Agency:** MCP-based computer control and tool orchestration.
- **Sensing:** Basic IMAP email monitoring and Voice Activity Detection (VAD).

## 2. Planned Research (Awaiting Approval)
The proposed research focuses on a specific, measurable question: **The effect of S2S proactivity on cognitive resumption lag.**
- **Planned Study:** A three-arm A/B/C trial comparing visual vs. S2S notifications.
- **Planned Metrics:** Objective latency (ms) and NASA-TLX workload scores.

## 3. Work Deferred Until Approval
To maintain academic integrity, the following are **paused**:
- **Instrumentation:** No objective latency logging has been implemented yet.
- **Human Research:** No participants have been recruited; no data has been collected.
- **Software Hardening:** Large-scale refactoring and portability fixes are deferred.
- **Integration:** Integration of the FreeLLMAPI gateway is a proposed architectural decision.

## 4. Decisions Required from Lecturer
- **Research Question:** Is the focus on "S2S vs. Visual Modality" sufficiently novel and narrow?
- **Methodology:** Is the A/B/C design and the use of NASA-TLX appropriate for this project level?
- **Ethics:** What are the specific institutional requirements for the proposed pilot study?
