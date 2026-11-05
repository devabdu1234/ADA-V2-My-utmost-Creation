# How Amazon Alexa Is Built: Voice In to Spoken Answer Out (2013–2026)

Literature-review notes, gathered 5 November 2026, for comparison with A.P.A. (a voice-first desktop assistant).

**Confidence labels**
- **VERIFIED**: I opened the primary source (or its official abstract/listing page) and it says this.
- **LIKELY**: the claim comes from search-result snippets, reputable secondary press, or a source I could not open in full.
- **UNVERIFIED**: from memory or weak sources only. Do not cite it without checking.

**Access note:** amazon.science pages returned empty content to my fetcher (they are rendered in the browser with JavaScript). Claims that rest only on amazon.science blog posts are therefore marked LIKELY. arXiv, ACL Anthology, developer.amazon.com, aboutamazon.com and press.aboutamazon.com opened normally.

---

## 1. Stage-by-stage summary table

| # | Stage | Technique / model | Era | Source (full URL / DOI) | Conf. |
|---|---|---|---|---|---|
| 1 | Origins: TTS | Acquired IVONA Software (Poland, TTS), announced 24 Jan 2013 | Pre-Echo | https://press.aboutamazon.com/2013/1/amazon-com-announces-acquisition-of-ivona-software | LIKELY (release located, snippet read) |
| 1 | Origins: QA / speech | Evi Technologies (~2013, reported $26M; never officially confirmed) and Yap (2011, speech-to-text) | Pre-Echo | https://techcrunch.com/2013/04/17/sources-say-amazon-acquired-siri-like-evi-app-for-26m-is-a-smartphone-coming | LIKELY (Evi) / UNVERIFIED (Yap details) |
| 1 | Origins: device | Echo announced 6 Nov 2014 (invite-only, $199). Generally available 23 Jun 2015 | Launch | https://press.aboutamazon.com/news-releases/news-release-details/amazon-echo-now-available-all-customers | VERIFIED (2015 release) / LIKELY (2014 date) |
| 2 | Front end | 7-microphone far-field array, beamforming, noise cancellation while music plays ("barge-in") | 2014→ | Same 2015 press release | VERIFIED |
| 2 | Front end (survey) | Multichannel acoustic echo cancellation, beamforming, dereverberation, wake-word and end-of-interaction detection | Neural era survey | Haeb-Umbach et al. (2019), IEEE SPM 36(6), https://doi.org/10.1109/MSP.2019.2918706 | LIKELY (bibliographic data verified via search; PDF fetch failed) |
| 2 | Wake word | Compressed time-delay neural network (TDNN) with SVD compression; keyword "Alexa"; 19.7% DET-AUC reduction vs. DNN | 2017 neural | Sun et al. (2017), Interspeech, https://www.isca-archive.org/interspeech_2017/sun17_interspeech.html | LIKELY |
| 3 | Cloud ASR | Acoustic models trained on ~1M hours of unlabeled speech via teacher–student learning; 10–20% relative WER reduction | 2019 neural | Parthasarathi & Strom (2019), https://arxiv.org/abs/1904.01624 | VERIFIED |
| 3 | On-device ASR | AZ1 Neural Edge processor (Sep 2020) running an "all-neural speech recognition model" at the edge | 2020 hybrid | https://press.aboutamazon.com/2020/9/introducing-the-all-new-echo-family-reimagined-inside-and-out | VERIFIED |
| 3 | On-device ASR details | End-to-end RNN-T on device; lattice sent to cloud for neural LM rescoring | 2020–21 | https://amazon.science/blog/on-device-speech-processing-makes-alexa-faster-lower-bandwidth | LIKELY (page would not render) |
| 4 | NLU: interaction model | Developer-defined intents, slots (typed), sample utterances, invocation name, optional dialog model | 2015→ | https://developer.amazon.com/en-US/docs/alexa/custom-skills/create-the-interaction-model-for-your-skill.html | VERIFIED |
| 4 | NLU: architecture overview | Domain → intent → slot pipeline in personal digital assistants | 2017 | Sarikaya (2017), IEEE SPM 34(1), 67–81, https://doi.org/10.1109/MSP.2016.2617341 | LIKELY (DOI verified; text not read) |
| 4 | Skill routing | Shortlister (k-best domains, BiLSTM) + HypRank re-ranker, tested on 1,500 domains | 2018 | Kim, Kim, Kim & Sarikaya (2018), NAACL Industry, https://doi.org/10.18653/v1/N18-3003 | VERIFIED (abstract) |
| 4 | NLU foundation models | Alexa Teacher Model: 0.7B–9.3B encoders distilled to 17M–170M students for intent/slot | 2022 | FitzGerald et al. (2022), KDD, https://arxiv.org/abs/2206.07808 | VERIFIED |
| 5 | Dialog (developer) | Alexa Conversations: seed dialogues + API specs → dialogue simulator → learned dialogue manager | 2020–21 | Acharya et al. (2021), NAACL Demos, https://arxiv.org/abs/2104.09088 | LIKELY (arXiv listing via search) |
| 5 | Open-domain chat | Alexa Prize socialbots: $2.5M prize, 16 university teams | 2017–18 | Ram et al. (2018), https://arxiv.org/abs/1801.03604 | VERIFIED |
| 5 | Generative LM | AlexaTM 20B seq2seq (12 languages); beats PaLM 540B on 1-shot summarisation | 2022 | Soltan et al. (2022), https://arxiv.org/abs/2208.01448 | VERIFIED |
| 5 | LLM assistant | Alexa+: LLMs on Amazon Bedrock, router choosing between Amazon Nova and Anthropic Claude, "experts", API orchestration, agentic web navigation | Feb 2025→ | https://www.aboutamazon.com/news/devices/new-alexa-tech-generative-artificial-intelligence and https://www.aboutamazon.com/news/devices/new-alexa-generative-artificial-intelligence | VERIFIED |
| 6 | TTS | IVONA unit-selection (concatenative) → Neural TTS; newscaster style learned from a few hours of data | 2013 → 2018–19 | https://amazon.science/blog/neural-text-to-speech-makes-speech-synthesizers-much-more-versatile | LIKELY |
| 6 | Vocoder | Universal WaveRNN vocoder: 74 speakers, 17 languages, ~98% relative MUSHRA | 2018–19 | Lorenzo-Trueba et al. (2019), Interspeech, https://arxiv.org/abs/1811.06292 | VERIFIED |
| 7 | Actions | Smart Home Skill API (PowerController, thermostat directives, state/change reports) | 2016→ | https://developer.amazon.com/en-US/blogs/alexa/device-makers/2020/12/Enable-Alexa-to-Proactively-Act-on-Hunches | VERIFIED |
| 7 | Routines | Trigger (time, voice, device event, custom trigger) → actions; pre-built routines offered by skills | 2017→ | https://developer.amazon.com/en-AU/docs/alexa/routines/introduction-to-custom-trigger-for-routines.html | LIKELY |
| 7 | Proactive | Hunches (2018); acting on Hunches automatically, opt-in (Dec 2020); ProactiveEvents API (Dec 2018) | 2018–20 | See section 4 | VERIFIED / LIKELY |
| 8 | Privacy | "Do Not Send Voice Recordings" local-processing option ended 28 Mar 2025 | 2025 | https://techcrunch.com/2025/03/15/amazons-echo-will-send-all-voice-recordings-to-the-cloud-starting-march-28 | VERIFIED (secondary press quoting Amazon's email) |

