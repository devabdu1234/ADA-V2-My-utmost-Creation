# A.P.A. / ADA-V2: check of the 12 literature-review papers

Checked on 2026-11-05 against: the arXiv abstract pages (all 10 arXiv IDs opened), the Crossref API (all 5 ACM DOIs opened), the Semantic Scholar batch API (all 12 found), the ACL Anthology page (UFO), the NeurIPS proceedings page (Toolformer), and a web search (OSWorld proceedings DOI). DBLP refused automated access, so it was not used. I could not open the ACM Digital Library pages directly, so ACM article numbers are **not verified**.

Notes compared: `Research 2.0/Papers_Explained.md` and `Research 2.0/Research_2.0_Reference_Table.xlsx`.

## Summary table

| # | Paper | Exists? | Venue as the student states it | Real status | Numbers | Problems found |
|---|---|---|---|---|---|---|
| 1 | Moshi | Yes | arXiv preprint 2024 | **Preprint only** (no peer-reviewed version found) | 160/200 ms CORRECT | Author order wrong (Jégou comes before Grave); diacritics missing |
| 2 | GPTVoiceTasker | Yes | UIST 2024 | **Peer-reviewed**, UIST '24, doi 10.1145/3654777.3676356 | 34.85% CORRECT | Author order follows arXiv; the ACM version has **Chen, J. before Li, Z.**; cite the ACM DOI, not arXiv |
| 3 | ReAct | Yes | ICLR 2023 | **Peer-reviewed**, ICLR 2023 (arXiv v3 = "ICLR camera ready") | No number quoted; abstract gives +34% / +10% absolute success (ALFWorld / WebShop) | None |
| 4 | Toolformer | Yes | NeurIPS 36 (2023) | **Peer-reviewed**, NeurIPS 2023 Main Track | No number quoted | OK. Hambro is in the NeurIPS author list but not on arXiv, so the student's NeurIPS list is right. Pages 68539–68551 not verified |
| 5 | UFO | Yes | arXiv preprint 2024 | **Now peer-reviewed: NAACL 2025 (Long Papers), pp. 597–622, doi 10.18653/v1/2025.naacl-long.26** | 9 apps CORRECT; **50 tasks NOT IN ABSTRACT** (from the paper body, "WindowsBench") | **Citation out of date**: cite NAACL 2025 |
| 6 | OSWorld | Yes | NeurIPS 2024 D&B | **Peer-reviewed**, NeurIPS 2024 Datasets & Benchmarks (proceedings DOI 10.52202/079017-1650, from web search) | 369 / 12.24% / 72.36% all CORRECT | Papers_Explained.md says only "NeurIPS 2024"; add "Datasets & Benchmarks Track" |
| 7 | Meurisch et al. | Yes | Proc. ACM IMWUT 4(4), Art. 146 | **Peer-reviewed**, IMWUT 4(4), pp. 1–22, Dec 2020 | 272 participants CORRECT; 3,168 responses CORRECT | Article number 146 not confirmed (Crossref gives pages only) |
| 8 | MemGPT | Yes | arXiv preprint 2023 | **Preprint only** (v2, Feb 2024) | No numbers quoted | None (labelled correctly as a preprint) |
| 9 | Greshake et al. | Yes | AISec '23, pp. 79–90 | **Peer-reviewed**, 16th ACM AISec Workshop (with CCS), pp. 79–90 | No numbers quoted | None. Note: it is a *workshop* paper |
| 10 | Lau et al. | Yes | PACM HCI 2(CSCW), Art. 102 | **Peer-reviewed**, PACM HCI 2(CSCW), pp. 1–31, Nov 2018 | 17 + 17 CORRECT | Papers_Explained.md says both groups did diaries; **only the 17 users did diary + interview, the 17 non-users were interviewed only**. Article 102 not confirmed |
| 11 | Generative Agents | Yes | UIST '23 | **Peer-reviewed**, UIST '23, pp. 1–22, doi 10.1145/3586183.3606763 | 25 agents CORRECT | Papers_Explained.md says "memory, reflection and planning"; the abstract's ablation says **observation, planning and reflection** |
| 12 | Personal LLM Agents (Li et al.) | Yes | arXiv preprint 2024 | **Preprint only** (v2, May 2024); 25 authors | No numbers quoted | None (labelled correctly as a preprint) |

**Other document errors:** Papers_Explained.md says "All 10 papers below come from the same Reference Table", but it covers **12** papers, and #12 is marked as *not* from the original table. Its summary table also lists only 10 rows.

