# How Apple's Siri Is Built, End to End: A Source-Graded Literature Review

Prepared for the A.P.A. (voice-first desktop assistant) literature review. Research date: 5 November 2026.

**Confidence labels**
- **VERIFIED**: I opened the source and it states the claim.
- **LIKELY**: the claim comes from a secondary source (press or trade coverage), or from a primary source whose Apple affiliation I could not confirm.
- **UNVERIFIED / INFERENCE**: my own synthesis, or a claim I could not source. Do not cite it as fact.

**A note on sources.** Apple rarely publishes a full architecture of Siri. Its public technical record is a set of separate Apple Machine Learning Research posts, peer-reviewed papers, patents and WWDC/Newsroom material. Treat the pipeline below as a reconstruction from those pieces, not an official blueprint. Wherever a stage has no Apple primary source, that is stated.

---

## 1. Stage-by-stage summary table

| # | Stage | Technique / model | Era | Source (full URL / DOI) | Conf. |
|---|---|---|---|---|---|
| 1 | Origins | SRI's CALO project inside DARPA's PAL program → Siri, Inc. spun off (2007) → acquired by Apple (Apr 2010) → shipped on iPhone 4S (Oct 2011) | 2003–2011 | https://www.sri.com/hoi/siri/ ; https://www.sri.com/hoi/artificial-intelligence-calo/ ; https://www.apple.com/newsroom/2011/10/04Apple-Launches-iPhone-4S-iOS-5-iCloud/ | VERIFIED |
| 1 | Origins: architecture | "Active ontology" execution framework (Cheyer & Guzzoni); intelligent automated assistant patent covering a language interpreter, dialog flow processor, task flows, services orchestration and an output processor | 2005–2019 (filings) | https://patents.google.com/patent/US8677377B2/en ; https://patents.google.com/patent/US10276170B2/en | VERIFIED |
| 1 | Origins: ASR vendor | Nuance supplied speech recognition; publicly confirmed only in May 2013 by Nuance's CEO, never by Apple | 2011–c.2014 | https://www.macrumors.com/2013/05/30/nuance-ceo-confirms-siri-partnership-with-apple/ (search snippet only, not opened) | LIKELY |
| 2 | Wake word | Small DNN acoustic model (5 hidden layers of 32/128/192 units) with a recurrent scoring layer; two passes: the first runs on the Always On Processor (AOP), the second on the main CPU; a "second-chance" threshold; the server re-checks the audio | 2014–2017 → | https://machinelearning.apple.com/research/hey-siri | VERIFIED |
| 2 | Speaker ID | Speaker-vector embeddings: a DNN (4×256 sigmoid layers + a 100-unit linear layer) replaced LDA; 5-phrase explicit enrollment plus implicit enrollment up to 40 vectors | 2018 | https://machinelearning.apple.com/research/personalized-hey-siri | VERIFIED |
| 2 | Speaker ID (FL) | Federated learning with differential privacy to improve on-device speaker verification (6% relative EER gain) | 2020 | https://arxiv.org/abs/2008.02651 (Interspeech 2020; Apple affiliation not shown on the abstract page) | LIKELY |
| 3 | Far-field front end (HomePod) | Multichannel echo cancellation, DNN mask-based residual echo suppression and noise reduction (MCWF), dereverberation, blind source separation, stream selection driven by the "Hey Siri" detector | 2018 | https://machinelearning.apple.com/research/optimizing-siri-on-homepod-in-far-field-settings | VERIFIED |
| 3 | ASR (server era) | Hybrid CNN-HMM acoustic model, n-gram LMs, a WFST decoder on the server; region-specific Geo-LMs | ≤2018 | https://machinelearning.apple.com/research/regionally-specific-language-models | VERIFIED |
| 3 | ASR (on-device) | Speech recognition moves on device; request audio "processed right on their iPhone or iPad by default"; some requests work offline | iOS 15 (2021) | https://www.apple.com/newsroom/2021/06/apple-advances-its-privacy-leadership-with-ios-15-ipados-15-macos-monterey-and-watchos-8/ | VERIFIED |
| 3 | ASR (hybrid rescoring) | On-device ASR plus server-side rescoring with n-gram and neural LMs for entity-heavy queries: 23–35% WER improvement | 2024 | https://machinelearning.apple.com/research/server-side-rescoring (Int. J. Speech Technology) | VERIFIED |
| 4 | NLU (classic) | Language interpreter → intent → task flow, over an active ontology of domain models, vocabulary and service models | 2010 → | https://patents.google.com/patent/US10276170B2/en | VERIFIED (patent describes; production use not confirmed) |
| 4 | NLU (LLM era) | ReALM: reference resolution (conversational, on-screen and background entities) recast as language modeling | 2024 | https://arxiv.org/abs/2403.20329 (SIGDIAL 2024) | VERIFIED |
| 5 | Dialog / answers (LLM era) | Apple Foundation Models (~3B on-device model + a server model on Private Cloud Compute); optional ChatGPT hand-off with user permission | 2024 → | https://arxiv.org/abs/2407.21075 ; https://www.apple.com/newsroom/2024/06/introducing-apple-intelligence-for-iphone-ipad-and-mac/ | VERIFIED |
| 5 | Dialog (2025) | AFM 2025: ~3B on-device model (2-bit quantization-aware training, KV-cache sharing) + a PT-MoE server model; tool calling; Foundation Models framework | 2025 | https://arxiv.org/abs/2507.13575 | VERIFIED |
| 5 | Dialog (2026) | AFM 3 models power "an entirely new version of Siri"; AFM 3 Core Advanced is sparse, 20B total parameters with 1–4B active, on device | 2026 | https://machinelearning.apple.com/research/introducing-third-generation-of-apple-foundation-models | VERIFIED |
| 6 | TTS (classic) | Hybrid unit selection (half-phone units), with a deep mixture density network (MDN) predicting target and concatenation costs; Viterbi search; WSOLA joins; on device | iOS 10–11 (2016–17) | https://machinelearning.apple.com/research/siri-voices ; Capes et al., Interspeech 2017 | VERIFIED |
| 6 | TTS (2019) | "New, more natural" Siri voice (English) | iOS 13 | https://www.apple.com/newsroom/2019/06/apple-previews-ios-13/ (search snippet only) | LIKELY (technique not disclosed) |
| 6 | TTS (2026) | Siri Expressive Voices generated on device by AFM 3 Core Advanced; MOS 4.15 vs 3.87 for the prior TTS system | 2026 | https://machinelearning.apple.com/research/introducing-third-generation-of-apple-foundation-models | VERIFIED |
| 7 | Actions | SiriKit (intents + intents UI extensions, fixed domains) | iOS 10 (2016) | https://www.apple.com/newsroom/2016/06/apple-previews-ios-10-biggest-ios-release-ever/ ; https://developer.apple.com/videos/play/wwdc2016/217/ | LIKELY (search snippets; not opened) |
| 7 | Actions | App Intents + App Shortcuts (zero-setup Siri phrases; entities and queries) | iOS 16 (2022) → | https://developer.apple.com/videos/play/wwdc2022/10032/ ; https://developer.apple.com/videos/play/wwdc2022/10170/ | LIKELY (search snippets; not opened) |
| 8 | Privacy | 2019 grading suspension; audio no longer kept by default; opt-in; random identifier dissociated after 6 months | 2019 | https://www.apple.com/newsroom/2019/08/improving-siris-privacy-protections/ | VERIFIED |
| 8 | Privacy | Local differential privacy (Count Mean Sketch, Hadamard CMS, ε = 4), used for emoji, Safari and new words; the post does not mention Siri | 2017 | https://machinelearning.apple.com/research/learning-with-privacy-at-scale | VERIFIED |
| 8 | Privacy | Private Cloud Compute for larger models | 2024 → | https://www.apple.com/newsroom/2024/06/introducing-apple-intelligence-for-iphone-ipad-and-mac/ | VERIFIED |
| 9 | Limitations | Personalized-Siri features delayed: "take us longer than we thought" (Mar 2025) | 2025 | https://techcrunch.com/2025/03/07/ai-powered-more-personalized-siri-is-delayed/ | LIKELY (press report of an Apple statement) |

