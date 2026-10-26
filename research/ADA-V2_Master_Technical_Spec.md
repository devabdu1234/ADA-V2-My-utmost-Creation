# 🏆 ADA-V2: Unified Technical Master Specification
## Context-Aware Proactive Agency (CAPA) Framework

This document serves as the definitive technical and academic specification for ADA-V2. It merges the three atomic research pillars—**Agency, Modality, and Cognition**—into a singular, engineered system.

---

## 🧩 1. The Unified Architecture (The Master Flow)

ADA-V2 is a closed-loop cognitive system designed to maximize human cognitive bandwidth by treating attention as a constrained resource.

**System Pipeline:**
`[System Event]` $\rightarrow$ `[ED-MCP Push]` $\rightarrow$ `[LLM Wake-up]` $\rightarrow$ `[Cognitive Scoring]` $\rightarrow$ `[Symbiotic Audio Delivery]`

### Component Integration Map
| Phase | Component | Responsibility | Technical Implementation |
| :--- | :--- | :--- | :--- |
| **Trigger** | **Agency** | Detects $\Delta$ (Deviation) | **Event-Driven MCP (ED-MCP)** via SSE streams $\rightarrow$ Host Re-entry Prompt. |
| **Filter** | **Cognition** | Calculates $S$ (Score) | Formula: $S = U + (w_{conf} \cdot C) + R + \Sigma_{soc} - F$ using empirical Focus Penalties. |
| **Deliver** | **Modality** | Executes "Speak" | **Full-Duplex WebRTC** loop with **Prosodic Reasoning** and **PACE** context alignment. |

---

## 🧠 2. The Cognitive Component: The "Filter"
The Focus Penalty ($F$) is grounded in the research of Sophie Leroy (Attention Residue) and Sweller (Cognitive Load Theory).

### The Empirical Focus Penalty ($F$) Logic
$F$ is a dynamic variable based on **Task Complexity ($X$)**:

| Task Complexity ($X$) | Description | Base Penalty ($F_{base}$) | Recovery Time | ADA-V2 Impact |
| :--- | :--- | :--- | :--- | :--- |
| **Low** | Routine/Automated | $\approx 2\text{--}5$s | $\approx 15\text{--}30$s | Low barrier; interruptions common. |
| **Medium** | Analytical/Linear | $\approx 10\text{--}30$s | $2\text{--}10$ min | Moderate barrier; requires high $U$. |
| **High** | Creative/Deep Work | $\approx 1\text{--}5$ min | $30\text{--}45$ min | Extreme barrier; blocks all but critical. |

**Mathematical Floor for $F$:**
$$F = F_{base}(X) + \int_{t_0}^{t_{recovery}} \text{Decay}(t, X, D) \, dt$$
*   **Constraint:** If the system detects "Deep Work" (High $X$), the $F$ value is scaled by a **Complexity Multiplier (1.5x - 3x)** to prevent flow-state collapse.

---

## 🔊 3. The Modal Component: The "Delivery"
The delivery mechanism transitions from a reactive tool to a symbiotic partner via native multimodal streaming.

### Technical Requirements
1.  **Full-Duplex Architecture:**
    *   **Transport:** WebRTC (UDP-based) for minimum jitter.
    *   **Barge-In:** Server-Side VAD $\rightarrow$ `response.cancel` $\rightarrow$ Client-Side Buffer Flush $\rightarrow$ Conversation Truncation.
2.  **Prosodic Intelligence:**
    *   **Bid for Floor:** Rising pitch on "yeah/okay" $\rightarrow$ AI **Yields**.
    *   **Backchannel:** Falling pitch on "mm-hmm/right" $\rightarrow$ AI **Holds**.
    *   **SID-Model:** Semantic Interruption Detection to distinguish "continuers" from "interrupters."
3.  **Latency Budget:**
    *   **Target:** Median end-to-end latency $< 300\text{ms}$ (Human gold standard $\approx 200\text{ms}$).
    *   **Optimization:** Edge-Processing for VAD and Predictive Endpointing.
4.  **PACE (Playback-Aligned Context Engine):**
    *   **Mechanism:** KV Cache Rewinding to the exact audible playback boundary.
    *   **Pivot Logic:** Model is prompted with: *"You were saying [X], user interrupted with [Y]."*

---

## ⚙️ 4. The Agency Component: The "Trigger"
The Agency Gap is bridged by transforming the Model Context Protocol (MCP) into a bidirectional event-driven control plane.

### The Proactive Control Plane
1.  **Event-Driven MCP (ED-MCP):**
    *   **Architecture:** SSE (Server-Sent Events) stream pushing 'Domain Events' (e.g., `system.health.anomaly`).
    *   **Wake-up Loop:** Event $\rightarrow$ Host $\rightarrow$ LLM Re-entry prompt $\rightarrow$ Scoring Formula evaluation.
2.  **Intent-Aware Logic:**
    *   **Formula:** $\text{Action } A = f(G, S, \Delta)$
    *   **Logic:** If the deviation ($\Delta$) between current state ($S$) and Goal ($G$) exceeds the intervention threshold, the agent initiates a proactive wake-up.
3.  **Governed Agency (SafeMCP):**
    *   **Look-Ahead Reasoning:** Predicting if granting a tool in state $S$ leads to hazardous state $S_{t+1}$.
    *   **Validator-Reprompter:** High-impact actions are validated by a separate, constrained 'Critic' model.

---

## 🎯 5. Research Contribution Summary

ADA-V2 introduces three primary novelties to the field of AI Agency:
1.  **Quantized Attention Management:** The first agent to use empirical "Attention Residue" coefficients to gate proactive interruptions.
2.  **Prosodic-Aware Interaction:** The first agent to use pitch contour and semantic endpointing to manage the "Floor" in full-duplex audio.
3.  **State-Aligned Agency:** The first agent to implement a Playback-Aligned Context Engine (PACE) to ensure zero context drift during proactive interruptions.
