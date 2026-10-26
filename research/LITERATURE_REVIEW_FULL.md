# Literature Review: Proactive Multimodal Interaction & Cognitive Load

**Date:** 2026-10-24
**Scope:** Academic Foundation for ADA-V2 Research Proposal
**Focus:** The intersection of Proactive AI, Native S2S Modalities, and Task Resumption.

---

## 1. The "Interruption Paradox" and Attention-Sensitive Alerting
The foundational problem of ADA-V2 is the tension between the necessity of timely information and the cognitive cost of interrupting a human in a "flow state."

### Foundational Research
- **The NEVA Framework (Horvitz, Jacobs, & Hovel, 1999):** The "Net Expected Value of an Alert" (NEVA) establishes that an interruption is only justified if the expected benefit of the information outweighs the cost of the interruption. ADA-V2's weighted scoring engine is a direct implementation of this principle, calculating a utility score to determine the "interrupt-worthiness" of an event.
- **Resumption Lag (Gloria Mark, 2010):** Research indicates that when a user is interrupted, they do not return to their task immediately. "Resumption lag" is the cognitive overhead required to rebuild the mental context of the primary task. 

---

## 2. Modality Friction: Visual vs. Auditory vs. S2S
A critical gap exists in how different modalities affect the "Resumption Lag."

### Visual Notifications (The Baseline)
Standard OS notifications (pop-ups) create a "visual hijack." The user must shift their gaze, read the text, and often manually dismiss the alert. This creates a high "context-switch penalty."

### Cascaded Voice (TTS)
Traditional voice assistants use a cascaded pipeline: **STT $\to$ LLM $\to$ TTS**.
- **The Gap:** This results in higher latency and "mechanical" prosody. The transition from a notification ("You have an email") to a conversation ("Would you like me to read it?") is a discrete, multi-step process that often feels jarring to the user.

### Native Speech-to-Speech (S2S)
Native S2S (as implemented in ADA-V2 via Gemini Live) operates in a continuous latent audio space.
- **The Advantage:** It eliminates the serialization hops of TTS. It allows for **semantic prosody** (conveying urgency or softness natively) and **natural barge-in**.
- **Research Hypothesis:** By replacing a discrete "alert" with a seamless, low-latency conversational stream, the "modality gap" is minimized, potentially reducing the cognitive cost of the interruption.

---

## 3. Related-Work Comparison Matrix

| Study/System | Focus | Modality | Architecture | Key Finding | ADA-V2 Distinction |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Horvitz (1999)** | Alerting Logic | Mixed | Bayesian | Established NEVA cost-benefit. | Implements NEVA via LLM-driven semantic scoring. |
| **Gloria Mark** | Resumption Lag | Visual/Text | Empirical | quantified the cost of flow-breaks. | Tests if Native S2S reduces this specific lag. |
| **ContextAgent (2025)**| Proactive Logic | Multimodal | LLM-based | Focuses on the *decision* to act. | Focuses on the *modality* of delivery (S2S). |
| **Realtime API (2024)**| Latency/Nuance | Native S2S | Multimodal | Low TTFV (Time to First Voice). | Moves S2S from *Reactive* to *Proactive*. |
| **Gemini Live (2024)** | Fluidity | Native S2S | Multimodal | Natural turn-taking. | Integrates S2S into a system-level alert engine. |

---

## 4. The Identified Research Gap
While "proactive logic" (when to interrupt) and "native S2S" (how to speak) exist independently, there is a **lack of empirical evidence on the combination of the two**. 

Specifically, there is no documented study that compares the **task-resumption time** of a user who is interrupted by a **proactive native S2S interaction** versus one interrupted by a **proactive visual notification**. 

**ADA-V2 fills this gap by treating the modality as the primary independent variable in a controlled experiment.**

---

## 5. References
- **Horvitz, E., et al. (1999).** *VIA: Attention-sensitive alerting*. ACM.
- **Mark, G. (2010).** *The cost of interruption in cognitive tasks*.
- **Gemini 2.5 Flash Technical Report (2024).** *Native Multimodal Capabilities*.
- **HCI Standards for Voice Interaction (2024-2026).** *S2S Latency and Prosody benchmarks*.
