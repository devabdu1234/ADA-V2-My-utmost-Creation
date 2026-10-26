# ADA-V2: FINALIZED RESEARCH & TECHNICAL COMPENDIUM

**Status:** Proposal Stage / Awaiting Lecturer Approval
**Date:** 2026-10-24
**Version:** 1.0 (Final Consolidated)

---

## 1. EXECUTIVE SUMMARY
ADA-V2 is a unified AI personal companion designed to integrate general conversational intelligence, tool-based computer agency, and context-aware proactive assistance. While the system is presented as an all-in-one assistant, the core academic contribution is a study on the **mitigation of cognitive resumption lag**.

The project proposes that by replacing traditional "cascaded" notifications (Visual $\to$ User $\to$ Voice) with a **Native Speech-to-Speech (S2S) Proactive Framework**, the system can deliver urgent information while minimizing the cognitive friction and "context-switch penalty" typically associated with digital interruptions.

---

## 2. THE FULL PRODUCT VISION
ADA-V2 is conceived as a "Jarvis-style" assistant, moving beyond a simple chatbot to a system with true agency.

### A. Core Capability Areas
- **General Intelligence:** Multi-turn reasoning and contextual conversation via state-of-the-art LLMs.
- **Daily Assistance:** Proactive email prioritization, live weather, and productivity planning.
- **Project & Coding Agency:** Technical problem solving and multi-step workflow execution.
- **Computer Interaction:** System-level agency via the Model Context Protocol (MCP), allowing the agent to see the screen and execute permitted GUI actions.
- **Voice-First Presence:** Native S2S interaction for fluid, low-latency engagement.
- **Context-Aware Proactivity:** A "Subconscious Monitor" that balances information utility against user cognitive load.

### B. Proposed Technical Architecture
The system follows a decoupled architecture:
- **Interface Layer:** Electron/React shell for user interaction.
- **Orchestration Layer:** FastAPI/Socket.io server managing the `AudioLoop` and `ProactiveEngine`.
- **Inference Layer:** Native S2S (Gemini 2.5 Flash) with a proposed transition to a unified gateway (**FreeLLMAPI**) for model routing and reliability.
- **Agency Layer:** MCP Bridge for OS-level control and tool execution.

---

## 3. ACADEMIC FOUNDATION & LITERATURE REVIEW

### 3.1 The Interruption Paradox
Research in Human-Computer Interaction (HCI) establishes that interruptions are not binary but involve a cost-benefit trade-off.
- **NEVA (Horvitz et al., 1999):** The "Net Expected Value of an Alert" posits that an interruption is justified only if the benefit of the info outweighs the cost of the break.
- **Resumption Lag (Gloria Mark):** The cognitive effort required to return to a primary task after an interruption.

### 3.2 The Modality Gap
Existing proactive agents typically use a **Cascaded Pipeline** (Trigger $\to$ Visual Notification $\to$ User Acknowledgment $\to$ Voice Session). This creates a "Modality Gap" where the user must manually shift mental modes.
- **Native S2S (The ADA-V2 Approach):** By utilizing native latent audio space, ADA-V2 allows a seamless transition from background monitoring to a high-nuance conversational state, potentially reducing the cognitive "spike" of the interruption.

### 3.3 Related Work Comparison
| Study | Focus | Modality | Architecture | Limitation | ADA-V2 Distinction |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Horvitz (1999)** | Alerting Logic | Mixed | Bayesian | Focuses on *when*, not *how*. | Integrates timing with S2S modality. |
| **ContextAgent (2025)**| Proactivity | Multimodal | LLM-based | Focuses on the decision. | Focuses on the S2S delivery. |
| **S2S Models (2024)** | Latency | Native S2S | Multimodal | Primarily reactive. | Implements proactive initiation. |

---

## 4. PROPOSED RESEARCH CONTRIBUTION

**The Research Question:**
*"How does proactive conversational speech-to-speech interaction, compared with conventional notification approaches, affect task-resumption time, perceived cognitive workload, and critical-information retention during ongoing tasks?"*

**The Novelty Claim:**
The contribution is an **Architectural Innovation in HCI**. It synthesizes Attention-Sensitive Alerting, Native S2S Latency Reduction, and Cognitive Workload Management into a single system. The novelty is the lapped-use of native S2S to solve the "modality gap" of proactive notifications.

---

## 5. TECHNICAL SPECIFICATION (VERIFIED PROTOTYPE)

The following logic is implemented in the current prototype as a "Proof of Technical Feasibility."

### 5.1 The Proactive Scoring Engine
The system calculates an "Interrupt-Worthiness" score $S$:
$$S = U + (w_{conf} \cdot C) + R + \Sigma_{soc} - F$$

**Variable Definitions:**
- **$U$ (Urgency):** Escalated (4.0), High (3.0), Medium (1.0), Low (0.2).
- **$C$ (Confidence):** Model confidence [0, 1] $\times$ weight (3.0).
- **$R$ (Relevance):** Keyword match (2.0) or penalty (-1.5).
- $\Sigma_{soc}$ **(Social Context):** Micro-activity detected (1.5).
- **$F$ (Focus):** Baseline penalty (0.5).

### 5.2 The Decision Gates
Even if $S \ge 6.0$, the interaction is blocked if any gate is active:
- **Temporal:** Cooldown active (600s) or Daily Cap reached (5/day).
- **User State:** User is currently speaking (VAD RMS $\ge 400$) or AI is speaking.
- **Urgency:** Event is not "High" or "Escalated."

### 5.3 Technical Stack
- **Backend:** Python 3.12, FastAPI, Socket.io.
- **AI:** Gemini 2.5 Flash (Native S2S modalities).
- **Shell:** Electron / React.
- **Agency:** MCP (Model Context Protocol) for computer control.

---

## 6. PROPOSED EXPERIMENTAL DESIGN

### 6.1 A/B/C Conditions
A within-subjects study will compare three conditions:
- **Condition A (Control):** Immediate Visual Notifications (Standard pop-ups).
- **Condition B (Timing Control):** Proactive Visual Notifications (using the Scoring Engine).
- **Condition C (Experimental):** Proactive Native S2S Interactions.

### 6.2 Operational Metrics
- **Task Resumption Time (TRT):** $\text{Lag} = T_{first\_input} - T_{notif\_end}$ (Objective latency).
- **Cognitive Workload:** Measured via the **NASA-TLX** scale.
- **Information Recall:** Accuracy score on a post-task quiz.

### 6.3 Analysis Plan
- **Sample:** Pilot $N=10$ for variance estimation.
- **Test:** Repeated-measures ANOVA with Tukey's HSD post-hoc analysis.
- **Significance:** $\alpha = 0.05$.

---

## 7. PROJECT STATUS & ROADMAP

**Current Phase:** Proposal Stage / Awaiting Lecturer Approval.

### Status Summary:
- **Implemented:** Core S2S loop, Proactive scoring logic, Email agency, MCP bridge.
- **Proposed:** Objective latency instrumentation, Human study, FreeLLMAPI integration.
- **Deferred:** Large-scale refactoring and data collection (awaiting approval).

### Proposed Roadmap:
1. **Approval Gate:** Submit this report for lecturer review.
2. **Instrumentation:** Implement $T_1/T_2$ logging for TRT.
3. **Pilot Study:** Run $N=10$ feasibility test.
4. **Main Study:** Full data collection and ANOVA analysis.
5. **Thesis:** Document the lapped-results of S2S vs. Visual modality.
