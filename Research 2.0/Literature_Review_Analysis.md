# A.P.A. Literature Review Analysis: Siri, Alexa, the 12 Papers, and Where A.P.A. Fits

**Project:** A.P.A. (Autonomous Personal Assistant, also called ADA-V2), a voice-first all-in-one Windows desktop assistant
**Date:** 5 November 2026
**Status:** Analysis of the 12-paper review plus how Siri and Alexa are built. All sources were checked by an independent judge review.

---

## 1. How this analysis was done

Four research agents worked in parallel, and a fifth "judge" agent checked their work:

| Agent | Task | Result |
|---|---|---|
| Siri researcher | How Siri is built, from wake word to spoken answer, using Apple primary sources only | Judged **reliable** (6 of 6 spot-checks correct) |
| Alexa researcher | How Alexa is built, including Hunches and Alexa+ | Judged **reliable with 3 corrections** (applied below) |
| Paper verifier | Checked that all 12 papers exist, their venues, and every number we quote | Judged **reliable**. All 12 papers are real and every quoted number is correct. Some citations needed fixing |
| Code auditor | What A.P.A. actually does, read from its source code | Accepted after a spot-check |
| **Judge** | Spot-checked 18 sources, searched for competing systems, and ruled on authenticity and novelty | Rulings used throughout this document |

**Evidence rule:** a claim appears here only if a source was opened and confirmed (VERIFIED). Claims supported only by press coverage are marked *(secondary)*. Claims the judge rejected are listed in Section 9 and are not used.

---

## 2. How a voice assistant works: the common pipeline

Siri, Alexa and A.P.A. all solve the same chain of problems. We use this chain to compare them:

1. **Wake / listen**: decide when the user is talking to the assistant
2. **Speech recognition (ASR)**: turn audio into words
3. **Understanding (NLU)**: work out what the user wants (intent) and the details (slots/entities)
4. **Answer generation / dialogue**: decide what to say or do
5. **Action / tools**: actually do the task (an app, a device, a service)
6. **Speech synthesis (TTS)**: turn the answer back into voice
7. **Proactivity**: speak up without being asked
8. **Memory**: remember the user across conversations
9. **Privacy and safety**

Siri and Alexa were built as a **cascade**: each stage is a separate model, and the output of one feeds the next. Paper 1 (Moshi) argues that this cascade adds delay, loses tone of voice, and cannot handle overlapping speech.

---

## 3. How Siri was built

**Origins.** Siri came out of SRI International's CALO project, which was part of DARPA's PAL program: a five-year, $150 million effort with more than 300 researchers (SRI International, 2003). SRI spun out Siri Inc. in 2007. Apple bought it in April 2010 and launched it on the iPhone 4S in October 2011 (SRI International, n.d.; Apple Inc., 2011). The original design, as described in patents, was a chain of a language interpreter, a dialog flow processor, task flows, services orchestration and an output processor, all organised around an "active ontology" (Cheyer & Guzzoni, 2014; Gruber et al., 2019). Patents describe a design and do not prove the production system.

| Stage | How Siri does it | Era | Source |
|---|---|---|---|
| Wake word | "Hey Siri": a small deep neural network (DNN) with two passes. A tiny model runs on the low-power Always-On Processor, and a larger one on the main CPU confirms. The server double-checks and can cancel a false trigger | 2014–2017 → | Siri Team (2017b) |
| Speaker ID | "Personalized Hey Siri": a DNN speaker vector cut the error rate (EER) from 8.0% to 4.3% | 2018 | Siri Team (2018) |
| Far-field audio | HomePod: echo cancellation, DNN noise reduction, dereverberation, source separation | 2018 | Audio Software Engineering & Siri Speech Team (2018) |
| ASR | On Apple's servers: a hybrid CNN-HMM acoustic model, n-gram language models with regional variants, and a WFST decoder. Moved on-device in iOS 15 (2021). Server rescoring is still used for entity-heavy queries (23–35% WER improvement) | ≤2018 → 2021 → 2024 | Siri Speech Recognition Team (2018); Apple Inc. (2021); Zhang et al. (2024) |
| Understanding | Classic: intent → task flow over an active ontology (patent). LLM era: ReALM resolves references to things on screen and in the conversation | 2010 → 2024 | Gruber et al. (2019); Moniz et al. (2024) |
| Answer generation | Apple Foundation Models: a ~3B on-device model plus a server model on Private Cloud Compute, with optional hand-off to ChatGPT (2024). A third generation (2026) powers "an entirely new version of Siri" | 2024 → 2026 | Gunter et al. (2024); Apple Inc. (2024); Apple Machine Learning Research (2026) |
| TTS | Unit selection guided by a deep mixture density network, running on device (iOS 10–11). In 2026, "Expressive Voices" are generated on device by the foundation model | 2017 → 2026 | Siri Team (2017a); Apple Machine Learning Research (2026) |
| Actions | SiriKit (fixed domains, 2016), then App Intents and Shortcuts (2022) | 2016 → | Apple Developer (2016, 2022) *(WWDC pages to be opened before final submission)* |
| Privacy | On-device processing, a 2019 change after the grading controversy (audio no longer kept by default), and Private Cloud Compute | 2019 → | Apple Inc. (2019, 2024) |

