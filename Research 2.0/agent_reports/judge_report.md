# Judge Report: A.P.A. (ADA-V2) literature review, authenticity and novelty rulings

Ruling date: 5 Nov 2026. Every external claim below has a URL. "Not found" means I searched and found no source. It does not mean the capability is absent.

---

## 1. Verdict summary

- **Researcher reports.** Siri report: **RELIABLE**, and its confidence labels are honest. Alexa report: **RELIABLE WITH CORRECTIONS** (2 factual over-statements, listed in §2). Papers report: **RELIABLE**; I re-checked 3 of its corrections and all 3 hold. A.P.A. code report: **ACCEPTED**. I spot-checked it against the code: threshold 6.0, cooldown 600 s, cap 5/day, the native-audio model string, no `interrupted` handler in ada.py, and no MCP in any .py file.
- **Novelty.** A.P.A. has **no novel component**. Every capability already exists elsewhere, mostly in products from 2024–2026.
  - Speech-to-speech plus screen understanding: Copilot Voice + Vision, Gemini Live.
  - Desktop/agent control with take-over and approval: Copilot Actions, ChatGPT agent, UFO2.
  - Screen-based focus nudging: Intent Assistant, CHI 2026.
  - Proactive spoken offers from email, decided by expected utility and attention: LookOut, Horvitz CHI 1999.
- **What survives.** The **combination**: one always-on S2S voice loop that, in a single Windows assistant, (i) speaks up uninvited about email under an explicit cost gate, (ii) actuates the desktop behind confirmation and an emergency stop, and (iii) monitors focus from the screen. I found no product or paper that does all three. That is **DIFFERENTIATING at the integration level**. It is research only if the student evaluates it (§6).
- **"We solve, not invent"** is a legitimate framing. HCI accepts systems research (Olsen 2007). That acceptance depends on evidence that the integration solves the problem better than the alternatives. A.P.A. has **zero user-study evidence** today. The 54-row proactive log is a design artefact, not an evaluation.

---

## 2. Authenticity rulings (spot-checks)

