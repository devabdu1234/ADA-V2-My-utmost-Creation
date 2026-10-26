"""Keyless city geocoding + weather. No API keys needed.
Geocode: Nominatim (OSM) with Photon fallback. Weather: Open-Meteo.
"""
import requests

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
PHOTON_URL = "https://photon.komoot.io/api/"
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
UA = {"User-Agent": "APA-V2-Assistant/1.0 (contact: local app)", "Accept-Language": "en"}

WMO = {
    0: "clear sky", 1: "mainly clear", 2: "partly cloudy", 3: "overcast",
    45: "foggy", 48: "icy fog", 51: "light drizzle", 53: "drizzle", 55: "heavy drizzle",
    56: "freezing drizzle", 57: "freezing drizzle", 61: "light rain", 63: "rain",
    65: "heavy rain", 66: "freezing rain", 67: "freezing rain", 71: "light snow",
    73: "snow", 75: "heavy snow", 77: "snow grains", 80: "light showers",
    81: "showers", 82: "violent showers", 85: "snow showers", 86: "snow showers",
    95: "thunderstorm", 96: "storm with hail", 99: "storm with hail",
}


def geocode_city(city):
    """Returns (lat, lon, display_name) or {'error': ...}."""
    city = (city or "").strip()
    if not city:
        return {"error": "No city given."}
    try:
        r = requests.get(NOMINATIM_URL, params={"q": city, "format": "json", "limit": 1},
                         headers=UA, timeout=12)
        hits = r.json()
        if hits:
            return (float(hits[0]["lat"]), float(hits[0]["lon"]),
                    hits[0].get("display_name", city).split(",")[0].strip())
    except Exception as e:
        print(f"[GEOCODE] Nominatim failed: {e}")
    try:
        r = requests.get(PHOTON_URL, params={"q": city, "limit": 1}, timeout=12)
        feats = r.json().get("features", [])
        if feats:
            lon, lat = feats[0]["geometry"]["coordinates"]
            props = feats[0].get("properties", {})
            name = props.get("name", city)
            return (float(lat), float(lon), name)
    except Exception as e:
        print(f"[GEOCODE] Photon failed: {e}")
    return {"error": f"Could not find city '{city}'."}


def fetch_weather(lat, lon):
    """Returns Open-Meteo current + 3-day forecast dict or {'error': ...}."""
    try:
        r = requests.get(OPEN_METEO_URL, params={
            "latitude": lat, "longitude": lon, "timezone": "auto", "forecast_days": 4,
            "current": "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
            "daily": "weather_code,temperature_2m_max,temperature_2m_min",
        }, timeout=15)
        return r.json()
    except Exception as e:
        return {"error": f"Weather fetch failed: {e}"}


def city_weather(city):
    """Full pipeline: geocode -> weather -> widget-ready dict."""
    geo = geocode_city(city)
    if isinstance(geo, dict) and "error" in geo:
        return geo
    lat, lon, name = geo
    wx = fetch_weather(lat, lon)
    if "error" in wx:
        return wx
    cur = wx.get("current", {})
    daily = wx.get("daily", {})
    code = cur.get("weather_code", 0)
    desc = WMO.get(code, "unknown")
    dates = daily.get("time", [])[1:4]
    codes = daily.get("weather_code", [])[1:4]
    his = daily.get("temperature_2m_max", [])[1:4]
    los = daily.get("temperature_2m_min", [])[1:4]
    forecast = [{"date": d[5:], "desc": WMO.get(c, "--"),
                 "lo": round(lo), "hi": round(hi)}
                for d, c, lo, hi in zip(dates, codes, los, his)]
    return {
        "city": name, "temp": round(cur.get("temperature_2m", 0)),
        "feels": round(cur.get("apparent_temperature", 0)),
        "description": desc, "humidity": cur.get("relative_humidity_2m", 0),
        "wind": f"{round(cur.get('wind_speed_10m', 0))} km/h",
        "forecast": forecast, "lat": lat, "lon": lon,
        "markers": [{"label": name.upper()[:16], "lat": lat, "lon": lon, "hot": True}],
    }