---

## 2. Narrative per stage

### 2.1 Origins (2011–2015)
- Amazon announced the acquisition of **IVONA Software**, a Polish TTS company, on **24 January 2013**. IVONA already supplied text-to-speech on Kindle Fire. Price was not disclosed. **LIKELY** (press.aboutamazon.com release found in search; TheNextWeb and 9to5Google corroborate).
- **Evi Technologies** (formerly True Knowledge, a UK question-answering engine): TechCrunch reported in April 2013 that Amazon bought it for about $26M. Amazon never confirmed this officially. **LIKELY**.
- **Yap** (US speech-to-text, ~2011): only Wikipedia-derived lists and analyst remarks mention it. **UNVERIFIED** beyond the fact of the acquisition. Treat it as weak.
- **Echo** was unveiled on **6 Nov 2014** as an invite-only, $199 Wi-Fi/Bluetooth speaker (**LIKELY**: MacRumors and other launch-day coverage). Amazon's general-availability release (**23 June 2015**) describes the original architecture: "far-field voice recognition with an array of seven microphones", beamforming, noise cancellation that lets the wake word work "even when it is playing loud music", and an assistant "built in the cloud, so it is always getting smarter". **VERIFIED**.
- **Architectural takeaway:** from day one Alexa was a **hybrid**. Wake-word detection and the acoustic front end run on the device; ASR, NLU, dialogue and TTS run in the cloud (AWS). **VERIFIED** from the 2015 release's cloud-brain wording. The fact that wake-word spotting happens on the device is **LIKELY** (it is the standard design and is confirmed by the Sun et al. 2017 introduction via snippet).

