"""God's Eye parsing + computer-control safety gates (no network, no Windows needed)."""
import asyncio

import computer_bridge as cb
import gods_eye


class Resp:
    def __init__(self, data, status=200):
        self._d, self.status_code = data, status

    def json(self):
        return self._d


def test_flights_parses_opensky(monkeypatch):
    monkeypatch.setattr(gods_eye, "geocode_city", lambda p: (6.93, 79.86, "Colombo"))
    states = [
        ["abc123", "ULK225 ", "Sri Lanka", 0, 0, 79.9, 7.0, 3000, False, 200, 90, 5, None, 3100, None, False, 0],
        ["def456", "", "India", 0, 0, 80.5, 7.5, None, True, 0, 0, 0, None, None, None, False, 0],
        ["ghi789", "QTR668", "Qatar", 0, 0, None, None, 9000, False, 250, 10, 0, None, 9100, None, False, 0],
    ]
    monkeypatch.setattr(gods_eye.requests, "get", lambda *a, **k: Resp({"states": states}))
    res = gods_eye.scan("flights", "Colombo", 200)
    assert res["layer"] == "flights"
    assert [i["callsign"] for i in res["items"]] == ["ULK225", "DEF456"]   # no-position plane dropped
    assert res["items"][0]["speed_kmh"] == 720 and res["items"][0]["alt_m"] == 3100
    assert res["markers"][0]["hot"] and "2 aircraft" in res["summary"]


def test_flights_rate_limited(monkeypatch):
    monkeypatch.setattr(gods_eye, "geocode_city", lambda p: (6.93, 79.86, "Colombo"))
    monkeypatch.setattr(gods_eye.requests, "get", lambda *a, **k: Resp({}, 429))
    assert "rate-limiting" in gods_eye.flights("Colombo")["error"]


def test_earthquakes_sorted_by_magnitude(monkeypatch):
    feats = [{"geometry": {"coordinates": [140, 35, 10]}, "properties": {"place": "Japan", "mag": 4.1, "time": 1}},
             {"geometry": {"coordinates": [-70, -30, 30]}, "properties": {"place": "Chile", "mag": 6.2, "time": 2}}]
    monkeypatch.setattr(gods_eye.requests, "get", lambda *a, **k: Resp({"features": feats}))
    res = gods_eye.scan("earthquakes")
    assert res["items"][0]["place"] == "Chile" and "M6.2" in res["summary"]


def test_unknown_layer():
    assert "error" in gods_eye.scan("aliens")


def test_emergency_stop_blocks_actuators(monkeypatch):
    monkeypatch.setattr(cb, "_hide_ada", lambda: None)
    cb.resume_control()
    asyncio.run(cb.call_computer_tool("computer_emergency_stop"))
    assert cb.is_stopped()
    out = asyncio.run(cb.call_computer_tool("computer_type", {"text": "hi"}))
    assert out["is_error"] and "EMERGENCY STOP" in out["texts"][0]
    cb.resume_control()
    assert not cb.is_stopped()


def test_unknown_tool_refused():
    out = asyncio.run(cb.call_computer_tool("computer_format_disk"))
    assert out["is_error"] and "not permitted" in out["texts"][0]


def test_resolve_path_forgiving(tmp_path, monkeypatch):
    monkeypatch.setattr(cb.os.path, "expanduser", lambda p: str(tmp_path))
    (tmp_path / "OneDrive" / "Desktop" / "assingment").mkdir(parents=True)
    got = cb._resolve_path("Desktop/assignment")       # user's spelling differs
    assert got and got.endswith("assingment")
    assert cb._resolve_path("Desktop/nothing-here-xyz") is None


def test_coordinates_scale_back_to_native():
    cb._state["scale"] = 0.5
    assert cb._to_native(640, 360) == (1280, 720)
    cb._state["scale"] = 1.0