| # | Source | Ruling | Notes / correction | Checked at |
|---|---|---|---|---|
| 1 | Siri Team (2017, Oct 1), *Hey Siri: An on-device DNN-powered voice trigger* | **AUTHENTIC** | All checked details confirmed: 16 kHz, 5 hidden layers of 32/128/192, two passes on the AOP, second-chance threshold, "Hey Seriously" server cancel, main ASR in the cloud | https://machinelearning.apple.com/research/hey-siri |
| 2 | Siri Team (2017, Aug 6), *Deep learning for Siri's voice* | **AUTHENTIC** | Confirmed: hybrid unit selection, half-phones, MDN (3×512 ReLU), Viterbi, WSOLA, on device, ≥15 h of speech (>20 h for the iOS 11 voice) | https://machinelearning.apple.com/research/siri-voices |
| 3 | Gunter et al., *Apple Intelligence Foundation Language Models*, arXiv 2407.21075 | **AUTHENTIC-WITH-CORRECTION** | ~3B on-device model and a PCC server model confirmed. The abstract gives no server parameter count and does not mention adapters or tool use. A v2 was posted 27 May 2026, so cite the version used | https://arxiv.org/abs/2407.21075 |
| 4 | Moniz et al., *ReALM*, arXiv 2403.20329 | **AUTHENTIC** | SIGDIAL 2024 (oral). Confirmed: >5% absolute gain on on-screen references, ≈ GPT-4 for the smallest model, larger models beat GPT-4 | https://arxiv.org/abs/2403.20329 |
| 5 | Kim, Kim, Kim & Sarikaya (2018), NAACL-HLT Industry, pp. 16–24, doi 10.18653/v1/N18-3003 | **AUTHENTIC-WITH-CORRECTION** | 1,500 domains confirmed. "Shortlister" appears in the paper text. "HypRank" appears only in figure file names in my extraction, so call it the "re-ranking stage" unless you check the PDF. **BiLSTM not verified, so drop it** | https://aclanthology.org/N18-3003/ |
| 6 | Soltan et al., *AlexaTM 20B*, arXiv 2208.01448 | **AUTHENTIC** | 20B, 12 languages, beats PaLM-540B on 1-shot summarisation and GPT-3 on zero-shot SuperGLUE/SQuADv2. **Preprint, no venue.** Deployment in Alexa is not stated | https://arxiv.org/abs/2208.01448 |
| 7 | FitzGerald et al., *Alexa Teacher Model*, KDD '22, arXiv 2206.07808 | **AUTHENTIC-WITH-CORRECTION** | The Alexa report says "in a live test it cut … dissatisfaction 3.74–4.91%". The abstract says "an automatic measurement of full-system user dissatisfaction", **relative to models distilled from an 85M teacher**. It does not say "live A/B test" | https://arxiv.org/abs/2206.07808 |
| 8 | Ram et al. (2018), *Conversational AI: The science behind the Alexa Prize*, arXiv 1801.03604 | **AUTHENTIC** | $2.5M prize, 16 teams, live users | https://arxiv.org/abs/1801.03604 |
| 9 | Amazon (2025, Feb 26; updated 21 Jul 2026), *Introducing Alexa+* | **AUTHENTIC-WITH-CORRECTION** | Quotes confirmed: "proactive when it's important" (commute example), "remember things", $19.99 or free with Prime, US and Canada. **Agentic web navigation is in the future tense** ("will enable"), so do not present it as shipped. No computer control: "pick it up on your computer" means continuing a conversation there | https://www.aboutamazon.com/news/devices/new-alexa-generative-artificial-intelligence |
| 10 | Grossman (2020, Dec 10), *Enable Alexa to proactively act on Hunches* | **AUTHENTIC** | Away/asleep inference; lights, plugs, thermostats, water heaters; opt-in. The post **does not say Alexa speaks**: this is silent device action | https://developer.amazon.com/en-US/blogs/alexa/device-makers/2020/12/Enable-Alexa-to-Proactively-Act-on-Hunches |
| 11 | Hunches announcement (Sep 2018) | **AUTHENTIC (secondary only)** | Announced 20 Sep 2018 (TechCrunch). Hunches are voiced **after a user utterance** such as "good night", not unprompted (AFTVnews). There is still no Amazon primary source | https://techcrunch.com/2018/09/20/amazons-alexa-can-now-act-on-hunches-about-your-behavior/amp ; https://www.aftvnews.com/alexa-hunches-now-alert-you-of-smart-home-devices-that-you-might-have-forgot-about/ |
| 12 | Apple ML Research (2026, Jun 8), *Third generation of Apple foundation models* | **AUTHENTIC** | "Entirely new Siri" wording confirmed; Cloud Pro handles "agentic tool use"; Expressive Voices run on device. No on-screen-awareness or proactive claims on this page | https://machinelearning.apple.com/research/introducing-third-generation-of-apple-foundation-models |
| P1 | UFO (Zhang et al.) | **AUTHENTIC-WITH-CORRECTION** | Now **NAACL 2025 Long, pp. 597–622, doi 10.18653/v1/2025.naacl-long.26**. The student's "arXiv 2024" is out of date | https://aclanthology.org/2025.naacl-long.26/ |
| P2 | GPTVoiceTasker (Vu et al.) | **AUTHENTIC-WITH-CORRECTION** | ACM author order: Vu, Wang, **Chen, J., Li, Z.**, Zhao, Xing, Chen, C. UIST '24, pp. 1–17, doi 10.1145/3654777.3676356 | https://api.crossref.org/works/10.1145/3654777.3676356 |
| P3 | Meurisch et al. (2020) | **AUTHENTIC-WITH-CORRECTION** | IMWUT 4(4), pp. 1–22, doi 10.1145/3432193. Crossref gives **no article number**, so drop "Art. 146" unless ACM DL confirms it | https://api.crossref.org/works/10.1145/3432193 |
| N1 | Olsen (2007), *Evaluating user interface systems research*, UIST '07, pp. 251–258 | **AUTHENTIC** | doi 10.1145/1294211.1294256 | https://api.crossref.org/works/10.1145/1294211.1294256 |
| N2 | Horvitz (1999), *Principles of mixed-initiative user interfaces*, CHI '99, pp. 159–166 (LookOut) | **AUTHENTIC** | Full text read. LookOut uses **TTS + speech recognition** to start a dialog about an email-implied meeting. Actions are governed by **expected utility**. Principle 3 is "considering the status of a user's attention in the timing of services" | https://www.erichorvitz.com/chi99horvitz.pdf |
| N3 | Horvitz, Jacobs & Hovel (1999), *Attention-sensitive alerting*, UAI '99, pp. 305–313 | **AUTHENTIC** | Weighs the cost of deferring an email alert against the cost of interruption, using user activity | https://arxiv.org/abs/1301.6707 ; http://erichorvitz.com/attend.htm |