### 2.2 Wake word and acoustic front end
- **Microphone array + beamforming + echo cancellation:** the 7-mic ring, beamforming and noise cancellation are VERIFIED (2015 release). In 2017 Amazon licensed the 7-mic voice-processing technology to third-party device makers (press.aboutamazon.com/2017/4/…). **LIKELY** (title only).
- **Survey reference:** Haeb-Umbach et al. (2019) cover the full home-assistant front end: multichannel acoustic echo cancellation (MAEC), array processing, dereverberation, wake-word and end-of-interaction detection. B. Hoffmeister is among the co-authors and is understood to be from Amazon. **LIKELY**: bibliographic data verified, but I could not open the PDF to confirm affiliations.
- **Keyword-spotting model:** Sun et al. (Interspeech 2017, Amazon authors) use a compressed TDNN with transfer and multi-task learning. They train it full-rank and then compress it by SVD to fit CPU, memory and latency budgets. Trained on in-house far-field "Alexa" data, it gave a 19.7% DET-AUC reduction against a DNN baseline. **LIKELY** (ISCA archive and amazon.science listing via search snippets).
- **Evolution:** DSP beamforming + small DNN keyword spotting (2014) → neural, compressed keyword spotting (2017) → dedicated neural silicon, AZ1 (2020). **LIKELY** as a synthesis.

### 2.3 Automatic speech recognition (ASR)
- **2014–2018, cloud hybrid models:** audio streamed to the cloud after the wake word. **VERIFIED** (2015 release).
- **Neural, semi-supervised scale:** Parthasarathi & Strom (2019) trained acoustic models on ~1 million hours of unlabeled speech plus 7,000 labeled hours. Teacher–student targets, BMUF on 64 GPUs. Relative WER reductions of ~10–20%, with larger gains in noisy conditions. **VERIFIED** (arXiv abstract). Amazon affiliation is **LIKELY**: the abstract page does not list it, but Strom is a known Alexa scientist.
- **On-device ASR (2020→):** the AZ1 Neural Edge processor shipped in Echo (4th gen) and Echo Show 10. It runs an "all-neural speech recognition model" at the edge. **VERIFIED** (press release, 24 Sep 2020). The release gives **no** latency figures. Press reports of "2× performance, 20× less power, 85% less memory", MediaTek co-development, and on-device ASR offered first to US English users who opted in are **LIKELY** (secondary).
- **Model type:** the on-device model is an end-to-end **RNN-T**. Only the recognition lattice is sent to the cloud, where a large neural LM re-scores it. **LIKELY** (amazon.science blog, seen via search snippet only).
- **2025 reversal:** local processing of voice recordings ended on 28 Mar 2025 (§2.8). **VERIFIED** (TechCrunch).

