"""Proactive Interruption Engine.

Turns A.P.A's email monitor into an attention-policy agent: every high-priority
email is scored for interrupt-worthiness before the decision to speak is made,
and every decision is persisted as research evidence (JSONL).

Policy sketch (Horvitz 1999, cost-of-interruption):
    score = urgency x confidence x relevance / (1 + social_cost)

Speak only when score >= threshold AND the mic is free AND no recent failure.
Values live in POLICY; tune margins there, not in call sites.
"""

import json
import os
import time
from datetime import datetime

POLICY = {
    "interrupt_threshold": 6.0,
    "cooldown_seconds": 600,       # never interrupt twice within 10 min
    "max_spoken_daily": 5,         # hard cap on spoken interruptions per day
    "weights": {
        "escalated": 4.0, "high": 3.0, "medium": 1.0, "low": 0.2,
        "confidence": 3.0,           # multiplier weight: w * mean(confidence)
        "relevance": 2.0, "social": 1.5,
    },
    "penalty_no_relevance": 1.5,
    "focus_penalties": {
        "low": 0.05,    # Routine tasks: minimal impact
        "medium": 0.3,  # Analytical: noticeable resumption lag
        "high": 0.8,    # Deep Work: high attention residue
    }
}

EVIDENCE_FILE = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "proactive_log.jsonl"
)


class ActivitySignals:
    """Cheap runtime signals about what the user is doing right now."""

    def __init__(self):
        self.last_voice_activity = 0.0    # time.time() of last mic open
        self.mic_open = False             # is ADA currently listening to speech
        self.model_speaking = False       # is ADA talking (never barge in)
        self.text_active = False          # user typing in chat box
        self.last_text_activity = 0.0
        self.busy_until = 0.0             # future timestamp = user busy

    @property
    def micro_activity(self):
        """True while a mic/text interaction happened in the last 90 seconds."""
        now = time.time()
        return (
            self.mic_open
            or self.text_active
            or (now - self.last_voice_activity) < 90
            or (now - self.last_text_activity) < 90
        )


def relevance_from_keywords(subject, keywords):
    s = (subject or "").lower()
    return any(k in s for k in keywords)


def compute_breakpoints(analysis, signals, policy=POLICY):
    """Score one analyzed email; returns (score, factors, should_speak).

    urgency   : escalated? priority weight, else 0
    confidence: model self-reported confidence (0..1) scaled by weight
    relevance : subject matches user-declared keywords, minus penalty if not
    social    : active micro-interaction => interrupt NOW is natural; silence
                (e.g., user away from desk) => lower naturalness
    focus     : baseline user-focus penalty (~1/focus) folded into social
    """
    w = policy["weights"]
    priority = (analysis.get("priority") or "Medium").lower()
    urgency = 0.0
    if analysis.get("is_escalated"):
        urgency = w["escalated"]
    else:
        urgency = w.get(priority, 0.0)

    confidence = analysis.get("confidence", 0.5)
    try:
        confidence = float(confidence)
    except (TypeError, ValueError):
        confidence = 0.5

    relevance_hits = [k for k in KEYWORDS if k in (analysis.get("subject") or "").lower()]
    relevance = w["relevance"] * (1 if relevance_hits else 0) - (
        policy["penalty_no_relevance"] if not relevance_hits else 0
    )

    social = w["social"] * (1 if signals.micro_activity else 0)

    focus = 0.5  # Horvitz reuse penalty for grabbing attention
    score = (
        urgency
        + w["confidence"] * confidence
        + relevance
        + social
        - focus
    )
    factors = {
        "urgency": round(urgency, 2),
        "confidence": round(w["confidence"] * confidence, 2),
        "relevance": round(relevance, 2),
        "social": round(social, 2),
        "focus": focus,
        "keyword_hits": relevance_hits,
    }
    should_speak = score >= policy["interrupt_threshold"]
    return round(score, 2), factors, should_speak