---

## 2. Narrative by stage

### 2.1 Origins: SRI, CALO/DARPA PAL, Siri Inc., Apple, Nuance
- SRI led **CALO** (Cognitive Assistant that Learns and Organizes), its part of DARPA's **Personalized Assistant that Learns (PAL)** program. PAL was a five-year, $150 million effort involving more than 300 researchers from 22 institutions. **VERIFIED** (SRI CALO page). SRI calls PAL "the largest-known AI project in U.S. history". **VERIFIED** (SRI Siri page).
- SRI spun off **Siri, Inc. in 2007**. It raised $24 million in two rounds. Apple **acquired Siri in April 2010**, and Siri was unveiled in **October 2011** as a feature of the iPhone 4S. **VERIFIED** (SRI). Some press accounts date the spin-off to 2008. Cite SRI's 2007.
- Apple's 4 October 2011 launch release introduced Siri as an "intelligent assistant". It launched in beta in English (US, UK, Australia), French and German. **VERIFIED** for the release's existence and wording via search snippets of apple.com. I did not open the page itself, so treat the details as **LIKELY**.
- **Architecture lineage (patents).** US 8,677,377 B2 (Cheyer & Guzzoni; filed 2006 with priority to 2005; assigned from SRI to Apple; granted 2014) describes **"active ontologies"**: execution environments made of concept nodes that hold prioritized condition→action rules, linked by channels, with a service broker for web services. US 10,276,170 B2, "Intelligent automated assistant" (Gruber, Cheyer, Keen; priority 2010-01-18; granted 2019), describes multimodal input, a **language interpreter**, a **dialog flow processor**, **task flow models**, **services orchestration** and an **output processor**, all tied together by an active ontology. **VERIFIED** (Google Patents; the patent pages were truncated in my fetch). A patent does not prove a production design, so present these as the documented design lineage.
- **Nuance.** The widely held view is that the speech recognition in early Siri was licensed from Nuance. Neither company confirmed it in 2011. Nuance CEO Paul Ricci publicly confirmed in May 2013 that Nuance was the "fundamental provider of voice recognition" and did not handle Siri's AI layers. **LIKELY**: secondary press (MacRumors, Cult of Mac, AllThingsD D11). I did not open these pages, and Apple never confirmed. When Apple moved to in-house ASR is **UNVERIFIED**. By 2018, Apple's own ML journal describes an in-house hybrid CNN-HMM recognizer (§2.3).