**Peer-review balance for examiners:** 9 of 12 are peer-reviewed (UFO now counts). 3 are preprints only: Moshi, MemGPT and Personal LLM Agents. All three are widely cited, but they should stay labelled `[Preprint]`. If a published version appears later, update the citation.

---

## 1. Moshi
- **Citation (APA 7):** Défossez, A., Mazaré, L., Orsini, M., Royer, A., Pérez, P., Jégou, H., Grave, E., & Zeghidour, N. (2024). *Moshi: A speech-text foundation model for real-time dialogue* [Preprint]. arXiv. https://doi.org/10.48550/arXiv.2410.00037
- **Verified link:** https://arxiv.org/abs/2410.00037 (v1 17 Sep 2024, v2 2 Oct 2024)
- **Peer-reviewed?** No. arXiv only; Semantic Scholar lists the venue as arXiv.
- **Number checks:** "~160 ms theoretical / ~200 ms practical": **CORRECT** ("theoretical latency of 160ms, 200ms in practice"). Papers_Explained.md's "about 200 milliseconds": CORRECT.
- **Citation error:** the xlsx has "…Perez, P., Grave, E., Jegou, H.…". The arXiv order is **Pérez, Jégou, Grave**, and the accents are missing.
- **Pipeline:** user audio stream and model audio stream are modelled *in parallel* (full-duplex) → a speech-to-speech generative model; "Inner Monologue" predicts time-aligned text tokens before the audio tokens → streaming speech output. This removes the ASR → LLM → TTS cascade. The abstract argues the cascade adds latency, loses paralinguistic information (emotion) and cannot handle overlapping speech.
- **Stage:** Voice I/O (and answer generation in speech).
- **Limitation / gap for A.P.A.:** It is evaluated on model-level metrics (latency, speech quality) and is a dialogue model with no tool use or desktop action. A.P.A. pairs native-audio dialogue with tools and computer control. *(Inferred from the abstract's scope; read the full text before naming the paper's own limitations section.)*

## 2. GPTVoiceTasker
- **Citation (APA 7):** Vu, M. D., Wang, H., Chen, J., Li, Z., Zhao, S., Xing, Z., & Chen, C. (2024). GPTVoiceTasker: Advancing multi-step mobile task efficiency through dynamic interface exploration and learning. In *Proceedings of the 37th Annual ACM Symposium on User Interface Software and Technology (UIST '24)* (pp. 1–17). ACM. https://doi.org/10.1145/3654777.3676356
- **Verified link:** https://arxiv.org/abs/2401.14268 (comment: "accepted by UIST 2024"); Crossref confirms the ACM DOI.
- **Peer-reviewed?** Yes, UIST 2024.
- **Number checks:** 34.85% task-efficiency gain: **CORRECT**. "About 35% more efficiently": CORRECT (rounded).
- **Citation error:** the student uses the arXiv author order (Li, Z. before Chen, J.). The published ACM record orders them **Chen, J., Li, Z.**
- **Pipeline:** voice command → speech to text → an LLM interprets the command against the current Android UI (accessibility tree) → it performs device interactions (taps, navigation) step by step and learns from the user's past commands to automate repeat tasks.
- **Stage:** Understanding/reasoning plus tool use/action (voice-driven GUI control).
- **Limitation / gap for A.P.A.:** Android/mobile only, and it uses a cascaded speech pipeline. A.P.A. targets the Windows desktop with native speech-to-speech audio. *(Inferred; not stated in the abstract.)*

## 3. ReAct
- **Citation (APA 7):** Yao, S., Zhao, J., Yu, D., Du, N., Shafran, I., Narasimhan, K., & Cao, Y. (2023). ReAct: Synergizing reasoning and acting in language models. In *International Conference on Learning Representations (ICLR 2023)*. https://arxiv.org/abs/2210.03629
- **Verified link:** https://arxiv.org/abs/2210.03629 (v3 comment: "ICLR camera ready version")
- **Peer-reviewed?** Yes, ICLR 2023.
- **Number checks:** the student quotes no number. The abstract gives +34% (ALFWorld) and +10% (WebShop) absolute success rate over imitation-learning and reinforcement-learning baselines. These are usable.
- **Pipeline:** task → the LLM writes a reasoning trace ("thought") → issues an action (e.g. a Wikipedia API call or an environment action) → receives an observation → thinks again, in a loop until done. It is evaluated on HotpotQA, FEVER, ALFWorld and WebShop.
- **Stage:** Understanding/reasoning plus tool use/action (the agent control loop).
- **Limitation / gap for A.P.A.:** Tested on text QA and simulated environments, not on real GUIs, voice or side-effecting actions. A.P.A. runs the same loop over real screenshots with an emergency stop. *(Inferred.)*

## 4. Toolformer
- **Citation (APA 7):** Schick, T., Dwivedi-Yu, J., Dessì, R., Raileanu, R., Lomeli, M., Hambro, E., Zettlemoyer, L., Cancedda, N., & Scialom, T. (2023). Toolformer: Language models can teach themselves to use tools. In *Advances in Neural Information Processing Systems 36 (NeurIPS 2023)*. https://arxiv.org/abs/2302.04761
- **Verified link:** https://arxiv.org/abs/2302.04761; NeurIPS proceedings page (Main Conference Track, DOI 10.52202/075280-2997).
- **Peer-reviewed?** Yes, NeurIPS 2023.
- **Number checks:** no number is quoted. Pages 68539–68551 are **not verified**.
- **Pipeline:** a few demonstrations per API → the LM samples candidate API calls in a text corpus → it keeps calls that lower the loss on future tokens (self-supervised filtering) → the LM is fine-tuned on the augmented corpus → at inference it decides when to call a tool (calculator, QA, two search engines, translator, calendar) and inserts the result.
- **Stage:** Tool use (when and how to call a function).
- **Limitation / gap for A.P.A.:** The tools are read-only and side-effect-free. A.P.A.'s tools send emails and click, so it needs confirmation and safety gates. It also does not use tools interactively in chains. *(Inferred; the student's note already states the side-effect point.)*