### 2.4 Natural language understanding (NLU) and skill routing
- **Developer-facing contract, Alexa Skills Kit (ASK):** each custom skill declares an *interaction model*. **Intents** are actions; **slots** are typed arguments (built-in types such as `AMAZON.DATE`, or custom types); **sample utterances** use slot placeholders, e.g. `i want to visit {toCity}`; there is an **invocation name** and an optional **dialog model** (required slots, prompts, confirmations, `Dialog.Delegate`). **VERIFIED** (developer.amazon.com).
- **Internal pipeline:** domain classification → intent classification → slot filling (named-entity tagging) → entity resolution. Sarikaya (2017), IEEE SPM, describes this architecture for personal digital assistants. **LIKELY**: DOI verified; I did not read the text. Entity resolution against slot-value catalogues is **UNVERIFIED** as to the specific Amazon paper.
- **Scaling to thousands of skills: Shortlister + HypRank.** Kim, Kim, Kim & Sarikaya (NAACL 2018) use a two-stage design. A shortlister cuts all domains to a k-best list (BiLSTM, character- and word-level features), and a list-wise re-ranker (HypRank) re-orders that list using context. Evaluated on **1,500 domains**. **VERIFIED** (ACL Anthology abstract). The BiLSTM detail is **LIKELY**. A companion ACL 2018 paper, "Efficient Large-Scale Neural Domain Classification with Personalized Attention", adds per-user attention over the skills a user has enabled. **LIKELY** (title from the amazon.science blog snippet; DOI not checked).
- **Foundation-model NLU (2022):** the Alexa Teacher Model pipeline pretrains 0.7–9.3B-parameter multilingual encoders, continues pretraining on in-domain Alexa data, and distils them into 17M–170M-parameter students for production intent and slot models. In a live test it cut automatically measured user dissatisfaction by 3.74–4.91%. **VERIFIED** (arXiv 2206.07808, KDD 2022).

### 2.5 Dialogue management and answer generation
- **Skill-based responses (2015→):** the NLU result is sent as an `IntentRequest` to the skill's cloud endpoint (often AWS Lambda), which returns text/SSML for TTS. **LIKELY** (standard ASK documentation; the interaction-model page confirms that intents map to a "cloud-based service").
- **Alexa Conversations (preview 2020, paper 2021):** developers supply a few annotated seed dialogues plus API specifications. A **dialogue simulator** expands them into training data for a learned dialogue model. This replaces "hundreds of dialogue paths" of hand coding and gave a >50% gain in turn-level action-signature accuracy. **LIKELY** (arXiv 2104.09088 abstract via search).
- **Alexa Prize (2016/17→):** a $2.5M university competition. Sixteen teams built open-domain "socialbots" tested with real Alexa users, covering NLU, context modelling, dialogue management, response generation and knowledge acquisition. **VERIFIED** (arXiv 1801.03604).
- **AlexaTM 20B (2022):** a 20B-parameter multilingual seq2seq model (denoising + causal LM pretraining, 12 languages). It outperforms PaLM 540B on 1-shot summarisation and GPT-3 175B on zero-shot SuperGLUE/SQuADv2. **VERIFIED** (arXiv 2208.01448). Deployment inside Alexa products is **not** stated in the abstract. **UNVERIFIED**.
- **Alexa+ (announced 26 Feb 2025):**
  - It is built on LLMs on **Amazon Bedrock**, with a "routing system" using **Amazon Nova and Anthropic Claude** that matches "each customer request with the best model for the task". **VERIFIED** (aboutamazon technical article).
  - **"Experts"** are "groups of systems, capabilities, APIs, and instructions that accomplish specific types of tasks". **VERIFIED**.
  - It orchestrates "tens of thousands of services and devices", and its LLMs "string together multiple such calls in a row". **VERIFIED**.
  - **Agentic web navigation** covers services that have no API, e.g. finding and booking a repair via Thumbtack "without user supervision". **VERIFIED**.
  - It uses **grounding** against hallucination, with news partners (AP, Reuters, Washington Post, 200+ outlets). **VERIFIED**.
  - Price is $19.99/month, free with Prime. Available in the US and Canada, with early access in several EU countries and the UK, Brazil and Mexico (page updated 21 Jul 2026). Also reachable via Alexa.com and the app. **VERIFIED**.
  - Amazon's articles give **no** latency numbers and **no** speech-pipeline (ASR/TTS) details. **VERIFIED** (absence).