**Overall rulings on the reports**
- **siri_report.md: RELIABLE.** 6 of 6 primary claims checked are correct, and LIKELY/UNVERIFIED are used conservatively.
- **alexa_report.md: RELIABLE WITH CORRECTIONS.** Rows 7 and 9 above are wrong. The amazon.science claims remain LIKELY.
- **papers_report.md: RELIABLE.** Its UFO, GPTVoiceTasker and Meurisch corrections are confirmed independently.
- **apa_code_report.md: ACCEPTED** (spot-checked, not fully re-audited).

---

## 3. Do-not-cite list (as fact)

Siri:
- Nuance as Siri's ASR vendor (press only; Apple never confirmed).
- Federated learning for "Hey Siri" as Apple production practice (Granqvist 2020 has no affiliation on its abstract page; the survey claim is unopened).
- The iOS 13 "neural TTS" technique.
- The A12 requirement for on-device ASR.
- SiriKit / App Intents / App Shortcuts details (WWDC snippets only). Cite them only after opening the WWDC pages.
- The cap of 10 App Shortcuts per app.
- The Federighi "V1/V2 architecture" quote.
- "Siri uses a knowledge graph".
- "Siri has no proactive voice". This is an inference; do not state it as fact. Also note that Apple's 2024 Siri gained onscreen awareness.
- Apple's NLU domain→intent pipeline attributed to Siri specifically.

Alexa:
- Evi $26M price and Yap details.
- RNN-T on device with lattice rescoring (amazon.science, not rendered).
- NTTS newscaster style and its "two-thirds" figure.
- Sun et al. 2017 TDNN figures (until the ISCA page is opened).
- Haeb-Umbach affiliations.
- Alexa Conversations ">50%" figure.
- "Deep home embeddings" for Hunches.
- AZ1 "2×/20×/85%" figures.
- Polly–IVONA lineage.
- The ProactiveEvents API description (snippet only).
- **"BiLSTM" in Shortlister.**
- **"Live test" for the Alexa Teacher Model.**
- **Alexa+ agentic browsing as a shipped feature.**
- Cowan et al. 2017 author list (written from memory).

Papers:
- UFO's "50 tasks / 86%" unless the paper body is cited.
- Toolformer pp. 68539–68551.
- Lau "Art. 102" and Meurisch "Art. 146".

Novelty sources:
- Astra "decides when to speak" (Wayne/Hassabis quotes): secondary press only, use with a caveat.
- ChatGPT agent confirmation/takeover: secondary press only, because openai.com returned 403.
- UITron-Speech benchmark numbers.

---

## 4. Capability matrix

Legend: ✔ = documented; ◐ = partial or limited; ✘ = documented absent or explicitly not offered; ? = not found in sources checked.

