# Lecturer Approval Brief: Project ADA-V2

## The Problem
Modern productivity is plagued by "Notification Fatigue." Traditional notifications are either too frequent or too intrusive, forcing users into a costly "context-switch" that disrupts flow states and increases cognitive load.

## The Proposed Solution
**ADA-V2 (Autonomous Personal Assistant)**. 
Unlike traditional assistants that are reactive, ADA-V2 is a **Proactive S2S Agent**. It uses a semantic utility engine to monitor external events (like emails) and user state (voice/typing activity) to decide exactly *when* and *how* to interrupt.

## The Core Hypothesis
We hypothesize that delivering urgent information via **Native Speech-to-Speech (S2S)**—a seamless, low-latency audio stream—is less cognitively disruptive than traditional visual pop-ups, thereby reducing the "task-resumption lag" required to return to deep work.

## Proposed Study
A within-subjects A/B/C test comparing:
1. **Standard Visual Pop-ups** (Immediate)
2. **Proactive Visual Pop-ups** (Timing-optimized)
3. **Proactive Native S2S Interactions** (Timing-optimized + Modality-optimized)

**Key Metrics:** Objective Task-Resumption Time (ms) and NASA-TLX Cognitive Workload scores.

## Why it is Feasible
- **Technical Prototype:** A functional prototype already exists, implementing the scoring engine and the native S2S loop via Gemini 2.5 Flash.
- **Controlled Environment:** The study uses a standardized "deep work" task and an MCP bridge for objective millisecond-accurate measurement.
- **Clear Gap:** While proactive "logic" exists, the use of **Native S2S as a specific tool to mitigate cognitive load** is an unexplored research frontier.

## Request for Approval
We are seeking approval to move from the prototype phase to the experimental phase, specifically:
1. Approval of the research question and A/B/C methodology.
2. Guidance on ethics/consent requirements for a small-scale pilot ($N=10$).
3. Feedback on the proposed success metrics.