## 5. UFO
- **Citation (APA 7), updated:** Zhang, C., Li, L., He, S., Zhang, X., Qiao, B., Qin, S., Ma, M., Kang, Y., Lin, Q., Rajmohan, S., Zhang, D., & Zhang, Q. (2025). UFO: A UI-focused agent for Windows OS interaction. In *Proceedings of the 2025 Conference of the Nations of the Americas Chapter of the Association for Computational Linguistics: Human Language Technologies (Volume 1: Long Papers)* (pp. 597–622). Association for Computational Linguistics. https://doi.org/10.18653/v1/2025.naacl-long.26
- **Verified links:** https://arxiv.org/abs/2402.07939 (v1 Feb 2024 … v5 May 2024); https://aclanthology.org/2025.naacl-long.26/
- **Peer-reviewed?** **Yes, NAACL 2025.** The student lists it as an arXiv preprint (2024), which is out of date.
- **Number checks:** "9 Windows applications": **CORRECT** (in the abstract). "50 tasks": **NOT IN ABSTRACT, but correct per the paper body (arXiv v5)**: WindowsBench has 50 requests over 9 apps (Outlook, Photos, PowerPoint, Word, Adobe Acrobat, File Explorer, VS Code, WeChat, Edge), 5 per app plus 5 cross-app. Reported results: UFO 86% success, against GPT-4 (human surrogate) at 42% and GPT-3.5 at 24%.
- **Pipeline:** user request → HostAgent (GPT-Vision) picks the application from desktop screenshots → AppAgent reads the screenshot plus the control list from pywinauto / Windows UI Automation → selects a control and an action → the control-interaction module executes it → loops until done, including across apps.
- **Stage:** Tool use/action (Windows GUI control) plus reasoning.
- **Limitation (stated by the authors):** it works only with controls exposed via pywinauto / UI Automation ("Applications and controls that deviate from this standard … are not currently supported"). Adobe Acrobat was weakest (60%) because of unsupported controls, and cross-app tasks need more steps. There is no voice input, no emergency stop, and no human-in-the-loop confirmation, which are A.P.A.'s additions.

