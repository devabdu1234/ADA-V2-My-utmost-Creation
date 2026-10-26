# Research Proposal: Mitigating Cognitive Resumption Lag via Native Multimodal Proactive Agency

## 1. Title
**A Comparative Study of Native Speech-to-Speech Proactive Interventions vs. Conventional Notifications on Task Resumption and Cognitive Workload.**

## 2. Abstract
Modern digital environments frequently interrupt users with notifications that impose a high cognitive "context-switch penalty," leading to significant task-resumption lag. This study proposes to investigate whether proactive, native speech-to-speech (S2S) interactions—which deliver information through a secondary auditory channel—can reduce this lag compared to traditional visual notifications. Using a weighted utility-scoring engine to determine optimal interruption windows, we hypothesize that S2S delivery minimizes cognitive friction and preserves the user's "flow state" more effectively than visual alerts.

## 3. Background and Problem Statement
The "Interruption Paradox" describes the tension between the need for timely information and the cognitive cost of the interruption itself. Current notification systems are primarily reactive or use simple rule-based proactivity, often relying on visual pop-ups that force a complete shift in attentional focus. This results in "resumption lag"—the time and mental effort required to return to a primary task. While voice assistants exist, they are largely reactive. There is a lack of empirical evidence on whether *proactively initiated* native S2S interactions can deliver critical information without the same cognitive cost as visual alerts.

## 4. Research Motivation and Significance
As AI agents move toward greater autonomy, the ability to interrupt humans "intelligently" becomes critical. If a system can determine not only *what* to say but *how* to deliver it based on the user's current cognitive load, it can significantly increase productivity and reduce user frustration. This research is significant because it explores the boundary between "alerting" (interrupting) and "conversing" (integrating) in a professional workflow.

## 5. Research Question
**How does proactive conversational speech-to-speech interaction, compared with conventional notification approaches, affect task-resumption time, perceived cognitive workload, and critical-information retention during ongoing tasks?**

## 6. Aims and Measurable Objectives
1. **Develop a Proactive Scoring Engine:** Implement a weighted utility model to predict optimal interruption windows based on urgency, confidence, and user activity.
2. **Implement a Native S2S Delivery Loop:** Create a low-latency audio-to-audio pipeline for proactive interventions.
3. **Quantify Resumption Lag:** Empirically measure the time difference in returning to a primary task across three different notification modalities.
4. **Assess Cognitive Load:** Use validated instruments (NASA-TLX) to compare the perceived mental effort across modalities.

## 7. Literature Review and Evidence-Supported Gap
Existing research (e.g., Horvitz, 1999) establishes the "Cost of Interruption" and suggests that timing is key. Recent trends in LLMs have introduced native S2S (e.g., Gemini Live), but these are primarily reactive. A gap exists in the **proactive application of native S2S** as a means to reduce the cognitive lapped-penalty of visual notifications. Most current "proactive" agents still rely on cascaded Text-to-Speech (TTS), which lacks the prosodic nuances and low latency of native S2S, potentially contributing to a more jarring user experience.

## 8. Proposed Conceptual Framework
The system operates on a **Sensing $\to$ Scoring $\to$ Delivery** loop:
- **Sensing:** Monitoring environmental triggers (e.g., urgent emails) and user state (e.g., voice activity, typing).
- **Scoring:** A weighted formula $S = U + (w_{conf} \cdot C) + R + \Sigma_{soc} - F$ calculates the "Interrupt-Worthiness."
- **Delivery:** If $S$ exceeds a threshold and temporal gates are clear, the system initiates a native S2S interaction.

## 9. Proposed System Architecture
- **Backend (Python):** A FastAPI/Socket.io server managing a `ProactiveEngine` and an `AudioLoop` connected to a native S2S model (Gemini 2.5 Flash).
- **Frontend (React/Electron):** A desktop shell providing the user interface and capturing system-level activity signals via an MCP (Model Context Protocol) bridge.
- **Sensing Layer:** IMAP for email triggers and a Voice Activity Detection (VAD) system for user-state sensing.

## 10. Proposed Methodology and A/B/C Conditions
We propose a within-subjects experimental design where participants perform a standardized "deep work" task while receiving notifications in three conditions:
- **Condition A (Control):** Immediate Visual Notifications (Standard OS pop-ups).
- **Condition B (Timing Control):** Proactive Visual Notifications (delivered via the scoring engine).
- **Condition C (Experimental):** Proactive Native S2S Interactions.

## 11. Variables and Operational Definitions
- **Independent Variable:** Notification Modality (Visual-Immediate, Visual-Proactive, S2S-Proactive).
- **Dependent Variable 1: Task Resumption Time.** Measured as the interval between notification completion and the first valid task-relevant input (keystroke/click).
- **Dependent Variable 2: Cognitive Workload.** Measured via the NASA-TLX scale post-session.
- **Dependent Variable 3: Information Recall.** Measured by a post-task quiz on the critical content of the notifications.

## 12. Proposed Analysis Strategy
- **Sample Size:** A pilot study with $N=10$ to estimate variance, followed by a power analysis to determine the full sample size.
- **Statistical Test:** Repeated-measures ANOVA to compare the means of resumption lag and workload scores across the three conditions.
- **Post-hoc Analysis:** Tukey's HSD to identify specific significant differences between groups.

## 13. Feasibility and Preliminary Status
A preliminary technical prototype has been developed.
- **Verified:** The weighted scoring engine, the S2S audio loop, and the email monitoring system are implemented and functional.
- **Pending:** The objective latency logging instrumentation and the formal experimental environment.
The project is technically feasible given the current access to native S2S APIs and the existing prototype.

## 14. Ethical Considerations
- **Consent:** All participants will provide written informed consent.
- **Privacy:** Email data used in the study will be synthetic or anonymized. Audio recordings will be processed in real-time and not stored unless explicitly permitted.
- **Well-being:** Participants may withdraw at any time without penalty.

## 15. Limitations and Risks
- **The Novelty Effect:** Users may rate S2S higher simply because it is new. This will be mitigated by a 48-hour acclimation period.
- **Environmental Noise:** Acoustic interference may affect S2S delivery. This will be controlled using noise-canceling headphones.

## 16. Expected Contribution
This research aims to provide the first empirical evidence that **native S2S proactivity** reduces the cognitive cost of interruption compared to visual alerts, contributing a new modality-based approach to the field of Human-Computer Interaction.

## 17. Proposed Timeline
1. **Approval Gate:** Submission and review of this proposal.
2. **Instrumentation:** Implementation of objective latency logging.
3. **Pilot Study:** $N=10$ feasibility test.
4. **Main Study:** Full data collection and analysis.
5. **Final Thesis:** Documentation of findings and submission.

## 18. References
*(Consistent with `references.bib`)*
