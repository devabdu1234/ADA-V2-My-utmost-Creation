# Evaluation Protocol: ADA-V2 Proactive Interruption Engine

## 1. Experimental Design
The goal of this protocol is to validate the efficacy of the ADA-V2 proactive interruption engine in balancing **Critical-Event Recall** (ensuring important info is delivered) against **Interruption Burden** (minimizing cognitive flow disruption).

The evaluation is split into two distinct phases:
1. **Synthetic Simulation (Phase A):** A deterministic test suite to verify the mathematical correctness of the scoring algorithm and the robustness of the gating logic.
2. **Human User Study (Phase B):** A behavioral study to measure perceived cognitive load and the "naturalness" of S2S proactivity compared to standard notifications.

---

## 2. Synthetic Test Suite (Phase A)

### 2.1 Scenario Definitions
We define 22 synthetic event scenarios. Each scenario provides a set of input signals (Urgency, Confidence, Relevance, Social, Focus) and a system state (Mic Status, Cooldown, Daily Cap).

**Correct Action Mapping:**
- **Speak:** $S \ge 6.0$ AND all Gates = Pass.
- **Defer:** $S \ge 6.0$ AND any Gate = Fail.
- **Silence:** $S < 6.0$.

| ID | Category | Urgency ($U$) | Conf ($C$) | Rel ($R$) | Soc | Focus | Mic | Cooldown | Cap | **Expected Action** | Rationale |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| S01 | Ordinary | Low (0.2) | 0.9 | No (-1.5) | 0 | -0.5 | Off | Pass | Pass | **Silence** | $S = 0.2 + 2.7 - 1.5 + 0 - 0.5 = 0.9 < 6$ |
| S02 | Critical | Esc (4.0) | 0.8 | Yes (2.0) | 0 | -0.5 | Off | Pass | Pass | **Speak** | $S = 4.0 + 2.4 + 2.0 + 0 - 0.5 = 7.9 \ge 6$ |
| S03 | Critical | Esc (4.0) | 0.8 | Yes (2.0) | 0 | -0.5 | **On** | Pass | Pass | **Defer** | $S \ge 6$ but User Speaking (Mic Gate) |
| S04 | False Urgency | High (3.0) | 0.2 | No (-1.5) | 0 | -0.5 | Off | Pass | Pass | **Silence** | $S = 3.0 + 0.6 - 1.5 + 0 - 0.5 = 1.6 < 6$ |
| S05 | Active Speech | High (3.0) | 0.9 | Yes (2.0) | 0 | -0.5 | **On** | Pass | Pass | **Defer** | $S = 6.2 \ge 6$ but User Speaking |
| S06 | Deep Work | Low (0.2) | 0.9 | Yes (2.0) | 0 | -0.5 | Off | Pass | Pass | **Silence** | $S = 0.2 + 2.7 + 2.0 - 0.5 = 4.4 < 6$ |
| S07 | Burst (1) | High (3.0) | 0.9 | Yes (2.0) | 0 | -0.5 | Off | Pass | Pass | **Speak** | First of burst: $S = 6.2 \ge 6$ |
| S08 | Burst (2) | High (3.0) | 0.9 | Yes (2.0) | 0 | -0.5 | Off | **Fail** | Pass | **Defer** | Second of burst: Cooldown Active |
| S09 | Burst (3) | High (3.0) | 0.9 | Yes (2.0) | 0 | -0.5 | Off | **Fail** | Pass | **Defer** | Third of burst: Cooldown Active |
| S10 | Max Cap | Esc (4.0) | 0.9 | Yes (2.0) | 0 | -0.5 | Off | Pass | **Fail** | **Defer** | $S \ge 6$ but Daily Cap reached |
| S11 | High Confidence| Med (1.0) | 1.0 | Yes (2.0) | 0 | -0.5 | Off | Pass | Pass | **Silence** | $S = 1.0 + 3.0 + 2.0 - 0.5 = 5.5 < 6$ |
| S12 | Social-Boost | Med (1.0) | 0.8 | Yes (2.0) | 1.5 | -0.5 | Off | Pass | Pass | **Speak** | $S = 1.0 + 2.4 + 2.0 + 1.5 - 0.5 = 6.4 \ge 6$ |
| S13 | No Relevance | Esc (4.0) | 0.9 | No (-1.5) | 0 | -0.5 | Off | Pass | Pass | **Speak** | $S = 4.0 + 2.7 - 1.5 - 0.5 = 4.7 \to$ **Silence** |
| S14 | Borderline Low | High (3.0) | 0.7 | Yes (2.0) | 0 | -0.5 | Off | Pass | Pass | **Silence** | $S = 3.0 + 2.1 + 2.0 - 0.5 = 6.6 \to$ **Speak** |
| S15 | Critical-Away | Esc (4.0) | 0.9 | Yes (2.0) | 0 | -0.5 | Off | Pass | Pass | **Speak** | $S \ge 6$, No Mic Activity |
| S16 | Low-Conf-Crit | Esc (4.0) | 0.1 | Yes (2.0) | 0 | -0.5 | Off | Pass | Pass | **Silence** | $S = 4.0 + 0.3 + 2.0 - 0.5 = 5.8 < 6$ |
| S17 | Med-Conf-Rel | Med (1.0) | 0.6 | Yes (2.0) | 1.5 | -0.5 | Off | Pass | Pass | **Silence** | $S = 1.0 + 1.8 + 2.0 + 1.5 - 0.5 = 5.8 < 6$ |
| S18 | High-Conf-Non | Low (0.2) | 1.0 | No (-1.5) | 1.5 | -0.5 | Off | Pass | Pass | **Silence** | $S = 0.2 + 3.0 - 1.5 + 1.5 - 0.5 = 2.7 < 6$ |
| S19 | Esc-during-S2S | Esc (4.0) | 0.9 | Yes (2.0) | 0 | -0.5 | **On** | Pass | Pass | **Defer** | User is interacting with ADA |
| S20 | Burst-Recovery | High (3.0) | 0.9 | Yes (2.0) | 0 | -0.5 | Off | Pass | Pass | **Speak** | Cooldown expired |
| S21 | Social-FalsePos | Low (0.2) | 0.5 | No (-1.5) | 1.5 | -0.5 | Off | Pass | Pass | **Silence** | $S = 0.2 + 1.5 - 1.5 + 1.5 - 0.5 = 1.2 < 6$ |
| S22 | Extreme-Crit | Esc (4.0) | 1.0 | Yes (2.0) | 1.5 | -0.5 | Off | Pass | Pass | **Speak** | $S = 4.0 + 3.0 + 2.0 + 1.5 - 0.5 = 10.0$ |