### 2.6 Text-to-speech (TTS)
- **2013–2017:** IVONA unit-selection (concatenative) synthesis. **LIKELY**: the amazon.science NTTS blog contrasts NTTS with the older "unit-selection" approach.
- **2018–2019, Neural TTS (NTTS):** a seq2seq acoustic model plus a neural vocoder. A **newscaster speaking style** was learned "from just a few hours of training data". **LIKELY** (amazon.science blog via snippet). The companion paper "In Other News: A Bi-style TTS Model…" (arXiv 1904.02790) says the gap in style-appropriateness closed by about two-thirds. **LIKELY**.
- **Universal neural vocoder:** a WaveRNN trained on 74 speakers in 17 languages, giving ~98% relative MUSHRA for seen and unseen speakers. **VERIFIED** (arXiv 1811.06292, Interspeech 2019).
- **Amazon Polly:** the AWS TTS service shares this IVONA → NTTS lineage. **LIKELY** (amazon.science blog snippet: "Both Alexa and Polly evolved toward neural"). Polly's IVONA heritage is listed only on Wikipedia-derived pages. **UNVERIFIED**.

### 2.7 Actions and tools
- **Skills:** the third-party extension mechanism through ASK (§2.4). **VERIFIED**.
- **Smart home:** the Smart Home Skill API uses standard interfaces: PowerController for lights, plugs and switches; SetTargetTemperature / Alexa.AutomationManagement for thermostats; Toggle/Mode for water heaters. Devices send state and change reports. **VERIFIED** (developer blog, Dec 2020).
- **Routines:** trigger → action automations. Triggers are time, voice phrase, device event, or a developer-defined **custom trigger** (e.g. arrival home) delivered UNICAST or MULTICAST over HTTPS. Skills can also offer **pre-built routines**. **LIKELY** (developer docs via search snippet; page updated 30 Oct 2025).
- **Alexa+ tools:** "experts", API chaining and agentic browsing (§2.5). **VERIFIED**.

### 2.8 Privacy
- **Always listening:** the device listens locally for the wake word and streams audio to the cloud only after detecting it. **LIKELY** as a description of the design.
- **User perceptions:** Lau, Zimmerman & Schaub (2018, CSCW) found that users trade privacy for convenience with "privacy resignation", and that privacy controls "are rarely used". **LIKELY** (abstract via search; DOI verified).
- **2020 local option:** on AZ1 devices, US English users could opt in to on-device processing, with recordings deleted after processing. **LIKELY** (secondary press).
- **2025 change:** Amazon emailed users that **"Do Not Send Voice Recordings" would end on 28 March 2025**. It had applied only to Echo Dot (4th gen), Echo Show 10 and Echo Show 15, US English, opt-in. Amazon's stated reason: generative-AI features "rely on the processing power of Amazon's secure cloud". **VERIFIED** (TechCrunch quoting the email). Affected users were moved to "Don't save recordings", and a possible loss of Voice ID was reported. **LIKELY** (Engadget/AppleInsider snippets).
- **Alexa+:** privacy is managed centrally in the Alexa Privacy dashboard. **VERIFIED** (aboutamazon).

---

## 3. Proactive features (Hunches etc.) — important for A.P.A.'s "proactive voice" claim

