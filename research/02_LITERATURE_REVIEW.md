# Literature Review: Proactive Interruptibility & Multimodal AI Orchestration
**Date of Research:** 2026-10-24
**Mission Phase:** Phase 2 - Literature Review (ADA-V2)

## 1. Executive Summary
The development of ADA-V2 sits at the intersection of Human-Computer Interaction (HCI), Decision Theory, and Native Multimodal AI. The core challenge is the "Interruption Paradox": providing timely, critical information without degrading the user's cognitive flow. This review synthesizes foundational work on interruptibility costs with state-of-the-art "Semantic VAD" and LLM-based context sensing.

## 2. Research Area Analysis

### 2.1 HCI Interruptibility & Context-Aware Timing
Foundational research by **Eric Horvitz** and **Gloria Mark** establishes that interruption is not a binary state but a cost-benefit trade-off.
- **The Cost of Interruption:** Gloria Mark's work emphasizes "resumption lag"—the cognitive effort required to return to a task.
- **Timing Optimization:** Horvitz's *BusyBody* system demonstrated that predicting the "cost" of an interruption using desktop activity and location significantly improves user acceptance.
- **ADA-V2 Alignment:** ADA-V2 evolves this by replacing static Bayesian networks with LLM-driven semantic reasoning over real-time system state.

### 2.2 Proactive AI & Mixed-Initiative Interaction
Proactive agents shift the initiative from the user to the AI. 
- **Proactivity Spectrum:** Interaction moves from Reactive $\to$ Notification $\to$ Suggestion $\to$ Intervention.
- **Preference Learning:** Systems like *PrefMiner* use rule-mining to suppress irrelevant alerts.
- **ADA-V2 Alignment:** ADA-V2 implements a "Gate-Generate-Critic" pipeline, ensuring proactivity is grounded in high-value utility rather than mere event-triggering.

### 2.3 Multimodal Interaction & Native S2S
The shift from modular pipelines (STT $\to$ LLM $\to$ TTS) to native Speech-to-Speech (S2S) models introduces new challenges in turn-taking.
- **Semantic VAD:** Modern S2S research advocates for "Semantic VAD," where the model predicts control tokens (`<|Start-Speaking|>`) based on linguistic context rather than simple silence thresholds.
- **Interaction-Aware Serving:** Systems like *LiveServe* optimize KV cache management based on VAD signals to reduce barge-in latency.
- **ADA-V2 Alignment:** ADA-V2 leverages native S2S to handle "backchanneling" (e.g., "mm-hmm") without triggering a full turn-switch.

### 2.4 Decision Theory & Cost-Sensitive Classification
Notification triggers are modeled as economic decisions.
- **Net Expected Value of an Alert (NEVA):** $\text{NEVA} = \text{Expected Value of Timely Action} - \text{Expected Cost of Interruption}$.
- **Bounded Deferral:** The theory of finding the optimal time $t^*$ to wait before interrupting, balancing utility decay against the probability of the user becoming "free."
- **ADA-V2 Alignment:** ADA-V2 uses cost-sensitive classification to categorize notifications into "Urgency Classes," applying different deferral logic to each.

## 3. Related-Work Matrix

| Existing Work | Research Problem | User Context | Decision Mechanism | Temporal Adaptation | Delivery Behavior | Evaluation | Limitation | ADA-V2 Comparison | Research Implication |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BusyBody** | Cost of interruption | Desktop/Location | Bayesian Nets | Statistical | Queued Notifications | User Survey | Static Rules | Uses LLM Reasoning | Context $\to$ Semantic State |
| **Gloria Mark (2010)** | Resumption lag | Cognitive Load | Empirical | N/A | Observed | Behavioral | No system impl. | Mitigates lag via timing | Quantifies cost of flow |
| **Rizk et al. (2020)** | Alert fatigue | Event Severity | Rule-based | Schedule-aware | Suppress/Aggregate | User Prefs | Low flexibility | Dynamic utility scoring | Proactivity $\to$ Utility |
| **LLM-Timing (2026)** | Interruptibility scoring | OS/Visuals | Multimodal LLM | Temporal History | 7-point scale | Accuracy | Weak visual cues | Integrates OS + History | History $>$ Momentary cues |
| **LiveServe (2026)** | S2S Latency | Interaction Flow | VAD-aware | KV Cache Mgmt | Real-time Audio | TTFP / Latency | Infrastructure focus | Applies to agent logic | Latency kills proactivity |
| **S2S Survey (2026)** | Duplex Decisions | Turn-taking | Token-level logic | Parallel Tokens | Duplex Audio | Architecture | Theoretical | Implements L2 logic | Semantic $\to$ Acoustic VAD |
| **Bounded Deferral** | Info vs. Interruption | Time-to-Free | Utility Decay | Optimal $t^*$ | Deferred Alert | Mathematical | Simplified model | Real-time state updates | Deferral is a function of $p(t)$ |
| **Attention-Sensitive** | Alerting cost | Attentional State | Net Value (NEVA) | Context Sensing | Selective Routing | Simulation | Model complexity | Direct LLM utility calc | Value-based triggering |
| **PrefMiner** | Pref Learning | Mobile context | Assoc. Rule Mining | Pattern-based | Block/Allow | Precision/Recall | Cold start | Few-shot LLM prefs | Learned patterns $\to$ LLM |
| **Knok (MCP)** | DND Bypass | OS-level Focus | Tool-call based | Manual/API | High-urgency UI | UX Testing | Tool-dependent | Native OS integration | MCP as interrupt interface |
| **focuslens-mcp** | Deep Focus sensing | Typing Rhythms | Rhythm Analysis | Real-time | `should_interrupt()` | Cognitive state | Narrow signal | Multi-modal sensing | Rhythms reveal flow state |
| **ringback (MCP)** | 2-way Voice | Phone/SIP | Barge-in logic | Real-time | Voice Call | Functional | API dependency | Integrated Voice Loop | Audio as primary channel |

## 4. Contradictory Evidence & Gap Assessment

### 4.1 Contradictory Findings
- **Visuals vs. History:** Recent evidence (LLM-Timing 2026) suggests that visual context (screenshots/webcam) is a **poor** predictor of interruptibility compared to temporal history. This challenges the assumption that "looking busy" equals "being uninterruptible."
- **Interruption Productivity:** Gloria Mark's research suggests some users may work *faster* after interruption to compensate, though stress increases. This implies that the "cost" of interruption is not always a loss of time, but a loss of well-being.

### 4.2 Research Gaps
- **The "Sensing-to-Action" Latency:** While *LiveServe* addresses infrastructure latency, there is a gap in how an agent's *reasoning* latency (LLM inference time) impacts the perceived "naturalness" of a proactive interruption.
- **Cross-Modal Hand-off:** Most work focuses on either audio (S2S) or visual (Notifications). There is little research on the optimal hand-off (e.g., a visual nudge followed by an audio "whisper").

## 5. Conclusion
ADA-V2 is well-positioned by incorporating **Semantic VAD**, **Decision-Theoretic Utility**, and **MCP-based OS sensing**. To avoid the pitfalls of previous systems, ADA-V2 must prioritize **temporal history** over momentary visual cues and minimize **reasoning latency** to maintain the illusion of a native, attentive companion.