KEYWORDS = ["urgent", "deadline", "exam", "meeting", "asap", "submission", "result"]


class ProactiveEngine:
    """Stateful wrapper: cooldown, daily cap, evidence log, decisions."""

    def __init__(self, policy=None, evidence_file=EVIDENCE_FILE):
        self.policy = dict(POLICY if policy is None else policy)
        self.evidence_file = evidence_file
        self._last_interrupt_ts = 0.0
        self._spoken_today = 0
        self._day_stamp = datetime.now().strftime("%Y-%m-%d")
        self.stats = {"decisions": 0, "speak": 0, "defer": 0, "silence": 0}

    def _rollover_day(self):
        today = datetime.now().strftime("%Y-%m-%d")
        if today != self._day_stamp:
            self._day_stamp = today
            self._spoken_today = 0

    def cooldown_active(self):
        return (time.time() - self._last_interrupt_ts) < self.policy["cooldown_seconds"]

    def daily_cap_reached(self):
        self._rollover_day()
        return self._spoken_today >= self.policy["max_spoken_daily"]

    def _log_evidence(self, record):
        try:
            record["ts"] = datetime.now().isoformat(timespec="seconds")
            with open(self.evidence_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
        except Exception as e:
            print(f"[PROACTIVE] Evidence log failed: {e}")

    def decide(self, emails, signals):
        """Score a batch of analyzed emails; return the winning interrupt or None.

        A spoken interruption additionally requires: cooldown clear, daily cap
        clear, mic not currently open with speech, and ADA not itself speaking.
        Widget surfacing is always allowed regardless.
        """
        self._rollover_day()
        best = None
        for e in emails:
            score, factors, _ = compute_breakpoints(e, signals, self.policy)
            rec = {
                "event": "score",
                "subject": (e.get("subject") or "")[:80],
                "priority": e.get("priority"),
                "escalated": e.get("is_escalated", False),
                "confidence": e.get("confidence"),
                "score": score,
                "factors": factors,
            }
            self._log_evidence(rec)
            if best is None or score > best[0]:
                best = (score, e, factors)

        if not best:
            return None

        score, email, factors = best
        gate_reasons = []
        if score < self.policy["interrupt_threshold"]:
            gate_reasons.append("below_threshold")
        if not signals.micro_activity:
            gate_reasons.append("user_absent")
        if not (email.get("is_escalated") or (email.get("priority") or "").lower() == "high"):
            gate_reasons.append("low_urgency")
        if self.cooldown_active():
            gate_reasons.append("cooldown")
        if self.daily_cap_reached():
            gate_reasons.append("daily_cap")
        if signals.mic_open:
            gate_reasons.append("user_speaking")
        if signals.model_speaking:
            gate_reasons.append("ada_speaking")

        action = "speak" if not gate_reasons else ("defer" if score >= self.policy["interrupt_threshold"] else "silence")
        self.stats[action] += 1
        self.stats["decisions"] += 1
        if action == "speak":
            self._last_interrupt_ts = time.time()
            self._spoken_today += 1

        self._log_evidence({
            "event": "decision",
            "action": action,
            "subject": (email.get("subject") or "")[:80],
            "score": score,
            "gates": gate_reasons,
        })
        return {
            "email": email,
            "score": score,
            "action": action,
            "gates": gate_reasons,
            "factors": factors,
        }


def build_spoken_prompt(email, score=0):
    """One-line directive ADA says when she decides to interrupt."""
    frm = (email.get("from") or "someone").split("<")[0].strip() or "someone"
    subj = (email.get("subject") or "an email").strip()
    return (
        f"System Event: Proactive interrupt authorized (score {score}). "
        f"Interrupt the user with ONE short sentence: a high-priority email from {frm} "
        f"about '{subj}' just arrived. Do not answer it, do not read the full body, "
        f"do not continue any previous conversation. After the sentence, stop."
    )