| Feature | Year | What it does | Source | Conf. |
|---|---|---|---|---|
| **Hunches** (announced) | Sep 2018 | When the user says e.g. "Alexa, good night", Alexa may notice something out of pattern ("your door is still unlocked") and *suggest* an action. Rolled out late 2018 (US) | Event coverage, e.g. https://thenextweb.com/news/here-are-the-upcoming-alexa-features-were-most-excited-about | LIKELY (secondary; no Amazon primary opened) |
| **ProactiveEvents API** | Dec 2018 | Skills can push notifications (schema-constrained, no free text) to users who opted in; Alexa decides delivery | https://developer.amazon.com/en-US/blogs/alexa/alexa-skills-kit/2018/12/proactiveeventsapi-launch-announcement | LIKELY (search snippet) |
| **Acting on Hunches automatically** | Announced Sep 2020, available 10 Dec 2020 | Alexa predicts that the user is **away or asleep** from usage patterns, then turns off lights, sets thermostats to away/sleep temperature, or puts water heaters in energy-saving mode **without being asked**. Opt-in per customer. "Higher quality reports enable better Hunches" (device state/change reports are the input signal) | https://developer.amazon.com/en-US/blogs/alexa/device-makers/2020/12/Enable-Alexa-to-Proactively-Act-on-Hunches | **VERIFIED** |
| Hunches: supported devices | 2021 | Lights, plugs, thermostats; Amazon later clarified that smart locks were not supported for automatic actions | Gizmodo, https://gizmodo.com/alexa-can-now-proactively-act-on-hunches-on-its-own-1846130457 | LIKELY (weak/secondary) |
| Hunches ML ("deep home embeddings") | ~2021–22 | Amazon Science article (S. Eberhardt) on embeddings that aggregate all devices in a home to drive proactive automations | Only a mirror (dev.amazoncloud.cn) found | **UNVERIFIED** |
| **Alexa+ proactivity** | 2025 | "Alexa+ is also proactive when it's important", e.g. suggesting an earlier commute in heavy traffic, or telling the user a gift they wanted is on sale. Memory: "ask her to remember things"; users can share documents, emails and photos | https://www.aboutamazon.com/news/devices/new-alexa-generative-artificial-intelligence | **VERIFIED** |

**Implications for A.P.A. (my analysis, not a sourced claim):**
1. Alexa's proactivity before 2025 was **narrow**: smart-home state prediction (home/away/asleep) built on device telemetry, plus notifications in skill-defined schemas.
2. Alexa+ adds LLM-era proactive *alerts* (traffic, price drops), but Amazon has published no technical paper on how proactive triggers are chosen.
3. A.P.A. should therefore state its proactive scope precisely: which signals it uses, whether it suggests or acts, and how the user opts in. Alexa's own design (suggest by default, act only on opt-in) is a defensible baseline to compare against.

---

## 4. Known limitations documented in the literature

1. **Rigid skill invocation and the developer burden.** The classic model needs developers to enumerate intents, slots and sample utterances (VERIFIED, ASK docs). Users often must name the skill ("Alexa, ask <invocation name> to…"). Amazon's own Alexa Conversations paper says rule-based skills need developers to "code hundreds of dialogue paths" even for simple skills (LIKELY, arXiv 2104.09088).
2. **Domain and skill selection at scale.** Thousands of overlapping skills made routing a research problem in its own right (Shortlister/HypRank, 1,500 domains). This is evidence that the skill paradigm fragments capability (VERIFIED, N18-3003).
3. **Discoverability and the expectation gap.** Luger & Sellen (2016, CHI) describe the gulf between user expectations and what conversational agents can do (LIKELY; title verified, DOI 10.1145/2858036.2858288 resolved to ACM but the page was 403). Cowan et al. (2017, MobileHCI) found that infrequent users cite low trust, privacy worries and unclear capability (LIKELY; DOI 10.1145/3098279.3098539).
4. **Cascaded pipeline.** Errors propagate through wake word → ASR → NLU → dialogue manager → skill → TTS. Each stage is optimised separately, which is why Amazon has repeatedly moved towards end-to-end and joint models (RNN-T on device, Teacher Models, LLM routing). This is my synthesis from the sources above. LIKELY.
5. **Limited multi-step agency before 2025.** Amazon's Alexa+ material presents multi-call API chaining and agentic web navigation as *new* capabilities, which implies the old Alexa lacked them (VERIFIED as Amazon's framing). Amazon itself notes that LLMs "can be unpredictable… sometimes even hallucinate", which motivates grounding (VERIFIED).
6. **No desktop / computer control.** Alexa's action surface is skills, smart-home APIs, routines and (from 2025) web navigation. None of the sources reviewed describe controlling a user's PC applications, files or OS. VERIFIED as absence in the reviewed sources. Do not state it as a universal fact.
7. **Privacy trade-off with cloud dependence.** The 2025 removal of local processing shows that generative features are pulling processing back to the cloud (VERIFIED). Users show privacy resignation (LIKELY, Lau et al. 2018).
8. **No published Alexa+ benchmarks.** Amazon gives no latency or accuracy figures for Alexa+ (VERIFIED absence on both aboutamazon pages).

