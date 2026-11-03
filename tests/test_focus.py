"""Tests for the focus-session decision logic (no Windows, no API key needed)."""
import asyncio

import focus
from focus import EvidenceTracker, FocusEngine, required_span


def test_required_span_scales_with_probability():
    assert required_span(0.5) == 240
    assert required_span(1.0) == 120
    assert required_span(0.75) == 180
    assert required_span(0.1) == 240          # clamped to the minimum


def test_no_nudge_before_span():
    tr = EvidenceTracker(stale_after=75)
    for t in range(0, 240, 30):                # 0..210s of off-task at p=0.5
        assert tr.feed(t, "off_task", 0.5) is False
    assert tr.feed(240, "off_task", 0.5) is True


def test_high_confidence_nudges_sooner():
    tr = EvidenceTracker(stale_after=75)
    nudged_at = None
    for t in range(0, 300, 30):
        if tr.feed(t, "off_task", 1.0):
            nudged_at = t
            break
    assert nudged_at == 120


def test_on_task_or_uncertain_resets_run():
    tr = EvidenceTracker(stale_after=75)
    for t in (0, 30, 60, 90):
        tr.feed(t, "off_task", 1.0)
    tr.feed(120, "uncertain", 0.0)              # breaks the run
    assert tr.feed(150, "off_task", 1.0) is False
    assert tr.feed(240, "off_task", 1.0) is False   # stale gap (>75s) also resets
    assert tr.progress(240) == 0.0


def test_low_probability_does_not_count():
    tr = EvidenceTracker(stale_after=75)
    for t in range(0, 600, 30):
        assert tr.feed(t, "off_task", 0.4) is False


def test_cooldown_between_nudges():
    tr = EvidenceTracker(stale_after=75)
    fired = [t for t in range(0, 400, 10) if tr.feed(t, "off_task", 1.0)]
    assert fired[0] == 120
    assert fired[1] - fired[0] >= focus.NUDGE_COOLDOWN


class FakeClock:
    def __init__(self):
        self.t = 1000.0

    def __call__(self):
        return self.t


def make_engine(results, clock, events):
    it = iter(results)

    def classify(jpeg, task, app, title):
        return next(it)

    return FocusEngine(classify=classify, capture=lambda: b"jpeg",
                       app_info=lambda: ("chrome.exe", "YouTube"),
                       is_locked=lambda: False,
                       on_event=lambda k, d: events.append((k, d)),
                       clock=clock, history_file=None)


def run_for(engine, clock, seconds):
    async def go():
        for _ in range(int(seconds)):
            clock.t += 1
            await engine.tick()
    asyncio.run(go())


def test_engine_nudges_after_sustained_distraction():
    clock, events = FakeClock(), []
    off = {"label": "off_task", "p_off": 1.0, "confidence": 0.9, "reason": "watching videos"}
    eng = make_engine([off] * 50, clock, events)
    eng.start("write report", minutes=30)
    run_for(eng, clock, 200)
    kinds = [k for k, _ in events]
    assert "focus_nudge" in kinds
    nudge = next(d for k, d in events if k == "focus_nudge")
    assert "write report" in nudge["text"]


def test_dev_mode_runs_clock_four_times_faster():
    clock, events = FakeClock(), []
    on = {"label": "on_task", "p_off": 0.0, "confidence": 0.9, "reason": "editing doc"}
    eng = make_engine([on] * 50, clock, events)
    eng.start("study", minutes=1, dev_mode=True)
    run_for(eng, clock, 16)                    # 16 real s * 4 = 64 session s > 60
    assert eng.session is None
    ended = next(d for k, d in events if k == "focus_ended")
    assert ended["reason"] == "completed"


def test_lock_and_sleep_end_session_without_resume():
    clock, events = FakeClock(), []
    eng = make_engine([], clock, events)
    eng.start("study")
    eng.is_locked = lambda: True
    run_for(eng, clock, 2)
    assert eng.session is None

    eng.is_locked = lambda: False
    eng.start("study")
    clock.t += 500                             # PC slept
    asyncio.run(eng.tick())
    assert eng.session is None
    reasons = [d["reason"] for k, d in events if k == "focus_ended"]
    assert reasons == ["locked", "sleep"]


def test_pause_stops_clock():
    clock, events = FakeClock(), []
    eng = make_engine([], clock, events)
    eng.classify = None
    eng.start("study", minutes=5)
    eng.pause()
    run_for(eng, clock, 100)
    assert eng.state()["elapsed"] == 0
    eng.resume()
    run_for(eng, clock, 10)
    assert 9 <= eng.state()["elapsed"] <= 11
