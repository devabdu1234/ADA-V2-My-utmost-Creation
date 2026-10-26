# ADA-V2 MASTER RESEARCH REPORT

**Status:** Proposal Stage / Awaiting Lecturer Approval
**Version:** 1.1 (Final Consolidated & Academic Refined)
**Date:** 2026-10-24

---

## 1. Executive Summary
ADA-V2 is a unified AI personal companion designed to integrate general conversational intelligence, tool-based computer agency, and context-aware proactive assistance. While the system's overarching vision is a general-purpose assistant, the core research contribution focuses on the **mitigation of cognitive resumption lag**. 

Existing proactive assistants typically rely on a "cascaded" interaction model (Visual Alert $\to$ User Acknowledgment $\to$ Voice Session), which creates significant cognitive friction. ADA-V2 proposes a **Native Speech-to-Speech (S2S) Proactive Framework** that eliminates this modality gap, delivering urgent information through a seamless, low-latency audio stream. This report details the technical feasibility, the academic gap, and the proposed experimental validation of this approach.

---

## 2. Full Product Vision: The All-in-One Companion
ADA-V2 is conceived as a "Jarvis-style" assistant that serves as a central hub for a user's digital life.

### A. Intended Capability Areas
- **General Intelligence:** Natural, multi-turn conversations and complex reasoning using state-of-the-art LLMs.
- **Daily Assistance:** Proactive email prioritization, live weather integration, and productivity planning.
- **Project & Coding Assistance:** Technical problem solving, document synthesis, and multi-step workflow execution.
- **Computer Agency:** System-level interaction via the Model Context Protocol (MCP), enabling the agent to see the screen and execute permitted GUI actions.
- **Voice-First Interaction:** A native S2S loop for fluid, conversational engagement without the latency of traditional STT/TTS pipelines.
- **Context-Aware Proactivity:** A "Subconscious Monitor" that identifies useful intervention opportunities and balances them against the user's current cognitive load.

### B. Architectural Strategy
The system utilizes a decoupled architecture where the **Interface Layer** (Electron/React) communicates via Socket.IO to a **Backend Orchestrator** (FastAPI). The orchestrator manages the **S2S Audio Loop**, the **Proactive Engine**, and **MCP Tool Bridges**. Future integration of **FreeLLMAPI** is proposed to provide a unified inference gateway for model routing and fallback.

---

## 3. Response to Lecturer's Research Novelty Feedback

### Q1: What specific limitation in existing research does ADA-V2 address?
**The "Proactive Modality Gap."** 
Existing research in proactive agents (e.g., *ContextAgent*) focuses heavily on the *decision* to be proactive (the "when" and "why"). However, the *delivery* (the "how") remains largely cascaded: a visual or TTS alert is sent, and the user must then manually transition into a conversational state. This transition creates a "modality gap" that increases cognitive resumption lag. ADA-V2 addresses this by integrating the proactive trigger directly into a **Native S2S pipeline**, allowing the system to transition from background monitoring to a high-nuance conversational state in a single, fluid motion.

### Q2: How is the interruption mechanism different from previously proposed approaches?
Unlike rule-based systems, ADA-V2 employs a **Multi-Factor Weighted Scoring Engine** and a **Dual-Gate Architecture**:
1. **The Scoring Engine:** Computes a utility score $S = U + (W_{conf} \cdot C) + R + \Sigma_{soc} - F$. This considers not just priority ($U$), but also model confidence ($C$), semantic relevance ($R$), and current social/activity signals ($\Sigma_{soc}$).
2. **The Dual-Gate:** Even a high-scoring event is blocked if "Gates" are active (e.g., User is speaking, Cooldown active, or Daily Cap reached). 
This transforms the interruption from a binary trigger into a heuristic operationalization of the **Net Expected Value of the Alert (NEVA)**.

### Q3: Why were the scoring weights and interruption thresholds selected?
The current weights (e.g., $\text{Escalated}=4.0$, $\text{Conf}=3.0$, $\text{Threshold}=6.0$) are **provisional engineering heuristics** derived from a baseline "cost-of-interruption" policy. They are designed to prioritize high-certainty, high-urgency events while suppressing noise. These parameters are not claimed as scientifically optimized; rather, they serve as the baseline for the proposed **Ablation Study** and **Calibration Phase** of the research.