---

## 5. APA 7 reference list

Acharya, A., et al. (2021). *Alexa Conversations: An extensible data-driven approach for building task-oriented dialogue systems* (arXiv:2104.09088). arXiv. https://arxiv.org/abs/2104.09088

Amazon. (2013, January 24). *Amazon.com announces acquisition of IVONA Software* [Press release]. https://press.aboutamazon.com/2013/1/amazon-com-announces-acquisition-of-ivona-software

Amazon. (2015, June 23). *Amazon Echo now available to all customers* [Press release]. https://press.aboutamazon.com/news-releases/news-release-details/amazon-echo-now-available-all-customers

Amazon. (2020, September 24). *Introducing the all-new Echo family—reimagined, inside and out* [Press release]. https://press.aboutamazon.com/2020/9/introducing-the-all-new-echo-family-reimagined-inside-and-out

Amazon Staff. (2025, February 26). *Introducing Alexa+, the next generation of Alexa* (updated 2026, July 21). About Amazon. https://www.aboutamazon.com/news/devices/new-alexa-generative-artificial-intelligence

Amazon Staff. (2025). *How Amazon rebuilt Alexa with generative AI*. About Amazon. https://www.aboutamazon.com/news/devices/new-alexa-tech-generative-artificial-intelligence

Amazon Developer. (n.d.). *Create the interaction model for your skill*. Alexa Skills Kit documentation. Retrieved November 5, 2026, from https://developer.amazon.com/en-US/docs/alexa/custom-skills/create-the-interaction-model-for-your-skill.html

Amazon Developer. (n.d.). *About custom triggers for routines*. Retrieved November 5, 2026, from https://developer.amazon.com/en-AU/docs/alexa/routines/introduction-to-custom-trigger-for-routines.html

Cowan, B. R., Pantidi, N., Coyle, D., Morrissey, K., Clarke, P., Al-Shehri, S., Earley, D., & Bandeira, N. (2017). "What can I help you with?": Infrequent users' experiences of intelligent personal assistants. In *Proceedings of MobileHCI '17*. ACM. https://doi.org/10.1145/3098279.3098539 *(author list from memory: verify)*

FitzGerald, J., Ananthakrishnan, S., Arkoudas, K., et al. (2022). Alexa Teacher Model: Pretraining and distilling multi-billion-parameter encoders for natural language understanding systems. In *Proceedings of KDD '22*. https://arxiv.org/abs/2206.07808

Grossman, B. (2020, December 10). *Now available: Enable Alexa to proactively act on hunches without customers needing to ask*. Amazon Developer Blog. https://developer.amazon.com/en-US/blogs/alexa/device-makers/2020/12/Enable-Alexa-to-Proactively-Act-on-Hunches

Haeb-Umbach, R., Watanabe, S., Nakatani, T., Bacchiani, M., Hoffmeister, B., Seltzer, M. L., Zen, H., & Souden, M. (2019). Speech processing for digital home assistants: Combining signal processing with deep-learning techniques. *IEEE Signal Processing Magazine, 36*(6), 111–124. https://doi.org/10.1109/MSP.2019.2918706