### 2.2 Wake word ("Hey Siri") and speaker recognition
- **Detector (Apple ML Research, Siri Team, Oct 2017).** Audio is sampled at 16 kHz and converted to mel filter-bank frames of about 10 ms. A window of about 20 frames (0.2 s) feeds a **DNN acoustic model** that outputs probabilities over about 20 sound classes. A **recurrent scoring layer** integrates these over time into a phrase score. The hidden layers are 5 of equal width (32, 128 or 192 units). **VERIFIED.**
- **Two-pass, on device.** On iPhone 6S and later, a small first-pass DNN (5×32) runs on the low-power **Always On Processor**. If it fires, the main CPU runs a larger 5×192 DNN. Apple Watch uses a single pass after a wrist raise, with about 5% of its compute. A lower **"second-chance" threshold** keeps the system more sensitive for a few seconds after a near miss. **VERIFIED.**
- **Server re-check.** The audio is forwarded to the server, where the main recognizer runs. If the server hears something else (the article's example is "Hey Seriously"), it sends a cancel signal. The article states that "the main automatic speech recognition" ran in the cloud at that time. The target false-alarm rate was about one per week, with no measured figures given. **VERIFIED.**
- **Personalized Hey Siri (Apr 2018).** Each utterance becomes a **speaker vector**, scored against the user's profile by cosine similarity. Enrollment is explicit (5 phrases), and the profile then grows implicitly up to 40 vectors. A DNN (4×256 sigmoid layers + a 100-unit linear layer, 8-bit weights, trained on 16,000 users) replaced an LDA baseline, cutting EER from 8.0% to 4.3%. End to end, the system reaches 1 false accept per month, 5.2% false rejects and 3.2% imposter accepts. **VERIFIED.**
- **Federated learning.** Granqvist et al. (Interspeech 2020) combine federated learning and differential privacy for on-device speaker verification, with a 6% relative EER gain. **VERIFIED** for the paper's content. **LIKELY** that it is Apple work: the authors include Apple speech researchers, but the abstract page lists no affiliations. Surveys state that Apple uses federated learning for the "Hey Siri" vocal classifier. **LIKELY** (secondary, from Kairouz et al., arXiv 1912.04977; not opened).

### 2.3 Speech recognition (ASR)
- **Server era.** In 2018 Apple described Siri ASR as a **hybrid CNN-HMM acoustic model** (filter-bank features, about 5,000 hours of English), **n-gram language models** and a **WFST decoder**. The LMs were preloaded on servers. **Geo-LMs** cover 169 US combined statistical areas plus one global model, using class-LM slots for local business names. They gave an 18.7% relative WER reduction on local POI search (15.5% → 12.6%), no change on general speech (6.2%), and under 10 ms added latency. **VERIFIED.**
- **Front end for far-field devices (HomePod, 2018).** Six microphones on an A8 chip. The chain is multichannel echo cancellation, DNN-mask residual echo suppression, dereverberation, mask-based online noise reduction, and unsupervised blind source separation, with the "Hey Siri" detector **choosing which stream** goes to ASR. Relative WER gains were about 40–90% depending on the condition, using under 15% of one A8 core. **VERIFIED.**
- **Other acoustic modeling.** Apple has also published work on cross-bandwidth and cross-lingual initialization for new languages and 8 kHz Bluetooth audio (https://machinelearning.apple.com/research/cross-initialization). **LIKELY** (seen in search; not opened).
- **On-device ASR (iOS 15, 2021).** Apple's 7 June 2021 release says request audio is "processed right on their iPhone or iPad by default". Many requests (launching apps, timers and alarms, settings, music control) work without an internet connection. **VERIFIED.** The requirement of an A12 Bionic chip or later is **LIKELY** (press coverage).
- **Hybrid on-device + server (2024).** Zhang, Gondala, Fraga da Silva & Van Gysel (Int. J. Speech Technology, 2024) show that on-device ASR struggles with entity-rich queries. Server-side rescoring with n-gram and sub-word neural LMs improves WER by **23–35%** on entity-centric queries compared with on-device-only recognition. **VERIFIED.** So "on-device" does not mean "server-free" for knowledge queries.
- **2026.** Apple reports that AFM 3 Core Advanced was preferred over the previous system for **dictation** quality (44.7% vs 17.6%). **VERIFIED.** The page does not say whether it replaced Siri's ASR. **UNVERIFIED.**

### 2.4 Natural language understanding (NLU)
- **What Apple has documented.** The patent lineage (US 10,276,170 B2) describes a **language interpreter** that maps input to **intent** using an **active ontology** of domain models, vocabulary, memory and service models. **VERIFIED** as a patent description. There is no Apple ML Research post that specifically documents Siri's production domain/intent classifier or entity resolver. **No Apple primary source found.**
- **Industry-standard framing.** Large-scale assistant NLU is usually described as domain classification → domain-specific intent classification → slot tagging → entity resolution against gazetteers and personal data such as contacts. **LIKELY** as a general description: it comes from non-Apple papers (e.g., arXiv 1804.08064; NAACL 2021 industry track). Do not attribute it to Siri specifically.
- **Entity and knowledge integration.** Apple's 2024 rescoring paper (§2.3) shows that entity knowledge is injected during recognition through server LMs. **VERIFIED.** That Siri uses an Apple "knowledge graph" is **UNVERIFIED**: no Apple primary source found.
- **LLM era.** **ReALM** (Moniz et al., Apple; SIGDIAL 2024) recasts **reference resolution** as language modeling. It covers conversational references, **on-screen entities** and background entities. The smallest model gains over 5% absolute on on-screen references compared with an existing system with similar functionality, and is comparable to GPT-4. The larger models substantially outperform GPT-4. **VERIFIED.** The paper implies that the previous Siri-class system handled on-screen references less well. **INFERENCE.**
- **2024 Apple Intelligence.** Apple promised "richer language-understanding" for Siri: following along when users stumble over words, keeping context between requests, and onscreen awareness. **VERIFIED** (Newsroom).

### 2.5 Dialog management and answer generation
- **Classic design.** The patent describes a dialog flow processor and task flow models with **services orchestration**, which calls external services and assembles the output. **VERIFIED** (patent). The 2011 release lists capabilities that map to fixed domains: calls, messages, email, meetings, reminders, notes, web search, local businesses and directions. **LIKELY** (snippet). How production responses were built from templates is **UNVERIFIED** in Apple primary sources. **INFERENCE**: it is consistent with the patent's task flows and output processor.
- **Apple Intelligence (June 2024).** Siri gains typing, onscreen awareness, personal context from on-device information, "hundreds of new actions" in and across apps, and an optional **ChatGPT** hand-off that asks permission before sending any question, document or photo. Complex requests go to **Private Cloud Compute**, where data is "never retained or exposed". **VERIFIED.**
- **Apple Foundation Models (AFM), 2024.** Gunter et al., arXiv 2407.21075: a ~3B-parameter on-device model and a larger server model on Private Cloud Compute. **VERIFIED.** My fetch of the abstract did not cover adapters or tool use, so those claims about the 2024 report are **UNVERIFIED**.
- **AFM 2025 tech report** (arXiv 2507.13575): a ~3B on-device model with KV-cache sharing and 2-bit quantization-aware training, and a **Parallel-Track Mixture-of-Experts** server model on Private Cloud Compute. Both models are multilingual, understand images and execute **tool calls**. A Swift **Foundation Models framework** offers guided generation, constrained tool calling and LoRA adapters. **VERIFIED.**
- **AFM 3 (June 2026).** The models power "an entirely new version of Siri". AFM 3 Core (~3B, dense) and **AFM 3 Core Advanced** (20B total, 1–4B active, sparse, with experts streamed from flash into DRAM) run on device. AFM 3 Cloud and Cloud Pro run on Private Cloud Compute, and Cloud Pro handles "agentic tool use and complex reasoning". **VERIFIED.** The page does not say which Siri requests are routed to which model.

### 2.6 Speech synthesis (TTS)
- **Pre-iOS 10.** Unit-selection voices. The specific engine is **UNVERIFIED** (no primary source found).
- **iOS 10/11 (Apple ML Research, Aug 2017; Capes et al., Interspeech 2017).** **Hybrid unit selection**: half-phone units cut from at least 15 hours of 48 kHz studio speech (more than 20 hours for the iOS 11 voice). A **deep mixture density network** predicts the feature distributions that set the target and concatenation costs, a Viterbi search picks the units, and **WSOLA** joins them. It runs **on device**. **VERIFIED.**
- **iOS 13 (2019).** Apple advertised a "new, more natural" Siri voice. The underlying technique is not stated in what I retrieved. Press calls it "neural TTS", but that term was not found in an Apple source. **LIKELY** for the announcement; **UNVERIFIED** for the technique.
- **2026.** **Siri Expressive Voices** are generated entirely on device by AFM 3 Core Advanced (1B active). Mean opinion scores were 4.15 vs 3.87 for the previous TTS on general voice, and 4.24 vs 3.82 on conversational voice. **VERIFIED.** This marks a move from a dedicated TTS model to an LLM-based speech generator.

### 2.7 Actions and tools: SiriKit → Shortcuts → App Intents
- **SiriKit (iOS 10, June 2016).** It opened Siri to third-party apps in fixed domains: messaging, calls, photo search, ride booking, payments and workouts. Apps integrate through an **Intents extension** and an **Intents UI extension**. **LIKELY**: Apple Newsroom and WWDC16 session 217, seen only as search snippets.
- **Siri Shortcuts (iOS 12, 2018).** User-defined phrases bound to app actions ("Add to Siri"). **LIKELY**: mentioned in the WWDC22 session snippet; I did not open a 2018 primary source.
- **App Intents (WWDC22, iOS 16).** A Swift framework in which each intent has metadata, **parameters** and a **perform** method, with **entities and queries** for dynamic content. **App Shortcuts** make intents available to Siri, Spotlight and Shortcuts with **zero user setup**. SiriKit intents remain supported for the messaging and media domains. **LIKELY** (Apple developer pages seen only via search snippets).
- **LLM era.** The 2024 release promises "hundreds of new actions in and across" apps. **VERIFIED.** The release does not name App Intents. Linking those actions to App Intents is **LIKELY** but unconfirmed in my sources. The AFM 2025 report confirms that the models support constrained **tool calling**. **VERIFIED.**

### 2.8 Privacy architecture
- **On-device first.** Wake-word detection runs on device (2017). **VERIFIED.** On-device ASR followed in 2021. **VERIFIED.** On-device foundation models plus **Private Cloud Compute** arrived in 2024. **VERIFIED.**
- **Differential privacy (2017).** Local DP uses Count Mean Sketch, Hadamard CMS and Sequence Fragment Puzzle, with ε = 4 for the emoji and Safari use cases. **VERIFIED.** That post does **not** mention Siri, so do not cite it as Siri-specific.
- **2019 grading controversy.** On 28 August 2019, Apple suspended human "grading" of Siri audio. Audio is no longer retained by default (computer-generated transcripts are still used). Audio sharing became opt-in, and only Apple employees may review it. Accidental triggers are deleted. Requests are tied to a random identifier rather than the Apple ID, and data is dissociated from it after six months. **VERIFIED.** The press reports that prompted this (contractors hearing recordings) were not opened by me. **LIKELY.**
- **2026.** Users can opt in to help improve Siri and Apple Intelligence, and private data is not used for training without opt-in. **VERIFIED.**

---

## 3. Known limitations (for comparison with A.P.A.)

| Limitation | Evidence | Conf. |
|---|---|---|
| **Cascaded pipeline**: wake word → ASR → NLU → dialog → TTS as separate models, with a network round-trip for parts of it | 2017 article: the device only wakes Siri, and the main ASR runs in the cloud with a server cancel step. The 2018 ASR runs on servers. The 2024 paper still uses server rescoring for entity queries | VERIFIED (architecture); latency cost is **INFERENCE**: Apple publishes no end-to-end latency figures |
| **Entity-rich queries are hard on device** | 23–35% WER gap closed only by server LMs | VERIFIED |
| **Rigid, predefined intents/domains** | SiriKit was limited to fixed domains; App Shortcuts were capped at a number of predefined shortcuts per app (10, per an enterprise session snippet) | LIKELY |
| **Weak contextual/on-screen reference before the LLM era** | ReALM shows large gains over the "existing system"; Apple's 2024 promises of context-keeping and onscreen awareness imply these were missing | VERIFIED (ReALM result); interpretation is **INFERENCE** |
| **Limited multi-step agency / delivery difficulty** | Apple said personalized Siri would "take us longer than we thought" (March 2025). A June 2025 Federighi interview reportedly cited moving from a "V1" to a "V2" architecture | LIKELY (press reports of Apple statements) |
| **No proactive voice** (Siri speaks only when invoked) | The design is trigger-initiated (wake word / button). No Apple source describes unprompted spoken initiative | INFERENCE / UNVERIFIED |
| **Limited long-term memory** | Personal context in 2024 is drawn from on-device data, not a conversational memory store; the 2019 policy dissociates data after 6 months | VERIFIED (facts); "limited memory" framing is **INFERENCE** |
| **Privacy vs. improvement trade-off** | Human grading was paused in 2019 and became opt-in; improvement data is limited to opt-in users | VERIFIED |

**Gap to note in the review.** I found no peer-reviewed comparative evaluation of Siri's limitations from an Apple author. Independent academic benchmarks of assistants exist but were not retrieved here. Add one, such as a published multi-assistant comparison, if the review needs a third-party empirical source.

---

## 4. Sources I could not open or verify
- Apple Newsroom 2011 iPhone 4S release, 2016 iOS 10 release and 2019 iOS 13 release: seen only as search snippets.
- WWDC16 session 217 and WWDC22 sessions 10032/10170: seen only as search snippets.
- MacRumors / Cult of Mac on Nuance (2013): snippets only.
- Daring Fireball (the original March 2025 statement): not opened; TechCrunch was opened instead.
- Kairouz et al. (arXiv 1912.04977) on Apple's use of federated learning: snippet only.
- The full text of the AFM 2024 report (adapters, tool use): only the abstract was read.

---

## 5. References (APA 7)

Apple Inc. (2011, October 4). *Apple launches iPhone 4S, iOS 5 & iCloud* [Press release]. https://www.apple.com/newsroom/2011/10/04Apple-Launches-iPhone-4S-iOS-5-iCloud/

Apple Inc. (2016, June 13). *Apple previews iOS 10, the biggest iOS release ever* [Press release]. https://www.apple.com/newsroom/2016/06/apple-previews-ios-10-biggest-ios-release-ever/

Apple Inc. (2019, June 3). *Apple previews iOS 13* [Press release]. https://www.apple.com/newsroom/2019/06/apple-previews-ios-13/

Apple Inc. (2019, August 28). *Improving Siri's privacy protections* [Press release]. https://www.apple.com/newsroom/2019/08/improving-siris-privacy-protections/

Apple Inc. (2021, June 7). *Apple advances its privacy leadership with iOS 15, iPadOS 15, macOS Monterey, and watchOS 8* [Press release]. https://www.apple.com/newsroom/2021/06/apple-advances-its-privacy-leadership-with-ios-15-ipados-15-macos-monterey-and-watchos-8/

Apple Inc. (2024, June 10). *Introducing Apple Intelligence for iPhone, iPad, and Mac* [Press release]. https://www.apple.com/newsroom/2024/06/introducing-apple-intelligence-for-iphone-ipad-and-mac/

Apple Machine Learning Research. (2026, June 8). *Introducing the third generation of Apple's foundation models*. https://machinelearning.apple.com/research/introducing-third-generation-of-apple-foundation-models

Apple Developer. (2016). *Introducing SiriKit* [Video, WWDC16 Session 217]. https://developer.apple.com/videos/play/wwdc2016/217/

Apple Developer. (2022). *Dive into App Intents* [Video, WWDC22 Session 10032]. https://developer.apple.com/videos/play/wwdc2022/10032/

Apple Developer. (2022). *Implement App Shortcuts with App Intents* [Video, WWDC22 Session 10170]. https://developer.apple.com/videos/play/wwdc2022/10170/

Audio Software Engineering & Siri Speech Team. (2018, December 3). *Optimizing Siri on HomePod in far-field settings*. Apple Machine Learning Research. https://machinelearning.apple.com/research/optimizing-siri-on-homepod-in-far-field-settings

Capes, T., Coles, P., Conkie, A., Golipour, L., Hadjitarkhani, A., Hu, Q., Huddleston, N., Hunt, M., Li, J., Neeracher, M., Prahallad, K., Raitio, T., Rasipuram, R., Townsend, G., Williamson, B., Winarsky, D., Wu, Z., & Zhang, H. (2017). Siri on-device deep learning-guided unit selection text-to-speech system. In *Proceedings of Interspeech 2017*. [DOI not retrieved. Check the ISCA archive before citing.]

Cheyer, A., & Guzzoni, D. (2014). *Method and apparatus for building an intelligent automated assistant* (U.S. Patent No. 8,677,377 B2). U.S. Patent and Trademark Office. https://patents.google.com/patent/US8677377B2/en

Differential Privacy Team. (2017, December 6). *Learning with privacy at scale*. Apple Machine Learning Research. https://machinelearning.apple.com/research/learning-with-privacy-at-scale

Granqvist, F., Seigel, M., van Dalen, R., Cahill, Á., Shum, S., & Paulik, M. (2020). Improving on-device speaker verification using federated learning with privacy. In *Proceedings of Interspeech 2020*. https://arxiv.org/abs/2008.02651

Gruber, T. R., Cheyer, A. J., & Keen, D. (2019). *Intelligent automated assistant* (U.S. Patent No. 10,276,170 B2). U.S. Patent and Trademark Office. https://patents.google.com/patent/US10276170B2/en

Gunter, T., Wang, Z., Wang, C., Pang, R., Narayanan, A., et al. (2024). *Apple intelligence foundation language models* (arXiv:2407.21075). arXiv. https://doi.org/10.48550/arXiv.2407.21075

Li, E., et al. (2025). *Apple intelligence foundation language models: Tech report 2025* (arXiv:2507.13575). arXiv. https://doi.org/10.48550/arXiv.2507.13575

Moniz, J. R. A., Krishnan, S., Ozyildirim, M., Saraf, P., Ates, H. C., Zhang, Y., & Yu, H. (2024). ReALM: Reference resolution as language modeling. In *Proceedings of SIGDIAL 2024*. https://doi.org/10.48550/arXiv.2403.20329

Siri Speech Recognition Team. (2018, August 9). *Finding local destinations with Siri's regionally specific language models for speech recognition*. Apple Machine Learning Research. https://machinelearning.apple.com/research/regionally-specific-language-models

Siri Team. (2017, August 6). *Deep learning for Siri's voice: On-device deep mixture density networks for hybrid unit selection synthesis*. Apple Machine Learning Research. https://machinelearning.apple.com/research/siri-voices

Siri Team. (2017, October 1). *Hey Siri: An on-device DNN-powered voice trigger for Apple's personal assistant*. Apple Machine Learning Research. https://machinelearning.apple.com/research/hey-siri

Siri Team. (2018, April 16). *Personalized Hey Siri*. Apple Machine Learning Research. https://machinelearning.apple.com/research/personalized-hey-siri

SRI International. (n.d.). *Siri*. Retrieved November 5, 2026, from https://www.sri.com/hoi/siri/

SRI International. (2003, November 17). *Artificial intelligence: CALO*. https://www.sri.com/hoi/artificial-intelligence-calo/

Zhang, D., Gondala, S., Fraga da Silva, T., & Van Gysel, C. (2024). Server-side rescoring of spoken entity-centric knowledge queries for virtual assistants. *International Journal of Speech Technology*. https://machinelearning.apple.com/research/server-side-rescoring [DOI not retrieved]

**Secondary (weak, use only with a caveat):**

MacRumors. (2013, May 30). *Nuance CEO confirms Siri partnership with Apple*. https://www.macrumors.com/2013/05/30/nuance-ceo-confirms-siri-partnership-with-apple/ [Not opened; author not recorded.]

TechCrunch. (2025, March 7). *AI-powered 'more personalized Siri' is delayed*. https://techcrunch.com/2025/03/07/ai-powered-more-personalized-siri-is-delayed/ [Author not recorded.]

*Notes on references.* arXiv DOIs use the standard 10.48550/arXiv.<id> pattern. Apple ML Research blog "authors" are the team bylines shown on the pages; the differential-privacy post's byline was not checked. Add the press articles' author names only after opening the pages.