## 6. OSWorld
- **Citation (APA 7):** Xie, T., Zhang, D., Chen, J., Li, X., Zhao, S., Cao, R., Hua, T. J., Cheng, Z., Shin, D., Lei, F., Liu, Y., Xu, Y., Zhou, S., Savarese, S., Xiong, C., Zhong, V., & Yu, T. (2024). OSWorld: Benchmarking multimodal agents for open-ended tasks in real computer environments. In *Advances in Neural Information Processing Systems 37 (NeurIPS 2024), Datasets and Benchmarks Track*. https://arxiv.org/abs/2404.07972
- **Verified link:** https://arxiv.org/abs/2404.07972; proceedings DOI 10.52202/079017-1650 (from a web search; the proceedings page itself was not opened).
- **Peer-reviewed?** Yes, NeurIPS 2024 D&B.
- **Number checks:** 369 tasks **CORRECT**; best model 12.24% **CORRECT**; humans 72.36% **CORRECT**; failure causes "GUI grounding and operational knowledge" **CORRECT**.
- **Pipeline:** task setup in a real VM (Ubuntu, Windows or macOS) → the agent observes a screenshot and/or the accessibility tree → it emits mouse/keyboard actions → an execution-based evaluation script checks the final machine state.
- **Stage:** Tool use/action (evaluation of computer-control agents).
- **Limitation / gap for A.P.A.:** It is a benchmark, not a usable assistant. It shows that current agents fail most tasks, which justifies A.P.A.'s human-in-the-loop design. A.P.A. could report a success rate on an OSWorld-style subset (A.P.A. has no measured rate yet).

## 7. Meurisch et al. (2020)
- **Citation (APA 7):** Meurisch, C., Mihale-Wilson, C. A., Hawlitschek, A., Giger, F., Müller, F., Hinz, O., & Mühlhäuser, M. (2020). Exploring user expectations of proactive AI systems. *Proceedings of the ACM on Interactive, Mobile, Wearable and Ubiquitous Technologies, 4*(4), 1–22. https://doi.org/10.1145/3432193 *(the student's "Article 146" could not be confirmed; Crossref gives pages 1–22)*
- **Verified link:** https://api.crossref.org/works/10.1145/3432193 (the ACM page is behind a bot check)
- **Peer-reviewed?** Yes, IMWUT (journal).
- **Number checks:** 272 participants **CORRECT**; 3,168 in-situ responses **CORRECT**.
- **Pipeline (study method):** in-the-wild study with automated phone tracking → context-triggered experience-sampling surveys → participants rate the proactivity level they expect, from none to autonomous, per use case → analysis of how expectations vary with human factors and context.
- **Stage:** Proactivity (when and how much to interrupt).
- **Limitation / gap for A.P.A.:** It measures *stated expectations* for hypothetical assistants and builds no real proactive system. A.P.A. can test real, user-tunable proactivity (threshold, cooldown, daily cap) in use. *(Inferred.)*

## 8. MemGPT
- **Citation (APA 7):** Packer, C., Wooders, S., Lin, K., Fang, V., Patil, S. G., Stoica, I., & Gonzalez, J. E. (2023). *MemGPT: Towards LLMs as operating systems* [Preprint]. arXiv. https://doi.org/10.48550/arXiv.2310.08560
- **Verified link:** https://arxiv.org/abs/2310.08560 (v2, 12 Feb 2024)
- **Peer-reviewed?** No. Preprint only; Semantic Scholar lists the venue as arXiv.
- **Number checks:** no number is quoted. The two evaluation domains (document analysis, multi-session chat) are **CORRECT**.
- **Pipeline:** the LLM's context window is treated like RAM: a main context plus external storage (recall and archival). The LLM itself issues function calls to page memory in and out, and interrupts manage control flow between the system and the user.
- **Stage:** Memory.
- **Limitation / gap for A.P.A.:** The abstract states no explicit limitations. Obvious gaps are no privacy model for the stored personal memory and the reliance on the LLM making correct memory calls. A.P.A. proposes memory with a privacy boundary. *(Inferred.)*

## 9. Greshake et al. (2023)
- **Citation (APA 7):** Greshake, K., Abdelnabi, S., Mishra, S., Endres, C., Holz, T., & Fritz, M. (2023). Not what you've signed up for: Compromising real-world LLM-integrated applications with indirect prompt injection. In *Proceedings of the 16th ACM Workshop on Artificial Intelligence and Security (AISec '23)* (pp. 79–90). ACM. https://doi.org/10.1145/3605764.3623985
- **Verified links:** https://arxiv.org/abs/2302.12173; Crossref confirms the DOI, the authors and pp. 79–90.
- **Peer-reviewed?** Yes, an ACM workshop (AISec, held with CCS).
- **Number checks:** none quoted. The systems (Bing GPT-4 Chat, code-completion engines, synthetic GPT-4 apps) and the impacts (data theft, worming, information-ecosystem contamination, controlled API calls) are **CORRECT**.
- **Pipeline (attack model):** the attacker plants instructions in content (web page, email, document) → the LLM app retrieves that content → the model treats it as instructions → it takes attacker-chosen actions or API calls or leaks data. The paper gives a taxonomy of these threats.
- **Stage:** Safety/security.
- **Limitation (stated):** the authors report that effective mitigations were lacking. A.P.A. applies "screen and email text are data, not instructions" plus confirmation for sensitive actions. These are partial mitigations, not proven defences.