| System | (a) Native S2S voice | (b) Desktop GUI control | (c) Proactive **spoken** interruption gated by attention/cost | (d) HITL confirmation + emergency stop | (e) Focus/attention monitoring | Memory | On-device / privacy |
|---|---|---|---|---|---|---|---|
| **Siri / Apple Intelligence** | ◐ AFM 3 generates voice on device [S1]; ASR + LLM still separate models | ✘ on Mac GUI; app actions via intents [S2] | ? none documented | ◐ asks permission before ChatGPT hand-off [S2] | ✘ | ◐ personal context from on-device data [S2] | ✔ on-device + PCC [S1][S2] |
| **Alexa / Alexa+** | ? pipeline undisclosed [A1] | ✘ (web navigation announced, future tense) [A1] | ◐ Hunches: voiced after the user speaks, or silent action [A2][A3]; Alexa+ "proactive when it's important" with **no published gating method** [A1] | ? | ✘ | ✔ "remember things" [A1] | ✘ cloud only since 28 Mar 2025 [A4] |
| **Microsoft Copilot (Windows)** | ✔ Copilot Voice + "Hey Copilot" wake word, GA [M1] (S2S internals undisclosed) | ◐ Copilot Actions on local files, preview, off by default [M1] | ✘ none described [M1] | ✔ may "request your approval"; user can pause, take over, disable [M1] | ◐ Vision sees the shared screen on request [M1]; no focus monitoring | ? | ◐ opt-in connectors; cloud [M1] |
| **ChatGPT (Adv. Voice + Operator/agent)** | ✔ (Advanced Voice; not re-verified here) | ◐ its own virtual browser/computer, not the user's desktop [O1] | ✘ none found | ✔ permission before consequential actions; interrupt, take over, stop (secondary) [O1][O2] | ✘ | ✔ (ChatGPT memory; not re-verified) | ✘ cloud |
| **Gemini Live / Astra / Mariner** | ✔ native-audio Live models (A.P.A. uses one) [G1] | ◐ Mariner computer use for web, prototype / API [G2] | ◐ Astra "decides when to speak based on events it sees" (prototype, secondary) [G3]; Live API "proactive audio" = relevance-gated **responding** [G1] | ? | ◐ screen/camera sharing [G2] | ◐ Astra "improved memory" (secondary) [G2] | ✘ cloud |
| **UFO / UFO2** | ✘ text only | ✔ Windows UIA + vision, HostAgent/AppAgents, >20 apps [U1][U2] | ✘ | ◐ UFO2 runs in a Picture-in-Picture desktop so the user is not disturbed [U2]; no e-stop documented | ✘ | ? | ✘ cloud LLM |
| **GPTVoiceTasker** | ✘ cascaded ASR → LLM | ◐ **Android** GUI [P2] | ✘ | ? | ✘ | ◐ learns from past commands [P2] | ? |
| **Intent Assistant (CHI '26)** | ✘ | ✘ | ◐ proactive nudges on distraction [I1]; modality not stated | ✘ | ✔ LLM judges screenshots, titles and URLs against a stated goal; 3-week field study, N=22 [I1] | ◐ learns from clarification and feedback [I1] | ? |
| **LookOut (CHI '99)** | ◐ TTS + ASR dialog (cascaded) [H1] | ◐ drives Outlook calendar only [H1] | ✔ **offers by voice from email, timed by expected utility and an attention model** [H1] | ✔ user confirms or rejects the offer [H1] | ◐ attention model for timing [H1] | ✘ | local |
| **A.P.A. (code)** | ✔ Gemini native audio; **half-duplex, no barge-in, no wake word** [C] | ✔ Windows: UIA + pyautogui, allow-lists, safe apps only [C] | ✔ **email only**; additive score ≥ 6.0 + gates (user speaking, ADA speaking, user absent, low urgency) + 600 s cooldown + 5/day cap → one spoken sentence [C] | ✔ ConfirmCard Allow/Deny (default ON for actuators and email); in-memory e-stop by voice/UI + pyautogui FAILSAFE [C] | ✔ screenshot classified every 30 s; needs 120–240 s sustained off-task; spoken nudge [C] | ✘ **none** [C] | ✘ **cloud**: audio, screenshots and email bodies go to Google [C] |

Sources:
- [S1] https://machinelearning.apple.com/research/introducing-third-generation-of-apple-foundation-models
- [S2] https://www.apple.com/newsroom/2024/06/introducing-apple-intelligence-for-iphone-ipad-and-mac/ (via the Siri report, VERIFIED)
- [A1] https://www.aboutamazon.com/news/devices/new-alexa-generative-artificial-intelligence
- [A2] https://developer.amazon.com/en-US/blogs/alexa/device-makers/2020/12/Enable-Alexa-to-Proactively-Act-on-Hunches
- [A3] https://www.aftvnews.com/alexa-hunches-now-alert-you-of-smart-home-devices-that-you-might-have-forgot-about/
- [A4] https://techcrunch.com/2025/03/15/amazons-echo-will-send-all-voice-recordings-to-the-cloud-starting-march-28
- [M1] https://blogs.windows.com/windowsexperience/2025/10/16/making-every-windows-11-pc-an-ai-pc/
- [O1] https://venturebeat.com/ai/openai-unveils-chatgpt-agent-that-gives-chatgpt-its-own-computer-to-autonomously-use-your-email-and-web-apps-download-and-create-files-for-you
- [O2] https://gulfnews.com/technology/chatgpt-agent-can-become-your-personal-assistant-at-home-and-work-1.500202885 (secondary; primary https://openai.com/index/introducing-chatgpt-agent/ returned 403)
- [G1] https://docs.cloud.google.com/vertex-ai/generative-ai/docs/live-api?hl=en
- [G2] https://www.infoworld.com/article/3992127/google-i-o-2025-the-most-important-new-launches.html
- [G3] https://www.newsbytesapp.com/news/science/project-astra-gets-several-new-updates-at-i-o-2025/story (secondary)
- [U1] https://aclanthology.org/2025.naacl-long.26/
- [U2] https://arxiv.org/abs/2504.14603v2 ; https://www.microsoft.com/en-us/research/?p=1145327
- [P2] https://doi.org/10.1145/3654777.3676356
- [I1] https://arxiv.org/abs/2510.14513
- [H1] https://www.erichorvitz.com/chi99horvitz.pdf
- [C] apa_code_report.md
- Also relevant: Anthropic computer use (Oct 2024; screenshots, mouse and keyboard; "cumbersome and error-prone"; OSWorld 14.9%), https://www.anthropic.com/news/3-5-models-and-computer-use. Speech-instructed GUI agent UITron-Speech (formerly GUIRoboTron-Speech), https://arxiv.org/abs/2506.11127.

---

## 5. Novelty rulings

| # | Claim | Verdict | Closest prior work | Reasoning |
|---|---|---|---|---|
| 1 | "All-in-one integration" as a contribution by itself | **INTEGRATION-ONLY → NOT NOVEL as stated** | Copilot on Windows [M1]; Alexa+ [A1]; Personal LLM Agents survey (arXiv 2401.05459) | Copilot already combines voice, screen vision, local-file actions with approval, and connectors on Windows. The survey treats all-in-one personal agents as an established research area. "We put everything in one place" is a product claim. It becomes a research claim only with a measured effect: less fragmentation, faster tasks, or fewer context switches |
| 2 | Native S2S voice for a desktop agent | **NOT NOVEL** | Copilot Voice + Actions [M1]; Gemini Live [G1]; Moshi; UITron-Speech [2506.11127] | A.P.A. calls Google's native-audio API, so the S2S capability belongs to Gemini, not to A.P.A. It is also half-duplex, with no barge-in and no wake word, so it is *weaker* than Moshi's full-duplex design and than Copilot's wake word |
| 3 | Proactive SPOKEN interruption gated by an interrupt-worthiness score + attention gates | **DIFFERENTIATING (narrow)** | **LookOut, CHI '99** [H1] (voice offer from email, expected utility, attention-timed); Attention-Sensitive Alerting, UAI '99 [N3]; Alexa Hunches [A2][A3]; Alexa+ proactive alerts [A1]; Astra [G3] | The idea is 27 years old and descends directly from Horvitz. What remains new: an LLM estimates urgency and relevance; the output is a native-S2S voice inside an ongoing live session; and the gating is explicit, logged and user-tunable (threshold, cooldown, cap, speaking/absent gates). Neither Alexa+ nor Astra publishes a gating method. Weaknesses: email only, additive heuristic weights, no learning (the student's own Claim E already says this), and the docstring claims a Horvitz ratio while the code is additive |
| 4 | Voice-driven Windows GUI control with confirmation + emergency stop | **NOT NOVEL (each part); INTEGRATION-ONLY together** | UFO/UFO2 [U1][U2]; Copilot Actions (approval, take over, pause) [M1]; ChatGPT agent [O1]; GPTVoiceTasker (voice GUI, Android) [P2]; Anthropic computer use | Take-over and approval exist in Copilot and ChatGPT agent. UFO2 is far more capable on Windows. A.P.A.'s distinct points are that it is voice-first and that its e-stop is a hard actuator lock reachable by voice. That is a design detail, not a contribution, unless the student measures it |
| 5 | Screen-based focus monitoring with spoken nudges | **NOT NOVEL** | **Intent Assistant, CHI 2026** [I1]: LLM on screenshots against a stated goal, nudges, 3-week field study, N=22 | INA does the same thing and has a field evaluation. The only possible difference is that A.P.A.'s nudge is *spoken* (INA's modality is not stated in its abstract). Claim at most "a spoken variant of INA-style nudging" |
| 6 | The combination 3 + 4 + 5 in one voice loop | **DIFFERENTIATING (integration)**, **UNSUPPORTED as a benefit** | No single system found with all three. Nearest: Copilot (has 4 and partly 5, lacks 3); Astra (partly 3 and 5, no desktop control); LookOut (3 only) | This is the only defensible novelty. The open research question it raises is whether interruptions from several sources (email, focus, agent confirmations) on one voice channel interfere with each other. A.P.A. currently has a design flaw here: focus sessions do **not** suppress proactive email (`busy_until` unused). Fix that before claiming any coordinated interruption policy |

**On "we solve, not invent".** This framing is legitimate. Olsen (UIST 2007, doi 10.1145/1294211.1294256) argues that UI systems research should not be judged mainly by usability tests or by novelty of parts. It should be judged by claims such as:
- importance of the problem and the population it serves (STU: situations, tasks, users),
- solving a problem not previously solvable,
- generality,
- reducing solution viscosity: flexibility, expressive leverage, expressive match,
- combining building blocks so that new capability emerges ("inductive combination"),
- scalability.

Integration is therefore a recognised contribution type. It obliges the student to **demonstrate** the solution, though. "Fragmentation" has to be shown as a real cost, and A.P.A. has to be shown to reduce it.

**Evidence that would make it defensible:**
1. A within-subjects study (N≥12) comparing A.P.A. against a fragmented baseline (Windows + separate mail client + Copilot or manual workflow) on the same multi-step tasks. Measures: completion time, number of app or context switches, errors, NASA-TLX, SUS, trust.
2. A field log of proactive decisions with user ratings for each interruption (useful / annoying / missed). Report precision of interruptions and the false-silence rate, and compare against a rule baseline (the student's own Claim A disproof test).
3. Success rate on a small OSWorld-style or UFO-style Windows task set, with and without confirmation, plus e-stop latency.
4. A cross-source interruption test: email alerts while in a focus session, to show the combined policy behaves better than separate tools.

---

## 6. Strongest claim, research question, forbidden claims

**Strongest defensible research claim (one sentence):** A.P.A. is a working Windows prototype that unifies, in one native speech-to-speech voice loop, cost-gated proactive spoken alerts, confirmation-guarded desktop actuation with an emergency stop, and screen-based focus nudging. As far as this review found, no single published system or product combines all three.

**Research question (one sentence):** Compared with a fragmented set of separate tools, does a single voice-first assistant that coordinates proactive interruptions, guarded desktop actions and focus nudges reduce task time and context switching without increasing perceived interruption burden or reducing trust?

**Claims the student must NOT make:**
1. **"A.P.A. is the first proactive voice assistant" or "first to interrupt by voice based on attention."** LookOut (CHI 1999) did voice offers from email with expected-utility and attention-based timing. Alexa Hunches and Alexa+ also act proactively.
2. **"A.P.A. introduces native speech-to-speech, real-time duplex, or barge-in conversation."** The S2S model is Google's. A.P.A. is half-duplex with no barge-in, and it has no wake word.
3. **"A.P.A. has memory, uses MCP, is private or on-device, or is protected against prompt injection."** The code has no memory and no MCP. Audio, screenshots and email bodies go to Google's cloud, and the injection defence is prompt-level plus a confirmation gate only.

Also avoid: "all-in-one integration is our novel contribution" without evidence; "personalised or learning interruption policy" (it is static, configurable heuristics); "Horvitz decision-theoretic ratio" (the code is additive); any success-rate or user-benefit number (none has been measured).

---

## 7. Corrections the student must make

**Citations (from papers_report, confirmed here where marked ✔):**
1. ✔ UFO: cite **NAACL 2025 (Long), pp. 597–622, doi 10.18653/v1/2025.naacl-long.26**, not "arXiv 2024".
2. ✔ GPTVoiceTasker: author order **…Chen, J., Li, Z.…**; cite the ACM DOI 10.1145/3654777.3676356, not arXiv.
3. ✔ Meurisch: drop "Article 146" (Crossref gives pp. 1–22 only). Likewise drop Lau "Article 102" unless confirmed in ACM DL.
4. Moshi: order **Pérez, Jégou, Grave**, with the accents; label it `[Preprint]`.
5. OSWorld: add "Datasets and Benchmarks Track".
6. Lau et al.: only the 17 *users* did diary + interview; the 17 non-users were interviewed only.
7. Generative Agents: the ablation components are **observation, planning and reflection** (not "memory, reflection and planning").
8. Papers_Explained.md: says "All 10 papers…" but covers 12, and paper #12 is not from the table. The summary table lists 10 rows. Fix both.
9. Personal LLM Agents: APA 7 needs the first 19 authors, "…", then the last author, not "et al." Keep `[Preprint]` on Moshi, MemGPT and Personal LLM Agents (3 of 12 are not peer-reviewed).
10. Toolformer page numbers are unverified; omit them or verify them.
11. UFO "50 tasks": cite the paper body (WindowsBench), not the abstract.

**From this ruling:**
12. Alexa Teacher Model: replace "live test" with "automatic full-system dissatisfaction measure, vs. 85M-teacher students".
13. Alexa+: agentic web navigation is **announced (future tense)**, not shipped. Alexa+ does not control a computer.
14. Kim et al. 2018: remove "BiLSTM", and say "shortlisting + re-ranking (Shortlister/HypRank)" only after checking the PDF.
15. Hunches: describe 2018 Hunches as suggestions voiced *after* a user utterance, and 2020 Hunches as silent opt-in device actions. Neither is unprompted speech.
16. **Add LookOut (Horvitz, CHI '99, pp. 159–166) and Attention-Sensitive Alerting (UAI '99) as the closest prior work for proactive spoken interruption.** Without them, an examiner will catch the omission.
17. **Add Intent Assistant (Choi et al., CHI 2026, arXiv 2510.14513) as the closest prior work for focus monitoring.**
18. **Add UFO2 (arXiv 2504.14603) and Microsoft Copilot on Windows (blogs.windows.com, 16 Oct 2025)** as the closest integrated systems. Add Olsen 2007 for the systems-research framing.
19. **Retire 03_NOVELTY_CHALLENGE.md Claim D (MCP).** A.P.A. does not use MCP. Also correct "LiveServe (2026)" and "S2S Survey (2026)", which are unverified here; do not cite them without checking.
20. Papers_Explained #1 says A.P.A. "hears and speaks directly … feels natural". Add that A.P.A. is half-duplex with no barge-in. #10 says "keeping private data local", which is **false**: data goes to Google's cloud.
21. Code and claim alignment: make focus sessions suppress proactive email (`busy_until`), or stop claiming coordinated interruption. Fix the proactive.py docstring (it says multiplicative Horvitz; the code is additive).
