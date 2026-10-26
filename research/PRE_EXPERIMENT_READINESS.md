# Pre-Experiment Readiness Report: ADA-V2

**Date:** 2026-10-24
**Auditor:** Senior Research Auditor
**Verdict:** **NOT READY FOR PILOT**

## 1. Verified Implementation Evidence
I have independently traced the execution paths. The following components are present in the code:

| Component | Path | Logic/Reference | Status |
| :--- | :--- | :--- | :--- |
| **Sensing** | `backend/ada.py` | `_check_emails_subconscious` $\to$ `EmailAgent` | **VERIFIED** |
| **Scoring** | `backend/proactive.py` | `compute_breakpoints` $\to$ Additive Sum | **VERIFIED** |
| **S2S Loop** | `backend/ada.py` | `response_modalities=["AUDIO"]` (Gemini Live) | **VERIFIED** |
| **VAD Gate** | `backend/ada.py` | `_chunk_rms(data) >= 400` | **VERIFIED** |
| **Cooldown** | `backend/proactive.py` | `time.time() - last_ts < 600` | **VERIFIED** |
| **Portability** | `electron/main.js` | Hardcoded path at Line 75 | **BROKEN** |

---

## 2. Finalized A/B/C Comparison Table

To isolate the effect of **Modality** from **Timing**, the pilot must use these three conditions:

| Condition | Trigger Timing | Delivery Modality | Causal Comparison |
| :--- | :--- | :--- | :--- |
| **A (Control)** | Immediate | Visual Pop-up | Baseline cost of visual interruption. |
| **B (Timing)** | Proactive (Scored) | Visual Pop-up | Benefit of 'Attention-Aware' timing. |
| **C (Experimental)** | Proactive (Scored) | Native S2S Voice | Benefit of 'S2S' modality over Visual. |

---

## 3. Operational Definitions & Instrumentation

### Primary Outcome: Task Resumption Lag
**Definition:** The time elapsed between the end of a notification and the first productive user action.
- **T1 (Notification End):** Timestamp when the S2S audio stream ends or the visual pop-up is dismissed.
- **T2 (Resumption):** Timestamp of first `click` or `type` event captured via the MCP bridge.
- **Metric:** $\text{Lag} = T_2 - T_1$ (Measured in milliseconds).

### Secondary Outcomes
- **Cognitive Load:** Measured via **NASA-TLX** post-session.
- **Critical Recall:** Binary (Correct/Incorrect) for a set of "Escalated" events.
- **Interruption Burden:** Total "Speak" actions per hour.

### Instrumentation Design (Planned)
- **Instrumentation Status:** **UNIMPLEMENTED**.
- **Proposed Change:** Add `latency_log.jsonl` to `backend/` to capture $T_1$ and $T_2$ for every event.

---

## 4. Pilot Protocol & Sample Planning

**Procedure:**
1. **Acclimation:** 48-hour washout period to remove the 'Novelty Effect'.
2. **Tasks:** Participants perform a standardized "Deep Work" task (e.g., coding or writing).
3. **Interventions:** 5-10 notifications per condition, randomized and counterbalanced.
4. **Analysis:** Paired t-tests to compare Lag and NASA-TLX scores across A, B, and C.

**Sample Size:**
- **Pilot $N=10$.** This is for **Feasibility and Variance Estimation**, not for final statistical significance. The result will be used to perform a Power Analysis for a full study.

---

## 5. Pre-Study Evidence Threshold (Checklist)

| Requirement | Status | Action Needed |
| :--- | :--- | :--- |
| Reproducible App | ❌ | Fix hardcoded path in `electron/main.js`. |
| Automated Tests Pass | ❌ | Implement synthetic suite for `proactive.py`. |
| Logging Validated | ❌ | Implement $T_1/T_2$ latency logging. |
| Conditions Implemented| ⚠️ | Create mock for "Immediate Visual" group. |
| Ethics/Consent | ❌ | Draft participant consent form. |
| Analysis Plan Ready | ✅ | Defined in `06_EVALUATION_PROTOCOL.md`. |

---

## 6. Blocking Issues (Ranked by Severity)

1. **CRITICAL: Portability.** The app cannot be installed on participant machines.
2. **HIGH: Instrumentation.** No objective way to measure "Resumption Lag" currently exists in the code.
3. **HIGH: Ethics.** No informed consent protocol is in place.
4. **MEDIUM: Baseline.** "Immediate Visual" notifications are not yet implemented in the backend.

**FINAL VERDICT: NOT READY FOR PILOT**