### Q4: What measurable improvement does the proposed approach provide?
We hypothesize that the native S2S proactive approach will provide:
- **Reduced Task Resumption Time (TRT):** A measurable decrease in the time between notification end and the first valid task-relevant input.
- **Lower Cognitive Workload:** A reduction in perceived mental demand, as measured by the NASA-TLX scale.
- **Equivalent Recall:** Maintaining high critical-information recall without the jarring effect of visual pop-ups.
*Note: These improvements are currently hypotheses to be tested via the proposed A/B/C experiment.*

### Q5: Which research papers support the claimed research gap?
The gap is identified by contrasting **Attention-Sensitive Alerting** (Horvitz et al., 1999) and **Task Resumption research** (Mark et al., 2008) with the recent emergence of **Native S2S models** (Gemini Live, OpenAI Realtime). While Horvitz established the "when" (timing), and S2S models established the "how" (low-latency audio), there is a lack of empirical research on combining the two to specifically mitigate the "modality gap" in proactive interruptions.

---

## 4. Research Contribution & Novelty Statement

**Proposed Contribution:**
The project proposes a **Native Multimodal Proactive Framework** that minimizes the cognitive cost of AI interventions. The novelty lies in the **architectural synthesis** of a utility-based proactivity engine with a native S2S audio loop.

**Novelty Verdict:** **Plausible Extension of Established Methods.**
The contribution is not a new mathematical discovery, but an **HCI (Human-Computer Interaction) innovation**. It moves the field from "Reactive S2S" to "Proactive S2S," testing whether a seamless audio transition is less disruptive than a traditional visual notification.

---

## 5. Proposed Methodology & Experimental Design

### Research Question
*"How does proactive conversational speech-to-speech interaction, compared with conventional notification approaches, affect task-resumption time, perceived cognitive workload, and critical-information retention during ongoing tasks?"*

### A/B/C Experimental Conditions
To isolate the effect of **Timing** vs. **Modality**, we propose a within-subjects study:
- **Condition A (Control):** Immediate Visual Notifications (Standard OS pop-ups).
- **Condition B (Timing Control):** Proactive Visual Notifications (delivered via the scoring engine).
- **Condition C (Experimental):** Proactive Native S2S Interactions.

### Operational Metrics
1. **Task Resumption Time (TRT):** Objective latency $T_{first\_input} - T_{notif\_end}$, measured via the MCP bridge.
2. **Cognitive Workload:** Measured via the **NASA-TLX** (Task Load Index).
3. **Information Recall:** Binary accuracy score on a post-task quiz.

---

## 6. Implementation & Feasibility Audit

### Verified Current Implementation
The following are implemented as a technical prototype to prove feasibility:
- **Proactive Engine:** `backend/proactive.py` (Weighted scoring logic).
- **S2S Loop:** `backend/ada.py` (Native Gemini Live integration).
- **Email Agent:** `backend/email_agent.py` (IMAP/SMTP analysis).
- **Computer Agency:** `backend/computer_bridge.py` (MCP tool calls).

### Planned Engineering Tasks
- **Objective Latency Logger:** Implementation of millisecond-accurate $T_1/T_2$ timestamps.
- **Experimental Toggles:** Logic to switch between A, B, and C conditions.
- **Portability Fix:** Removing hardcoded paths in `electron/main.js`.
- **Inference Gateway:** Integration of FreeLLMAPI for model routing and reliability.

---

## 7. Limitations and Risks
- **The Novelty Effect:** Users may rate S2S higher simply because it is new. This will be mitigated by a 48-hour acclimation period.
- **Environmental Noise:** Acoustic interference may affect S2S delivery. This will be controlled using noise-canceling headphones.
- **Sample Size:** The proposed pilot study ($N=10$) is for feasibility and variance estimation, not for final statistical confirmation.

---

## 8. Final Recommendation & Roadmap

**Verdict: GO (as a Research Proposal).**
The project is technically feasible and addresses a legitimate gap in HCI. However, it must move from "Prototype" to "Experiment."

**Immediate Roadmap:**
1. **Lecturer Approval:** Submit this report for review.
2. **Instrumentation:** Implement the latency logging.
3. **Pilot Study:** Run an $N=10$ feasibility test.
4. **Main Study:** Full data collection and ANOVA analysis.
5. **Final Thesis:** Document the results of the S2S vs. Visual comparison.