Kim, Y.-B., Kim, D., Kim, J.-K., & Sarikaya, R. (2018). A scalable neural shortlisting-reranking approach for large-scale domain classification in natural language understanding. In *Proceedings of NAACL-HLT 2018, Vol. 3 (Industry Papers)* (pp. 16–24). ACL. https://doi.org/10.18653/v1/N18-3003

Lau, J., Zimmerman, B., & Schaub, F. (2018). Alexa, are you listening? Privacy perceptions, concerns and privacy-seeking behaviors with smart speakers. *Proceedings of the ACM on Human-Computer Interaction, 2*(CSCW), Article 102. https://doi.org/10.1145/3274371

Lorenzo-Trueba, J., Drugman, T., Latorre, J., Merritt, T., Putrycz, B., Barra-Chicote, R., Moinet, A., & Aggarwal, V. (2019). Towards achieving robust universal neural vocoding. In *Proceedings of Interspeech 2019*. https://arxiv.org/abs/1811.06292

Luger, E., & Sellen, A. (2016). "Like having a really bad PA": The gulf between user expectation and experience of conversational agents. In *Proceedings of CHI '16* (pp. 5286–5297). ACM. https://doi.org/10.1145/2858036.2858288

Parthasarathi, S. H. K., & Strom, N. (2019). *Lessons from building acoustic models with a million hours of speech* (arXiv:1904.01624). arXiv. https://arxiv.org/abs/1904.01624

Ram, A., Prasad, R., Khatri, C., Venkatesh, A., Gabriel, R., Liu, Q., et al. (2018). *Conversational AI: The science behind the Alexa Prize* (arXiv:1801.03604). arXiv. https://arxiv.org/abs/1801.03604

Sarikaya, R. (2017). The technology behind personal digital assistants: An overview of the system architecture and key components. *IEEE Signal Processing Magazine, 34*(1), 67–81. https://doi.org/10.1109/MSP.2016.2617341

Soltan, S., Ananthakrishnan, S., FitzGerald, J., Gupta, R., et al. (2022). *AlexaTM 20B: Few-shot learning using a large-scale multilingual seq2seq model* (arXiv:2208.01448). arXiv. https://arxiv.org/abs/2208.01448

Sun, M., Snyder, D., Gao, Y., Nagaraja, V., Rodehorst, M., Panchapagesan, S., Strom, N., Matsoukas, S., & Vitaladevuni, S. (2017). Compressed time delay neural network for small-footprint keyword spotting. In *Proceedings of Interspeech 2017* (pp. 3607–3611). https://www.isca-archive.org/interspeech_2017/sun17_interspeech.html

TechCrunch. (2025, March 15). *Amazon's Echo will send all voice recordings to the cloud, starting March 28*. https://techcrunch.com/2025/03/15/amazons-echo-will-send-all-voice-recordings-to-the-cloud-starting-march-28 *(secondary/press)*

Amazon Science blog posts (cite only after opening them in a browser, because they did not render for me):
- *Neural text-to-speech makes speech synthesizers much more versatile*. https://amazon.science/blog/neural-text-to-speech-makes-speech-synthesizers-much-more-versatile
- *On-device speech processing makes Alexa faster, lower-bandwidth*. https://amazon.science/blog/on-device-speech-processing-makes-alexa-faster-lower-bandwidth
- *The scalable neural architecture behind Alexa's ability to select skills*. https://amazon.science/blog/the-scalable-neural-architecture-behind-alexas-ability-to-select-skills

---

## 6. Gaps / to-do before submission
- Open the amazon.science posts in a browser and upgrade LIKELY → VERIFIED where they confirm the claims (NTTS, RNN-T on device, Shortlister blog, Hunches ML).
- Find an Amazon primary source for the 2018 Hunches announcement (only secondary press was found).
- Yap acquisition: no primary source found. Mention it only briefly, or drop it.
- Fill in full author lists marked "et al." (Acharya 2021; Soltan 2022; FitzGerald 2022) if your department requires all authors (APA 7 lists up to 20).