**What this shows.** Siri is a **cascade that is slowly merging**. Wake word, speech recognition, understanding, answer generation and voice output began as separate models. Apple's own papers show it moving each stage on-device for privacy, and since 2024 putting an LLM in the middle. Siri's strengths are **privacy and on-device processing**. It does not control a desktop computer's interface. Its actions go through fixed app intents.

---

## 4. How Alexa was built

**Origins.** Amazon bought IVONA (Polish TTS) in 2013 and announced the Echo in November 2014, which became generally available in June 2015 (Amazon, 2013, 2015). From the start, the Echo used a 7-microphone far-field array with beamforming and noise cancellation, and **all assistant processing happened in the cloud** (Amazon, 2015).

| Stage | How Alexa does it | Era | Source |
|---|---|---|---|
| Wake word + front end | Keyword spotting on the device for "Alexa"; 7-mic array, beamforming, echo and noise cancellation | 2014 → | Amazon (2015); Haeb-Umbach et al. (2019) |
| ASR | Cloud neural acoustic models trained on about 1 million hours of speech with teacher–student learning. The AZ1 chip (2020) runs an all-neural speech recognition model on the device | 2019 → 2020 | Parthasarathi & Strom (2019); Amazon (2020) |
| Understanding | Domain → intent → slot pipeline. Developers define intents, slots and sample utterances for each "skill". Routing across about 1,500 skill domains uses a shortlisting + re-ranking model. The Alexa Teacher Model distils multi-billion-parameter encoders into small production models | 2015 → 2022 | Sarikaya (2017); Amazon Developer (n.d.); Kim et al. (2018); FitzGerald et al. (2022) |
| Answer generation | Skill-based responses; open-domain chat explored through the Alexa Prize; AlexaTM 20B (research model, deployment not stated); **Alexa+ (2025)**: LLMs on Amazon Bedrock with a router choosing between Amazon Nova and Anthropic Claude, plus "experts" (groups of APIs) and API orchestration | 2017 → 2025 | Ram et al. (2018); Soltan et al. (2022); Amazon Staff (2025a, 2025b) |
| TTS | IVONA concatenative synthesis → Neural TTS; a universal neural vocoder covering 74 speakers and 17 languages | 2013 → 2019 | Amazon (2013); Lorenzo-Trueba et al. (2019) |
| Actions | Skills, Smart Home APIs, Routines | 2015 → | Amazon Developer (n.d.) |
| **Proactivity** | **Hunches**: in 2018, Alexa *suggests* something after the user speaks (e.g. "good night" → "your door is unlocked") *(secondary)*. In 2020, Alexa infers that the user is away or asleep and **silently** acts on lights and thermostats (opt-in). Alexa+ is "proactive when it's important" (e.g. traffic alerts), but **its trigger method is not published** | 2018 → 2025 | Grossman (2020); Amazon Staff (2025a) |
| Memory | Alexa+ can "remember things" | 2025 | Amazon Staff (2025a) |
| Privacy | The local-processing option ended on 28 March 2025; all voice recordings now go to the cloud | 2025 | TechCrunch (2025) *(secondary, quoting Amazon's email)* |

**What this shows.** Alexa is a **cloud cascade built around skills**: the user must know a skill exists and how to phrase the request. Alexa+ replaces the rigid middle with LLMs. Its web-browsing agent is announced in the future tense, not shipped, and **Alexa does not control a computer** (Amazon Staff, 2025a). Alexa's proactivity is limited to smart-home suggestions after the user speaks, silent device actions, and alerts whose decision method is unpublished.

---

## 5. Siri vs Alexa vs A.P.A., stage by stage

A.P.A. was checked against its own code, not against its design documents.

| Stage | Siri | Alexa | **A.P.A. (from code)** |
|---|---|---|---|
| Wake | "Hey Siri" two-pass DNN, on device | "Alexa" keyword spotting, far-field array | **No wake word.** The mic is always on, with a volume (RMS) gate |
| ASR → understanding → answer → TTS | Separate models in a cascade, merging into foundation models since 2024 | Cloud cascade, LLMs since Alexa+ (2025) | **One native speech-to-speech model** (Gemini 2.5 Flash native audio): audio in, audio out, with no separate ASR or TTS |
| Interrupting the assistant (barge-in) | Supported | Supported (noise-cancelled while music plays) | **Not in practice.** The mic is muted while A.P.A. speaks (half-duplex) |
| Actions | App intents, Shortcuts | Skills, smart home, Routines | **22 tools**: email (read, show, reply, send), weather, maps, God's Eye live data, focus sessions, and **13 Windows computer-control tools** (UI Automation + pyautogui) |
| Safety on actions | Permission before the ChatGPT hand-off | Not published | **Confirmation card** (Allow/Deny) on by default for email and all 8 actuator tools; an **emergency stop** by voice or button that locks all actuators |
| Proactivity | Not documented | Hunches (suggestion after the user speaks, or silent action); Alexa+ alerts (method unpublished) | **Proactive spoken interruption from email**: urgency, relevance, confidence and activity give a score; it speaks only if the score ≥ 6.0 and gates pass (not while the user or A.P.A. is speaking, not during a focus session, user present, high urgency, 10-min cooldown, 5/day cap). Every decision is logged |
| Focus help | None | None | **Focus sessions**: a screenshot is classified every 30 s, and a one-sentence spoken nudge comes after 2–4 minutes of sustained off-task evidence |
| Memory | Personal context from on-device data | "Remember things" (Alexa+) | **None.** Each conversation starts fresh |
| Privacy | Strong: on device + Private Cloud Compute | Weak: cloud only since 2025 | **Weak**: audio, screenshots and email content go to Google's cloud |

**Key takeaway.** Siri and Alexa are far stronger at **voice infrastructure** (wake words, far-field audio, on-device privacy). A.P.A. does not compete there. It **uses** Google's speech-to-speech model. A.P.A. differs in **what it does with the voice**: it operates the Windows desktop with safety controls, it can interrupt by voice when something matters, and it watches for distraction during focus work. Neither Siri nor Alexa does any of these three.

---

## 6. The 12 papers: what each contributes and the gap it leaves

All 12 are real and every number we quote is correct. 9 are peer-reviewed. 3 are preprints (Moshi, MemGPT, Personal LLM Agents) and are labelled as such.

| # | Paper | Pipeline stage | Key finding (verified) | Gap A.P.A. addresses | Status |
|---|---|---|---|---|---|
| 1 | Moshi (Défossez et al., 2024) | Voice I/O | One full-duplex speech-to-speech model; ~160 ms theoretical / ~200 ms practical latency; the cascade loses tone and adds delay | A model only, not an assistant: no tools, no desktop. *A.P.A. uses the same idea via Gemini, but half-duplex* | Preprint |
| 2 | GPTVoiceTasker (Vu et al., 2024) | Voice → action | Voice commands drive multi-step Android tasks; 34.85% efficiency gain in a user study | Phone only, cascaded ASR → LLM, not proactive. *A.P.A.: Windows desktop, native S2S* | UIST '24 |
| 3 | ReAct (Yao et al., 2023) | Reasoning + acting | Interleaving reasoning and actions beats acting or reasoning alone | Text benchmarks, not a live assistant. *A.P.A.'s "look first, then act one step" rule applies this loop* | ICLR 2023 |
| 4 | Toolformer (Schick et al., 2023) | Tool use | LLMs can learn when to call tools | Tools are read-only (calculator, search). *A.P.A.'s tools have real effects, so they need confirmation* | NeurIPS 2023 |
| 5 | UFO (Zhang et al., 2025) | Desktop control | Windows agent using UI Automation + screenshots across 9 apps | Text only, no voice, no proactivity. *A.P.A. uses the same UI Automation approach, voice-first, with an emergency stop* | NAACL 2025 |
| 6 | OSWorld (Xie et al., 2024) | Desktop evaluation | 369 real computer tasks; best AI 12.24% vs humans 72.36% | Shows computer control is unreliable. *Justifies A.P.A.'s human confirmation; also a benchmark A.P.A. should use* | NeurIPS 2024 D&B |
| 7 | Meurisch et al. (2020) | Proactivity | 272 people, 3,168 responses: the right level of proactivity depends on the person and situation | Gives expectations, not a system. *A.P.A.'s threshold, cooldown and daily cap make proactivity adjustable* | IMWUT 2020 |
| 8 | MemGPT (Packer et al., 2023) | Memory | OS-style memory management lets an LLM remember beyond its context window | *A.P.A. has no memory yet; MemGPT is the reference design for adding it* | Preprint |
| 9 | Greshake et al. (2023) | Safety | Hidden instructions in emails and web pages can hijack LLM apps | *A.P.A. reads emails and the screen, so it is exposed. It has prompt-level defences plus confirmation, and is not fully protected* | AISec '23 |
| 10 | Lau et al. (2018) | Privacy | 17 users (diary + interview) and 17 non-users (interview): users rarely use privacy controls | *Privacy must be designed in. A.P.A. currently sends data to the cloud, which is a stated limitation* | CSCW 2018 |
| 11 | Generative Agents (Park et al., 2023) | Memory + reflection | Agents with observation, planning and reflection behave believably; removing any one hurts | *Blueprint for A.P.A.'s future self-monitoring (not "self-awareness")* | UIST '23 |
| 12 | Personal LLM Agents (Li et al., 2024) | Whole assistant | All-in-one personal LLM agents are an established research direction; key challenges are capability, efficiency, security | *Places A.P.A. in a recognised research area* | Preprint |

**Additional sources the judge says we must add** (an examiner would notice they are missing):

| Source | Why it must be added |
|---|---|
| **LookOut**, Horvitz (1999), CHI '99 | Spoke to users about meetings found in their email, timed by expected utility and the user's attention, **27 years ago**. This is the closest prior work to A.P.A.'s proactive interruption |
| **Attention-Sensitive Alerting**, Horvitz, Jacobs & Hovel (1999), UAI '99 | The decision theory behind "is this email worth interrupting for?" |
| **Intent Assistant**, Choi et al. (2026), CHI 2026 | An LLM reads screenshots against the user's goal and nudges them when distracted, with a 3-week field study of 22 people. This is the closest prior work to A.P.A.'s focus sessions |
| **UFO2** (Microsoft, 2025) and **Microsoft Copilot on Windows** (Oct 2025) | The closest integrated competitors: Copilot has voice + screen vision + local-file actions with approval |
| **Olsen (2007)**, UIST '07 | The standard reference for judging systems/integration research (see Section 8) |

---

## 7. Capability matrix: does anything already do what A.P.A. does?

✔ = documented, ◐ = partial, ✘ = absent or not offered, ? = not found in sources checked.

| System | Native S2S voice | Desktop GUI control | Proactive **spoken** interruption with attention/cost gating | Confirmation + emergency stop | Focus monitoring | Memory | On-device privacy |
|---|---|---|---|---|---|---|---|
| Siri / Apple Intelligence | ◐ | ✘ | ? | ◐ | ✘ | ◐ | ✔ |
| Alexa / Alexa+ | ? | ✘ | ◐ (method unpublished) | ? | ✘ | ✔ | ✘ |
| Microsoft Copilot (Windows) | ✔ | ◐ (preview, off by default) | ✘ | ✔ | ◐ | ? | ◐ |
| ChatGPT voice + agent | ✔ | ◐ (its own virtual computer, not yours) *(secondary)* | ✘ | ✔ *(secondary)* | ✘ | ✔ | ✘ |
| Gemini Live / Astra / Mariner | ✔ | ◐ (web only, prototype) | ◐ (prototype) *(secondary)* | ? | ◐ | ◐ | ✘ |
| UFO / UFO2 | ✘ | ✔ | ✘ | ◐ | ✘ | ? | ✘ |
| GPTVoiceTasker | ✘ | ◐ (Android) | ✘ | ? | ✘ | ◐ | ? |
| Intent Assistant (CHI '26) | ✘ | ✘ | ◐ | ✘ | ✔ | ◐ | ? |
| LookOut (CHI '99) | ◐ (cascaded) | ◐ (Outlook only) | ✔ | ✔ | ◐ | ✘ | local |
| **A.P.A.** | ✔ (via Gemini; half-duplex) | ✔ | ✔ (email only) | ✔ | ✔ | ✘ | ✘ |

**Reading the matrix.** Every column in which A.P.A. has a ✔ also has a ✔ or ◐ somewhere else. No single capability is new. What no other row has is **proactive spoken interruption + guarded desktop control + focus monitoring together in one voice loop**.

---

## 8. Novelty: what is new, and what is not

### 8.1 The judge's rulings

| # | Claim | Verdict | Closest prior work |
|---|---|---|---|
| 1 | "All-in-one integration" by itself | **Integration only; not novel as stated** | Microsoft Copilot, Alexa+, Personal LLM Agents survey |
| 2 | Native speech-to-speech voice | **Not novel**: the model is Google's, and A.P.A. is half-duplex | Moshi, Gemini Live, Copilot Voice |
| 3 | Proactive spoken interruption gated by a score + attention gates | **Differentiating (narrow)** | LookOut (1999), Attention-Sensitive Alerting (1999), Alexa Hunches |
| 4 | Voice-driven Windows control with confirmation + emergency stop | **Not novel individually; integration only** | UFO/UFO2, Copilot Actions, ChatGPT agent |
| 5 | Screen-based focus monitoring with spoken nudges | **Not novel** (at most "a spoken variant") | Intent Assistant (CHI 2026) |
| 6 | **Claims 3 + 4 + 5 combined in one voice loop** | **Differentiating as integration; the benefit is not yet proven** | No single system found with all three |

What is new about claim 3 compared with LookOut: an LLM estimates urgency and relevance, the interruption is spoken inside a live speech-to-speech conversation, and the gating rules are explicit, logged and adjustable by the user. Neither Alexa+ nor Google Astra publishes how it decides when to speak.

### 8.2 "We solve, we don't invent": is that legitimate research?

**Yes.** Olsen (2007) argues that user-interface systems research should not be judged by whether each component is new. It should be judged by whether it:
- addresses an important problem for real users and tasks,
- solves something that was not solvable before,
- reduces the effort ("viscosity") of getting a task done,
- **combines existing building blocks so that a new capability emerges** (inductive combination).

A.P.A. fits this last kind of contribution. The research problem it solves is **fragmentation**. Today a user who wants voice conversation, desktop automation, smart interruptions and focus support needs Siri or Alexa, Copilot, a mail client's notifications and a separate focus app. None of these coordinate with each other: an email alert interrupts focus time, and a voice assistant cannot click on the desktop. A.P.A. puts them in **one voice loop that decides when to speak and what it is allowed to do**.

**This framing requires evidence.** Under Olsen's criteria, integration only counts as research when it is shown to solve the problem better than the alternative. A.P.A. currently has a working prototype and a log of 54 proactive decisions (2 spoken, 18 deferred, 34 silent). That log is a design artefact. **No user evaluation has been done yet.**

### 8.3 The strongest defensible claim and research question

> **Claim:** A.P.A. is a working Windows prototype that unifies, in one native speech-to-speech voice loop, cost-gated proactive spoken alerts, confirmation-guarded desktop control with an emergency stop, and screen-based focus nudging. As far as this review found, no single published system or product combines all three.

> **Research question:** Compared with a fragmented set of separate tools, does a single voice-first assistant that coordinates proactive interruptions, guarded desktop actions and focus nudges reduce task time and context switching, without increasing perceived interruption burden or reducing trust?

### 8.4 Claims we must NOT make

1. **"First proactive voice assistant"** or "first to interrupt by voice based on attention": LookOut did it in 1999.
2. **"A.P.A. introduces native speech-to-speech / duplex / barge-in"**: the model is Google's, A.P.A. is half-duplex, and it has no wake word.
3. **"A.P.A. has memory / uses MCP / is private or on-device / is protected against prompt injection"**: none of these is true in the current code.
4. Also avoid: "personalised/learning interruption policy" (the weights are fixed and configurable), "Horvitz decision-theoretic ratio" (the code adds the factors; it doesn't use a ratio), and any user-benefit numbers (none have been measured).

### 8.5 Evidence that would make the claim defensible

1. **Comparison study** (within-subjects, N ≥ 12): A.P.A. vs fragmented tools on the same multi-step tasks. Measure completion time, number of app switches, errors, NASA-TLX workload, SUS usability and trust.
2. **Interruption log with user ratings**: each proactive decision rated useful / annoying / missed, compared against a simple rule baseline (e.g. "interrupt if high priority").
3. **Desktop task success rate** on a small OSWorld/UFO-style Windows task set, with and without confirmation, plus emergency-stop latency.
4. **Cross-source test**: email alerts arriving during a focus session, to show that one coordinated policy behaves better than separate tools.

---

## 9. Corrections to make before submitting

**Citations (the 12 papers)**
1. UFO: cite **NAACL 2025** (pp. 597–622, doi 10.18653/v1/2025.naacl-long.26), not "arXiv 2024".
2. GPTVoiceTasker: author order is **…Chen, J., Li, Z.…**; cite the ACM DOI 10.1145/3654777.3676356.
3. Moshi: author order is **Pérez, Jégou, Grave**, with the accents; label it [Preprint].
4. OSWorld: add "Datasets and Benchmarks Track".
5. Meurisch: drop "Article 146". Lau: drop "Article 102" (neither could be confirmed).
6. Lau et al.: only the 17 *users* did diaries; the 17 non-users were interviewed only.
7. Generative Agents: the components are **observation, planning and reflection**.
8. Papers_Explained.md says "All 10 papers…" but there are 12. Fix the count and the table.
9. Personal LLM Agents: the APA 7 reference needs the first 19 authors, "…", then the last author (not "et al.").
10. Toolformer page numbers and UFO's "50 tasks" are not in the abstract. Omit them, or cite the paper body.

**Siri/Alexa facts**
11. Alexa Teacher Model: the 3.74–4.91% figure is an *automatic* dissatisfaction measure, not a live test.
12. Alexa+: web browsing is *announced*, not shipped; Alexa+ does not control a computer.
13. Kim et al. (2018): say "shortlisting + re-ranking"; do not say "BiLSTM".
14. Hunches: the 2018 version speaks only after the user says something; the 2020 version acts silently. Neither is unprompted speech.

**Our own documents and code**
15. Retire the "MCP" claim in `research/03_NOVELTY_CHALLENGE.md` and `Finalized.md`: A.P.A. uses native Python with Windows UI Automation, not MCP.
16. Papers_Explained #10 says A.P.A. keeps "private data local". This is **false**: data goes to Google's cloud.
17. ~~Code: focus sessions did not suppress proactive email alerts.~~ **Fixed (5 Nov 2026):** a `user_focusing` gate now defers proactive email during a focus session (`backend/proactive.py`, test in `tests/test_proactive.py`).
18. ~~Code: the `proactive.py` docstring described a Horvitz ratio.~~ **Fixed:** the docstring now describes the additive formula and every gate.

**Do not cite as fact** (only press coverage or unconfirmed): Nuance as Siri's ASR vendor; "Siri uses a knowledge graph"; Evi's $26M price; Hunches "deep home embeddings"; Amazon Science blog figures (NTTS, on-device RNN-T) until the pages are opened; the Federighi "V1/V2" quote; Google Astra's "decides when to speak" quotes.

---

## 10. References (APA 7)

### The 12 core papers
Défossez, A., Mazaré, L., Orsini, M., Royer, A., Pérez, P., Jégou, H., Grave, E., & Zeghidour, N. (2024). *Moshi: A speech-text foundation model for real-time dialogue* [Preprint]. arXiv. https://doi.org/10.48550/arXiv.2410.00037

Greshake, K., Abdelnabi, S., Mishra, S., Endres, C., Holz, T., & Fritz, M. (2023). Not what you've signed up for: Compromising real-world LLM-integrated applications with indirect prompt injection. In *Proceedings of the 16th ACM Workshop on Artificial Intelligence and Security (AISec '23)* (pp. 79–90). ACM. https://doi.org/10.1145/3605764.3623985

Lau, J., Zimmerman, B., & Schaub, F. (2018). Alexa, are you listening? Privacy perceptions, concerns and privacy-seeking behaviors with smart speakers. *Proceedings of the ACM on Human-Computer Interaction, 2*(CSCW), 1–31. https://doi.org/10.1145/3274371

Li, Y., Wen, H., Wang, W., Li, X., Yuan, Y., Liu, G., Liu, J., Xu, W., Wang, X., Sun, Y., Kong, R., Wang, Y., Geng, H., Luan, J., Jin, X., Ye, Z., Xiong, G., Zhang, F., Li, X., . . . Liu, Y. (2024). *Personal LLM agents: Insights and survey about the capability, efficiency and security* [Preprint]. arXiv. https://doi.org/10.48550/arXiv.2401.05459

Meurisch, C., Mihale-Wilson, C. A., Hawlitschek, A., Giger, F., Müller, F., Hinz, O., & Mühlhäuser, M. (2020). Exploring user expectations of proactive AI systems. *Proceedings of the ACM on Interactive, Mobile, Wearable and Ubiquitous Technologies, 4*(4), 1–22. https://doi.org/10.1145/3432193

Packer, C., Wooders, S., Lin, K., Fang, V., Patil, S. G., Stoica, I., & Gonzalez, J. E. (2023). *MemGPT: Towards LLMs as operating systems* [Preprint]. arXiv. https://doi.org/10.48550/arXiv.2310.08560

Park, J. S., O'Brien, J. C., Cai, C. J., Morris, M. R., Liang, P., & Bernstein, M. S. (2023). Generative agents: Interactive simulacra of human behavior. In *Proceedings of the 36th Annual ACM Symposium on User Interface Software and Technology (UIST '23)* (pp. 1–22). ACM. https://doi.org/10.1145/3586183.3606763

Schick, T., Dwivedi-Yu, J., Dessì, R., Raileanu, R., Lomeli, M., Hambro, E., Zettlemoyer, L., Cancedda, N., & Scialom, T. (2023). Toolformer: Language models can teach themselves to use tools. In *Advances in Neural Information Processing Systems 36 (NeurIPS 2023)*. https://arxiv.org/abs/2302.04761

Vu, M. D., Wang, H., Chen, J., Li, Z., Zhao, S., Xing, Z., & Chen, C. (2024). GPTVoiceTasker: Advancing multi-step mobile task efficiency through dynamic interface exploration and learning. In *Proceedings of the 37th Annual ACM Symposium on User Interface Software and Technology (UIST '24)* (pp. 1–17). ACM. https://doi.org/10.1145/3654777.3676356

Xie, T., Zhang, D., Chen, J., Li, X., Zhao, S., Cao, R., Hua, T. J., Cheng, Z., Shin, D., Lei, F., Liu, Y., Xu, Y., Zhou, S., Savarese, S., Xiong, C., Zhong, V., & Yu, T. (2024). OSWorld: Benchmarking multimodal agents for open-ended tasks in real computer environments. In *Advances in Neural Information Processing Systems 37 (NeurIPS 2024), Datasets and Benchmarks Track*. https://arxiv.org/abs/2404.07972

Yao, S., Zhao, J., Yu, D., Du, N., Shafran, I., Narasimhan, K., & Cao, Y. (2023). ReAct: Synergizing reasoning and acting in language models. In *International Conference on Learning Representations (ICLR 2023)*. https://arxiv.org/abs/2210.03629

Zhang, C., Li, L., He, S., Zhang, X., Qiao, B., Qin, S., Ma, M., Kang, Y., Lin, Q., Rajmohan, S., Zhang, D., & Zhang, Q. (2025). UFO: A UI-focused agent for Windows OS interaction. In *Proceedings of the 2025 Conference of the Nations of the Americas Chapter of the Association for Computational Linguistics: Human Language Technologies (Volume 1: Long Papers)* (pp. 597–622). Association for Computational Linguistics. https://doi.org/10.18653/v1/2025.naacl-long.26

### Closest prior work and framing (added by the judge)
Choi, et al. (2026). *Intent Assistant* [CHI 2026; full author list and title to be completed from the source]. arXiv. https://arxiv.org/abs/2510.14513

Horvitz, E. (1999). Principles of mixed-initiative user interfaces. In *Proceedings of the SIGCHI Conference on Human Factors in Computing Systems (CHI '99)* (pp. 159–166). ACM. https://www.erichorvitz.com/chi99horvitz.pdf

Horvitz, E., Jacobs, A., & Hovel, D. (1999). Attention-sensitive alerting. In *Proceedings of the Fifteenth Conference on Uncertainty in Artificial Intelligence (UAI '99)* (pp. 305–313). https://arxiv.org/abs/1301.6707

Microsoft. (2025, October 16). *Making every Windows 11 PC an AI PC*. Windows Experience Blog. https://blogs.windows.com/windowsexperience/2025/10/16/making-every-windows-11-pc-an-ai-pc/

Olsen, D. R., Jr. (2007). Evaluating user interface systems research. In *Proceedings of the 20th Annual ACM Symposium on User Interface Software and Technology (UIST '07)* (pp. 251–258). ACM. https://doi.org/10.1145/1294211.1294256

Zhang, C., et al. (2025). *UFO2: The desktop AgentOS* [Preprint; full author list to be completed]. arXiv. https://arxiv.org/abs/2504.14603

### Siri
Apple Inc. (2011, October 4). *Apple launches iPhone 4S, iOS 5 & iCloud* [Press release]. https://www.apple.com/newsroom/2011/10/04Apple-Launches-iPhone-4S-iOS-5-iCloud/

Apple Inc. (2019, August 28). *Improving Siri's privacy protections* [Press release]. https://www.apple.com/newsroom/2019/08/improving-siris-privacy-protections/

Apple Inc. (2021, June 7). *Apple advances its privacy leadership with iOS 15, iPadOS 15, macOS Monterey, and watchOS 8* [Press release]. https://www.apple.com/newsroom/2021/06/apple-advances-its-privacy-leadership-with-ios-15-ipados-15-macos-monterey-and-watchos-8/

Apple Inc. (2024, June 10). *Introducing Apple Intelligence for iPhone, iPad, and Mac* [Press release]. https://www.apple.com/newsroom/2024/06/introducing-apple-intelligence-for-iphone-ipad-and-mac/

Apple Developer. (2016). *Introducing SiriKit* [Video, WWDC16 Session 217]. https://developer.apple.com/videos/play/wwdc2016/217/

Apple Developer. (2022). *Dive into App Intents* [Video, WWDC22 Session 10032]. https://developer.apple.com/videos/play/wwdc2022/10032/

Apple Machine Learning Research. (2026, June 8). *Introducing the third generation of Apple's foundation models*. https://machinelearning.apple.com/research/introducing-third-generation-of-apple-foundation-models

Audio Software Engineering & Siri Speech Team. (2018, December 3). *Optimizing Siri on HomePod in far-field settings*. Apple Machine Learning Research. https://machinelearning.apple.com/research/optimizing-siri-on-homepod-in-far-field-settings

Cheyer, A., & Guzzoni, D. (2014). *Method and apparatus for building an intelligent automated assistant* (U.S. Patent No. 8,677,377 B2). U.S. Patent and Trademark Office. https://patents.google.com/patent/US8677377B2/en

Gruber, T. R., Cheyer, A. J., & Keen, D. (2019). *Intelligent automated assistant* (U.S. Patent No. 10,276,170 B2). U.S. Patent and Trademark Office. https://patents.google.com/patent/US10276170B2/en

Gunter, T., Wang, Z., Wang, C., Pang, R., Narayanan, A., et al. (2024). *Apple intelligence foundation language models* [Preprint]. arXiv. https://doi.org/10.48550/arXiv.2407.21075

Moniz, J. R. A., Krishnan, S., Ozyildirim, M., Saraf, P., Ates, H. C., Zhang, Y., & Yu, H. (2024). ReALM: Reference resolution as language modeling. In *Proceedings of SIGDIAL 2024*. https://doi.org/10.48550/arXiv.2403.20329

Siri Speech Recognition Team. (2018, August 9). *Finding local destinations with Siri's regionally specific language models for speech recognition*. Apple Machine Learning Research. https://machinelearning.apple.com/research/regionally-specific-language-models

Siri Team. (2017a, August 6). *Deep learning for Siri's voice: On-device deep mixture density networks for hybrid unit selection synthesis*. Apple Machine Learning Research. https://machinelearning.apple.com/research/siri-voices

Siri Team. (2017b, October 1). *Hey Siri: An on-device DNN-powered voice trigger for Apple's personal assistant*. Apple Machine Learning Research. https://machinelearning.apple.com/research/hey-siri

Siri Team. (2018, April 16). *Personalized Hey Siri*. Apple Machine Learning Research. https://machinelearning.apple.com/research/personalized-hey-siri

SRI International. (n.d.). *Siri*. Retrieved November 5, 2026, from https://www.sri.com/hoi/siri/

SRI International. (2003, November 17). *Artificial intelligence: CALO*. https://www.sri.com/hoi/artificial-intelligence-calo/

Zhang, D., Gondala, S., Fraga da Silva, T., & Van Gysel, C. (2024). Server-side rescoring of spoken entity-centric knowledge queries for virtual assistants. *International Journal of Speech Technology*. https://machinelearning.apple.com/research/server-side-rescoring

### Alexa
Amazon. (2013, January 24). *Amazon.com announces acquisition of IVONA Software* [Press release]. https://press.aboutamazon.com/2013/1/amazon-com-announces-acquisition-of-ivona-software

Amazon. (2015, June 23). *Amazon Echo now available to all customers* [Press release]. https://press.aboutamazon.com/news-releases/news-release-details/amazon-echo-now-available-all-customers

Amazon. (2020, September 24). *Introducing the all-new Echo family—reimagined, inside and out* [Press release]. https://press.aboutamazon.com/2020/9/introducing-the-all-new-echo-family-reimagined-inside-and-out

Amazon Developer. (n.d.). *Create the interaction model for your skill*. Alexa Skills Kit documentation. Retrieved November 5, 2026, from https://developer.amazon.com/en-US/docs/alexa/custom-skills/create-the-interaction-model-for-your-skill.html

Amazon Staff. (2025a, February 26). *Introducing Alexa+, the next generation of Alexa*. About Amazon. https://www.aboutamazon.com/news/devices/new-alexa-generative-artificial-intelligence

Amazon Staff. (2025b). *How Amazon rebuilt Alexa with generative AI*. About Amazon. https://www.aboutamazon.com/news/devices/new-alexa-tech-generative-artificial-intelligence

FitzGerald, J., Ananthakrishnan, S., Arkoudas, K., et al. (2022). Alexa Teacher Model: Pretraining and distilling multi-billion-parameter encoders for natural language understanding systems. In *Proceedings of the 28th ACM SIGKDD Conference on Knowledge Discovery and Data Mining (KDD '22)*. https://arxiv.org/abs/2206.07808

Grossman, B. (2020, December 10). *Now available: Enable Alexa to proactively act on hunches without customers needing to ask*. Amazon Developer Blog. https://developer.amazon.com/en-US/blogs/alexa/device-makers/2020/12/Enable-Alexa-to-Proactively-Act-on-Hunches

Haeb-Umbach, R., Watanabe, S., Nakatani, T., Bacchiani, M., Hoffmeister, B., Seltzer, M. L., Zen, H., & Souden, M. (2019). Speech processing for digital home assistants: Combining signal processing with deep-learning techniques. *IEEE Signal Processing Magazine, 36*(6), 111–124. https://doi.org/10.1109/MSP.2019.2918706

Kim, Y.-B., Kim, D., Kim, J.-K., & Sarikaya, R. (2018). A scalable neural shortlisting-reranking approach for large-scale domain classification in natural language understanding. In *Proceedings of NAACL-HLT 2018, Volume 3 (Industry Papers)* (pp. 16–24). Association for Computational Linguistics. https://doi.org/10.18653/v1/N18-3003

Lorenzo-Trueba, J., Drugman, T., Latorre, J., Merritt, T., Putrycz, B., Barra-Chicote, R., Moinet, A., & Aggarwal, V. (2019). Towards achieving robust universal neural vocoding. In *Proceedings of Interspeech 2019*. https://arxiv.org/abs/1811.06292

Parthasarathi, S. H. K., & Strom, N. (2019). *Lessons from building acoustic models with a million hours of speech* [Preprint]. arXiv. https://arxiv.org/abs/1904.01624

Ram, A., Prasad, R., Khatri, C., Venkatesh, A., Gabriel, R., Liu, Q., et al. (2018). *Conversational AI: The science behind the Alexa Prize* [Preprint]. arXiv. https://arxiv.org/abs/1801.03604

Sarikaya, R. (2017). The technology behind personal digital assistants: An overview of the system architecture and key components. *IEEE Signal Processing Magazine, 34*(1), 67–81. https://doi.org/10.1109/MSP.2016.2617341

Soltan, S., Ananthakrishnan, S., FitzGerald, J., Gupta, R., et al. (2022). *AlexaTM 20B: Few-shot learning using a large-scale multilingual seq2seq model* [Preprint]. arXiv. https://arxiv.org/abs/2208.01448

TechCrunch. (2025, March 15). *Amazon's Echo will send all voice recordings to the cloud, starting March 28*. https://techcrunch.com/2025/03/15/amazons-echo-will-send-all-voice-recordings-to-the-cloud-starting-march-28

---

*Reference entries marked "et al." or "to be completed" need their full author lists filled in from the source before final submission. The full researcher and judge reports (with every confidence label) are kept alongside this document as supporting evidence.*