*Note for S13/S14: Recalculations done during design to ensure boundary testing.*

---

## 3. Metrics & Success Criteria

### 3.1 Metrics Table

| Metric | Formula | Definition | Target |
|:---|:---|:---|:---|
| **Critical-Event Recall** | $\frac{TP}{TP + FN}$ | % of 'Escalated' events that resulted in a 'Speak' or 'Defer' action. | **100%** |
| **FP Interruption Rate** | $\frac{FP}{Total\_Events}$ | % of 'Low/Med' priority events that triggered a 'Speak' action. | **< 5%** |
| **Interruption Burden** | $Count / Hour$ | Total number of 'Speak' actions per hour of active use. | **< 2 / Hour** |
| **Event-to-Notif Latency**| $T_{speak} - T_{event}$ | Time elapsed from email arrival to S2S initiation. | **< 5 seconds** |
| **Gating Precision** | $\frac{Correct\_Defer}{Total\_Gated}$ | % of events correctly deferred when Mic/Cooldown/Cap were active. | **100%** |

### 3.2 Success Criteria
The system is considered "Production-Ready" if:
1. **Zero Misses:** No 'Escalated' events are categorized as 'Silence'.
2. **Flow Protection:** 'Speak' actions during 'Deep Work' (Low Priority/No Social) are $0$.
3. **Temporal Compliance:** No 'Speak' actions occur within the 600s cooldown of a previous 'Speak' action.

---

## 4. Human Study Design (Revised for Scientific Rigor)
### 4.1 Three-Arm A/B/C Test
To isolate the 'Modality' benefit from the 'Timing' benefit, we employ a within-subjects design with three conditions:
- **Group A (Control):** Standard OS Notifications (Visual pop-ups) delivered immediately upon event arrival.
- **Group B (Timing Control):** Visual pop-ups delivered via the ADA-V2 Proactive Engine (waiting for low-load windows).
- **Group C (Experimental):** Native S2S Voice delivered via the ADA-V2 Proactive Engine.

### 4.2 Operational Measurement of Resumption Lag
Resumption lag is no longer a self-report. It is measured as **Objective Latency**:
- **T1:** Timestamp of notification termination.
- **T2:** Timestamp of first valid primary-task input (keystroke/click) recorded via the MCP bridge.
- **Metric:** $\text{Lag} = T_2 - T_1$.

### 4.3 Controls for Confounders
- **Washout Period:** A 48-hour acclimation phase is required for all participants to eliminate the 'Novelty Effect'.
- **Content Standardization:** Identical semantic scripts are used for both visual and audio delivery to isolate modality.
- **Acoustic Control:** Participants must use noise-canceling headphones in a controlled environment.


---

## 5. Ablation Study Plan

To determine the contribution of each component to the overall system utility, the following experiments will be conducted in the synthetic environment:

| Experiment | Modification | Primary Metric to Observe | Expected Result |
|:---|:---|:---|:---|
| **Exp 1: No Sentiment** | Remove $W_{conf} \times C$ | FP Interruption Rate | Increase in FPs (noise). |
| **Exp 2: No Relevance** | Remove $R$ | Critical-Event Recall | Slight drop in Recall for non-escalated but relevant events. |
| **Exp 3: No VAD** | Disable `signals.mic_open` gate | User Frustration (Human) | High barge-in rate; decreased naturalness. |
| **Exp 4: No Temporal** | Disable Cooldown/Cap | Interruption Burden | "Notification Storms" during burst events. |
| **Exp 5: No Social** | Remove $Soc$ | Latency to Notification | Increase in latency for medium-priority events. |