## 10. Lau et al. (2018)
- **Citation (APA 7):** Lau, J., Zimmerman, B., & Schaub, F. (2018). Alexa, are you listening? Privacy perceptions, concerns and privacy-seeking behaviors with smart speakers. *Proceedings of the ACM on Human-Computer Interaction, 2*(CSCW), 1–31. https://doi.org/10.1145/3274371 *(the student's "Article 102" could not be confirmed)*
- **Verified link:** https://api.crossref.org/works/10.1145/3274371
- **Peer-reviewed?** Yes, PACM HCI (the CSCW issue).
- **Number checks:** 17 users + 17 non-users **CORRECT**. Papers_Explained.md has a **method wording error**: the diary study was done with the 17 *users* only, and the 17 non-users were interviewed only.
- **Pipeline (study method):** diary study plus semi-structured interviews (users) and interviews (non-users) → qualitative analysis of perceptions, concerns and use of privacy controls.
- **Stage:** Privacy.
- **Limitation / gap for A.P.A.:** small qualitative US sample from 2018, about smart speakers rather than screen- and inbox-reading assistants. Its key finding (privacy controls rarely used, poorly matched to needs) supports privacy-by-design in A.P.A.

## 11. Generative Agents
- **Citation (APA 7):** Park, J. S., O'Brien, J. C., Cai, C. J., Morris, M. R., Liang, P., & Bernstein, M. S. (2023). Generative agents: Interactive simulacra of human behavior. In *Proceedings of the 36th Annual ACM Symposium on User Interface Software and Technology (UIST '23)* (pp. 1–22). ACM. https://doi.org/10.1145/3586183.3606763
- **Verified links:** https://arxiv.org/abs/2304.03442; Crossref confirms the UIST '23 DOI.
- **Peer-reviewed?** Yes, UIST 2023.
- **Number checks:** 25 agents **CORRECT**. The ablation's components are *observation, planning and reflection*; Papers_Explained.md says "memory, reflection and planning", which is a slight mismatch.
- **Pipeline:** perceptions → memory stream (natural-language records) → retrieval scored by recency, importance and relevance → periodic reflection that synthesises higher-level insights → planning → action in a Sims-like sandbox.
- **Stage:** Memory plus reasoning (self-monitoring and reflection).
- **Limitation / gap for A.P.A.:** it is a simulation judged on believability, not usefulness to a real user, and the memory is unbounded with no privacy controls. A.P.A. would apply memory and reflection for a real user under privacy limits. *(Inferred.)*

## 12. Personal LLM Agents survey
- **Citation (APA 7):** Li, Y., Wen, H., Wang, W., Li, X., Yuan, Y., Liu, G., Liu, J., Xu, W., Wang, X., Sun, Y., Kong, R., Wang, Y., Geng, H., Luan, J., Jin, X., Ye, Z., Xiong, G., Zhang, F., Li, X., Xu, M., Li, Z., Li, P., Liu, Y., Zhang, Y.-Q., & Liu, Y. (2024). *Personal LLM agents: Insights and survey about the capability, efficiency and security* [Preprint]. arXiv. https://doi.org/10.48550/arXiv.2401.05459 *(25 authors are listed above for reference. APA 7 rule for 21+ authors: list the first 19, then "…", then the final author (Liu, Y.). The student's "et al." in a reference-list entry is not APA 7.)*
- **Verified link:** https://arxiv.org/abs/2401.05459 (v2, 8 May 2024)
- **Peer-reviewed?** No. Preprint only.
- **Number checks:** none quoted. The content summary (limited existing assistants, a "major software paradigm", challenges of capability, efficiency and security, domain-expert opinions) is **CORRECT**.
- **Pipeline (as a survey):** it defines a generic Personal LLM Agent architecture (personal data and devices + LLM + task execution, context sensing and memory) and intelligence levels, then surveys techniques for capability, efficiency and security.
- **Stage:** All stages (framing paper for "all-in-one personal assistant").
- **Limitation:** it is a survey with no system or evaluation, and its focus leans toward mobile devices. A.P.A. could be one concrete desktop instance evaluated against its framework. *(Inferred.)*
