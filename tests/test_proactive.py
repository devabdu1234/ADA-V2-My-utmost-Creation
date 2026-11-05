"""Tests for the proactive interruption gates (no API key needed)."""
import time

from proactive import ActivitySignals, ProactiveEngine

URGENT = {"subject": "URGENT: exam result deadline", "priority": "High",
          "is_escalated": True, "confidence": 0.9}


def _engine(tmp_path):
    return ProactiveEngine(evidence_file=str(tmp_path / "log.jsonl"))


def _present_user():
    s = ActivitySignals()
    s.last_voice_activity = time.time()   # user active recently, mic closed
    return s


def test_urgent_email_speaks_when_user_free(tmp_path):
    d = _engine(tmp_path).decide([URGENT], _present_user())
    assert d["action"] == "speak" and d["gates"] == []


def test_focus_session_defers_urgent_email(tmp_path):
    s = _present_user()
    s.busy_until = time.time() + 600      # focus session running
    d = _engine(tmp_path).decide([URGENT], s)
    assert d["action"] == "defer"
    assert d["gates"] == ["user_focusing"]
