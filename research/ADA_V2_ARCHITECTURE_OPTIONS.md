# ADA-V2: Architecture Options & Technical Analysis

## 1. Current Architecture: Direct-Provider Integration
The current system connects directly to the Google GenAI SDK for Gemini Live.

- **Pros:** Lowest possible latency (direct socket), full access to native S2S modalities, simpler implementation.
- **Cons:** Provider lock-in, no easy fallback if the API fails, limited to one model's capabilities.
- **Status:** Fully implemented and verified in `backend/ada.py`.

## 2. Proposed Architecture: Unified Inference Gateway (FreeLLMAPI)
Integrating **FreeLLMAPI** as a centralized gateway between the ADA-V2 backend and various LLM providers.

### Proposed Flow:
`AudioLoop/ProactiveEngine` $\to$ `FreeLLMAPI Gateway` $\to$ `(Gemini / GPT / Claude / Llama)` $\to$ `AudioLoop`

### Analysis of FreeLLMAPI Integration:
- **Purpose:** To provide a common interface for model routing and fallback.
- **Feasibility:** High. FreeLLMAPI provides a standardized API that can be called via HTTP/WebSockets.
- **Risks:** 
    - **Latency:** Adding a gateway layer may introduce milliseconds of delay, which is critical for S2S "naturalness."
    - **Modality Support:** Not all models in the gateway support the native S2S modalities required for ADA-V2.
- **Required Changes:** The `AudioLoop` would need to be refactored to send requests to the gateway rather than the native SDK.

---

## 3. Component Breakdown & Implementation Status

| Component | Purpose | Dependency | Status | Risk |
| :--- | :--- | :--- | :--- | :--- |
| **S2S Engine** | Low-latency voice | Gemini Live / S2S Model | Implemented | Latency/Stability |
| **Proactive Engine**| Interruption Logic | `proactive.py` | Implemented | False Positives |
| **MCP Bridge** | OS Control | Model Context Protocol | Implemented | Security/Permissions |
| **Email Agent** | Information Ingestion| IMAP/SMTP | Implemented | Auth/API Limits |
| **Inference Gateway**| Model Routing | FreeLLMAPI | **Proposed** | Latency Overhead |
| **User Memory** | Context Retention | Vector DB (e.g. Chroma) | **Proposed** | Privacy/Storage |

## 4. Recommendation
The integration of FreeLLMAPI is recommended as a **long-term architectural goal** for reliability and flexibility. However, for the immediate research pilot, the **Direct-Provider** approach should be maintained to ensure the lowest possible latency for the "Resumption Lag" measurements.
