# Research 2.0: APA as an All-in-One Personal Assistant

**What changed:** the first research round mostly studied one feature, which was when and how APA interrupts you about emails. APA is actually an **all-in-one personal assistant**. It talks with you, controls your computer, uses tools, helps without being asked, remembers context, and has to stay safe and private.

There are 12 papers below. Papers 1–11 come from the **Reference Table** (`research/ADA_V2_Literature_Review_Matrix.xlsx`), and the row numbers match that table. Paper 12 is new and is not in that table. There is one paper for each thing an all-in-one assistant needs to do. No formulas, just plain explanations.

9 of the 12 are peer-reviewed. 3 are preprints (Moshi, MemGPT, Personal LLM Agents) and are labelled as such. The full comparison with Siri and Alexa, and the novelty analysis, are in [Literature_Review_Analysis.md](Literature_Review_Analysis.md).

The links and highlighted screenshots of each paper are in [Paper_Links_and_Screenshots.md](Paper_Links_and_Screenshots.md).

| # | APA capability | Paper | Year |
|---|---|---|---|
| 1 | Talks naturally (voice) | Moshi (Défossez et al.) | 2024 |
| 2 | Does tasks by voice | GPTVoiceTasker (Vu et al.) | 2024 |
| 3 | Thinks, then acts | ReAct (Yao et al.) | 2023 |
| 4 | Uses tools | Toolformer (Schick et al.) | 2023 |
| 5 | Controls Windows apps | UFO (Zhang et al.) | 2025 |
| 6 | Uses a real computer | OSWorld (Xie et al.) | 2024 |
| 7 | Helps without being asked | User expectations of proactive AI (Meurisch et al.) | 2020 |
| 8 | Remembers you | MemGPT (Packer et al.) | 2023 |
| 9 | Stays safe from tricks | Indirect prompt injection (Greshake et al.) | 2023 |
| 10 | Respects privacy | "Alexa, are you listening?" (Lau et al.) | 2018 |
| 11 | Self-monitoring and reflection | Generative Agents (Park et al.) | 2023 |
| 12 | All-in-one personal assistant | Personal LLM Agents survey (Li et al.) | 2024 |

---

## 1. Moshi: talking in real time (2024)
*Défossez et al., arXiv preprint. https://doi.org/10.48550/arXiv.2410.00037 (Table row 52)*

- **In simple words:** Most voice assistants work in three steps. They turn your speech into text, think in text, then turn the reply back into speech. Each step adds delay, and the tone of voice gets lost along the way. Moshi is a single model that listens and speaks at the same time, like a real conversation.
- **What they found:** The reply delay is about 200 milliseconds, which is close to human conversation speed.
- **Why it matters for APA:** APA's voice uses the same idea: Gemini's native audio model hears and speaks directly, with no text-to-speech chain. This paper explains why that makes APA feel natural. One difference: Moshi is full-duplex (it listens while it talks). APA is half-duplex: its mic is muted while it speaks, so you can't interrupt it by voice yet. The speech model is Google's, not APA's own.

## 2. GPTVoiceTasker: doing phone tasks by voice (2024)
*Vu, Wang, Chen, Li et al., UIST 2024. https://doi.org/10.1145/3654777.3676356 (arXiv version: https://arxiv.org/abs/2401.14268) (row 73)*

- **In simple words:** You say what you want, and an AI assistant taps through the phone's screens for you. It also learns from the commands you have given before.
- **What they found:** In a user study, people completed multi-step tasks about **35% more efficiently**.
- **Why it matters for APA:** This is the closest match to APA's "say it and it happens" idea. The difference is that it works on Android phones, while APA works on a Windows desktop with native voice.

## 3. ReAct: think a little, act a little (2023)
*Yao et al., ICLR 2023. https://arxiv.org/abs/2210.03629 (row 68)*

- **In simple words:** The AI works in a loop. It thinks about what to do, takes one action, looks at the result, and then thinks again. This beats planning everything up front or acting blindly.
- **What they found:** Grounding each step in what actually happened made the AI more successful and made its behaviour easier to follow.
- **Why it matters for APA:** APA's computer control rule, "look first, act one step at a time", is exactly this loop. APA takes a screenshot, makes one click, then checks again.

## 4. Toolformer: AI that learns to use tools (2023)
*Schick et al., NeurIPS 2023. https://arxiv.org/abs/2302.04761 (row 67)*

