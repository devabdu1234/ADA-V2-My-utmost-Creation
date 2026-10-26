# ADA-V2 Literature Review: Context-Aware Proactive Agency (CAPA)

## 1. Literature Review Table

| Paper Title | Authors / Year | Core Methodology / Findings | Relation to ADA-V2 Gap | Mathematical / Decision Model | Reference |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Interruption Cost Evaluation by Cognitive Workload** | MDPI, 2017 | Analyzes COI through performance (resumption lag) and affective lenses. | **Cognitive Gap**: Quantifies the 'cost' of interruption. | Resumption lag metrics | [Link](https://www.mdpi.com/2076-3417/8/10/1780) |
| **Investigating Effectiveness of Mental Workload...** | Iqbal, 2005 | Best interruptions occur at low workload boundaries; 3x faster resumption. | **Cognitive Gap**: Validates the need for 'opportune' timing. | Workload boundaries | [Link](https://www.interruptions.net/literature/Iqbal-CHI05-p1489-iqbal.pdf) |
| **When Intelligence Becomes Agency...** | arXiv, 2026 | Defines 'Symbiotic Agency' where restraint is a first-class behavior. | **Agency Gap**: Frames restraint as a calculated action. | Governed Proactivity | [Link](https://arxiv.org/html/2609.07741v1) |
| **PASK: Intent-Aware Proactive Agents** | arXiv, 2026 | Transition from reactive to intent-aware using long-term memory. | **Agency Gap**: Supports the move to intent-aware agency. | Latent need inference | [Link](https://arxiv.org/html/2604.08000) |
| **From Signal to Turn...** | arXiv, 2025 | Identifies 'Expressive Flattening' in modular (STT->LLM->TTS) pipelines. | **Modal Gap**: Proves the need for native audio-to-audio. | Modular friction analysis | [Link](https://arxiv.org/html/2512.11724v2) |
| **Full-Duplex-Bench-v3** | arXiv, 2026 | Benchmarks tool use under real-world disfluency and 'state rollback'. | **Modal Gap**: Validates native audio loops for flow. | Disfluency benchmarks | [Link](https://arxiv.org/html/2604.04847) |
| **Timecourse of recovery from task interruption** | Altmann & Trafton | Recovery follows a curvilinear pattern; typically ~15s to return to baseline. | **Cognitive Gap**: Provides baseline for $F$ (Focus Penalty). | $RT(p) = \exp(F - A(p))$ | [Link](https://doi.org/10.3758/bf03193094) |
| **SafeMCP: Proactive Power Regulation** | ACL, 2026 | Uses environment-grounded look-ahead reasoning for agent defense. | **Agency Gap**: Provides safety layer for proactive MCP use. | Look-ahead reasoning | [Link](https://aclanthology.org/2026.acl-long.522/) |
| **Foundations of Proactive Agents** | arXiv, 2026 | Proposes the "3T" Framework: Task Capability, Temporal Allocation, Trust. | **Agency Gap**: Framework for deciding *when* to act. | 3T Framework | [Link](https://arxiv.org/html/2609.37267) |
| **AITentive: RL-based Attention Mgmt** | ACM, 2024 | Uses Deep RL (DDPG) to optimize notification timing. | **Cognitive Gap**: Contrast to ADA-V2's deterministic approach. | DDPG Reinforcement Learning | [Link](https://doi.org/10.1145/3672539.3686314) |

## 2. Synthesis of Research Gaps

### The Cognitive Gap (Interruption Logic)
**SOTA:** Most current systems use "black-box" Deep RL (like AITentive) or physiological sensors (pupil diameter) to detect opportune moments. 
**ADA-V2 Contribution:** We introduce a **deterministic, interpretable scoring formula** ($S = U + (w_{conf} \cdot C) + R + \Sigma_{soc} - F$). By explicitly weighting utility against the quantified cost of interruption (grounded in Altmann & Trafton's recovery curves), ADA-V2 provides a transparent decision-making process that can be tuned by the user.

### The Modal Gap (Interaction Flow)
**SOTA:** Modular pipelines (ASR $\rightarrow$ LLM $\rightarrow$ TTS) suffer from "Expressive Flattening" and "Repair Rigidity," where the system cannot handle mid-sentence corrections effectively.
**ADA-V2 Contribution:** By utilizing **native audio-to-audio loops** (Gemini 2.5 Flash) and the **Model Context Protocol (MCP)**, ADA-V2 enables full-duplex interaction. This allows the agent to handle disfluencies in real-time and perform system-level actions without the latency and rigidity of text-surrogates.

### The Agency Gap (Reactive $\rightarrow$ Proactive)
**SOTA:** The "Activation Problem" persists; agents either wait for a prompt (reactive) or interrupt indiscriminately (intrusive).
**ADA-V2 Contribution:** Frames the AI as a **Context-Aware Proactive Agency (CAPA)**. It treats "restraint" (the decision NOT to interrupt) as a first-class agentic behavior. By combining MCP environmental monitoring with the interruptibility score, the agent transitions from a tool to a symbiotic partner.