- **In simple words:** A language model learns by itself when to call a calculator, a search engine, a translator or a calendar instead of guessing the answer.
- **What they found:** Using tools made it better at tasks while it kept its normal language skills.
- **Why it matters for APA:** This is the idea behind "function calling". APA has about 20 tools (email, weather, maps, God's Eye, computer control, focus sessions). One difference is that APA's tools have real effects, such as sending an email or clicking, so they need safety rules.

## 5. UFO: an AI agent for Windows (2025)
*Zhang et al. (Microsoft), NAACL 2025, pp. 597–622. https://doi.org/10.18653/v1/2025.naacl-long.26 (arXiv version: https://arxiv.org/abs/2402.07939) (row 75)*

- **In simple words:** An AI that operates Windows applications for you. It reads the screen through screenshots and Windows UI Automation, then clicks and types across different apps.
- **What they found:** It completed tasks that span several apps across 9 Windows applications. The paper body describes a 50-request benchmark (WindowsBench). That number is not in the abstract, so cite the paper body if you quote it.
- **Why it matters for APA:** It is the closest system to APA's computer control, and APA uses the same Windows UI Automation approach. APA adds real-time voice, a pointing buddy (Bluey) and an **emergency stop**.

## 6. OSWorld: how good are AI agents on real computers? (2024)
*Xie et al., NeurIPS 2024, Datasets and Benchmarks Track. https://arxiv.org/abs/2404.07972 (row 74)*

- **In simple words:** A test set of 369 real computer tasks on Windows, macOS and Ubuntu, used to see whether AI agents can actually finish them.
- **What they found:** The best AI finished about **12%** of tasks and humans finished about **72%**. AIs mostly fail at finding the right thing on screen.
- **Why it matters for APA:** It shows that computer control is still hard. That is why APA keeps a human in the loop and has an emergency stop. It also gives APA a fair way to measure its own success rate later, which APA doesn't have yet.

## 7. What do people expect from a proactive AI? (2020)
*Meurisch et al., Proc. ACM IMWUT. https://doi.org/10.1145/3432193 (row 26)*

- **In simple words:** Researchers tracked 272 people in daily life and asked them, at the right moments, how much they wanted an AI to step in. The answers ranged from "do nothing" to "just do it for me".
- **What they found:** It depends on the person and the situation. There is no single right level of proactivity, so users should be able to adjust it.
- **Why it matters for APA:** APA speaks up on its own (urgent emails, focus nudges). This paper supports letting users tune how pushy APA is, through APA's threshold, cooldown and daily cap.

## 8. MemGPT: giving AI a long-term memory (2023)
*Packer et al., arXiv. https://doi.org/10.48550/arXiv.2310.08560 (row 88)*

- **In simple words:** An AI can only "see" a limited amount of text at once. MemGPT manages memory the way a computer's operating system does: important things stay close, and older things are stored and fetched back when needed.
- **What they found:** It lets the AI handle long documents and remember earlier conversations across sessions.
- **Why it matters for APA:** A real personal assistant should remember you, such as your preferences, past tasks and contacts. This is the reference design for adding memory to APA, with a privacy boundary around it.

## 9. Hidden instructions can hijack AI apps (2023)
*Greshake et al., AISec '23. https://doi.org/10.1145/3605764.3623985 (row 65)*

- **In simple words:** An attacker hides instructions inside a web page, email or document. When the AI reads that content, it may obey those hidden instructions instead of the user.
- **What they found:** Real AI apps could be tricked into leaking data, making unauthorised actions and even spreading the attack.
- **Why it matters for APA:** APA reads emails and reads your screen, and both can contain attacker text. This is why APA's system prompt says screen text is information, never instructions, and why sensitive actions need confirmation.

## 10. "Alexa, are you listening?" Privacy and smart speakers (2018)
*Lau, Zimmerman & Schaub, Proc. ACM HCI (CSCW). https://doi.org/10.1145/3274371 (row 84)*

- **In simple words:** A privacy study with 17 smart-speaker users, who kept a diary and were interviewed, and 17 non-users, who were interviewed only.
- **What they found:** Users had few worries, only partly understood what was recorded, and rarely used the privacy controls.
- **Why it matters for APA:** APA hears your voice and sees your screen and inbox. Users won't protect themselves through settings, so privacy has to be **built into APA's design**. APA already sends audio only when you speak (the voice gate) and keeps credentials out of the code. It does **not** keep data local yet: voice, screenshots and email content are sent to Google's cloud. This is a stated limitation and a design goal, not a current feature.

## 11. Generative Agents: remembering and reflecting on itself (2023)
*Park et al., UIST 2023. https://arxiv.org/abs/2304.03442 (row 89)*

- **In simple words:** AI characters keep a diary of everything they experience. They regularly turn those memories into bigger "lessons" (reflections) and use them to plan their day.
- **What they found:** Observation, planning and reflection each mattered. Removing any one of them made the agents behave much less believably.
- **Why it matters for APA:** This is the blueprint for APA's future local "brain". APA would remember what it did, reflect on whether it worked, and plan better next time. This is **self-monitoring**, not human-style self-awareness, which no AI has and which you shouldn't claim.

## 12. Personal LLM Agents: the all-in-one personal assistant (2024)
*Li et al., arXiv. https://arxiv.org/abs/2401.05459 (new paper, not in the original Reference Table)*

- **In simple words:** A large survey of AI assistants that are tied to your personal data and devices and help with everything in daily life. It draws on opinions from domain experts.
- **What they found:** Old assistants (Siri-style) were limited. LLM-based personal agents are expected to become a major way people use software. The main challenges are capability, efficiency and security.
- **Why it matters for APA:** It shows that **"all-in-one personal assistant" is a recognised research area**, and APA fits right in it. APA's features match the survey's core abilities (doing tasks, sensing context, memory), and its challenges match ours (local vs cloud brain, security).

---

## The big picture: what these 12 papers say together
- **Each piece already exists on its own:** natural voice (1), voice task control (2), tool use (3, 4), Windows/computer control (5, 6), proactivity (7), memory (8).
- **None of them puts everything in one assistant** that you talk to naturally, that controls the desktop, uses tools, helps at the right moment, and stays safe (9) and private (10).
- **Possible research direction (team to discuss):** APA as an integrated, voice-first, all-in-one desktop assistant, and how combining these abilities affects what users get done, how much they trust it, and how safe it is.

*Status (5 Nov 2026): all 12 papers were independently checked against their official abstracts and publisher records. They exist, and every number quoted here matches. Citations were corrected where needed (UFO is now NAACL 2025; GPTVoiceTasker uses the ACM author order). Read the full texts before quoting numbers that are not in the abstracts.*

*Closest prior work to add when discussing novelty (see [Literature_Review_Analysis.md](Literature_Review_Analysis.md)): LookOut (Horvitz, CHI 1999) already offered voice help about emails, timed by the user's attention. Intent Assistant (CHI 2026) already nudges users based on screenshots. Don't claim either idea as a first.*
