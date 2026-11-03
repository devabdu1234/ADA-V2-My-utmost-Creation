"""God's Eye: live world feeds for A.P.A's globe. All free, no API keys.

Layers
  flights      live aircraft around a place   (OpenSky Network, anonymous)
  earthquakes  quakes M2.5+ in the last 24h    (USGS GeoJSON feed)
  iss          the International Space Station (wheretheiss.at)

Each function returns a widget-ready dict:
  {layer, center:{name,lat,lon}, items:[...], markers:[{label,lat,lon,hot}], summary}
or {"error": "..."}.
"""
import math

import requests

from weather_service import geocode_city

UA = {"User-Agent": "APA-V2-Assistant/1.0 (student project)"}
OPENSKY = "https://opensky-network.org/api/states/all"
USGS = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson"
ISS = "https://api.wheretheiss.at/v1/satellites/25544"


def _km(lat1, lon1, lat2, lon2):
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _center(place):
    if not place:
        return None
    geo = geocode_city(place)
    if isinstance(geo, dict):
        return geo
    lat, lon, name = geo
    return {"name": name, "lat": lat, "lon": lon}


def flights(place, radius_km=200, limit=40):
    c = _center(place)
    if c is None:
        return {"error": "Tell me where to scan for flights."}
    if "error" in c:
        return c
    radius_km = max(30, min(600, float(radius_km or 200)))
    dlat = radius_km / 111.0
    dlon = radius_km / (111.0 * max(0.2, math.cos(math.radians(c["lat"]))))
    try:
        r = requests.get(OPENSKY, params={"lamin": c["lat"] - dlat, "lamax": c["lat"] + dlat,
                                          "lomin": c["lon"] - dlon, "lomax": c["lon"] + dlon},
                         headers=UA, timeout=20)
        if r.status_code == 429:
            return {"error": "The flight network is rate-limiting us. Try again in a minute."}
        states = r.json().get("states") or []
    except Exception as e:
        return {"error": f"Flight scan failed: {e}"}
    items = []
    for s in states:
        lon, lat = s[5], s[6]
        if lat is None or lon is None:
            continue
        items.append({
            "callsign": (s[1] or "").strip() or s[0].upper(),
            "country": s[2],
            "lat": lat, "lon": lon,
            "alt_m": round(s[13] or s[7] or 0),
            "speed_kmh": round((s[9] or 0) * 3.6),
            "heading": round(s[10] or 0),
            "climb": round(s[11] or 0, 1),
            "on_ground": bool(s[8]),
            "dist_km": round(_km(c["lat"], c["lon"], lat, lon)),
        })
    items.sort(key=lambda x: x["dist_km"])
    items = items[:limit]
    airborne = [i for i in items if not i["on_ground"]]
    markers = [{"label": c["name"].upper()[:16], "lat": c["lat"], "lon": c["lon"], "hot": True}] + \
              [{"label": i["callsign"], "lat": i["lat"], "lon": i["lon"]} for i in items[:6]]
    return {"layer": "flights", "center": c, "radius_km": radius_km, "items": items, "markers": markers,
            "summary": f"{len(items)} aircraft within {int(radius_km)} km of {c['name']} ({len(airborne)} airborne)."}


def earthquakes(place=None, radius_km=2000, limit=25):
    try:
        feats = requests.get(USGS, headers=UA, timeout=20).json().get("features", [])
    except Exception as e:
        return {"error": f"Earthquake feed failed: {e}"}
    c = _center(place) if place else None
    if c and "error" in c:
        c = None
    items = []
    for f in feats:
        lon, lat, depth = f["geometry"]["coordinates"]
        p = f["properties"]
        it = {"place": p.get("place") or "unknown", "mag": p.get("mag"), "lat": lat, "lon": lon,
              "depth_km": round(depth or 0), "time": p.get("time"), "tsunami": bool(p.get("tsunami"))}
        if c:
            it["dist_km"] = round(_km(c["lat"], c["lon"], lat, lon))
            if it["dist_km"] > radius_km:
                continue
        items.append(it)
    items.sort(key=lambda x: -(x["mag"] or 0))
    items = items[:limit]
    center = c or ({"name": items[0]["place"], "lat": items[0]["lat"], "lon": items[0]["lon"]} if items else
                   {"name": "Earth", "lat": 0, "lon": 0})
    markers = [{"label": f"M{i['mag']:.1f}", "lat": i["lat"], "lon": i["lon"], "hot": n == 0}
               for n, i in enumerate(items[:7]) if i["mag"] is not None]
    where = f" within {int(radius_km)} km of {c['name']}" if c else " worldwide"
    top = f" Strongest: M{items[0]['mag']} {items[0]['place']}." if items else ""
    return {"layer": "earthquakes", "center": center, "items": items, "markers": markers,
            "summary": f"{len(items)} earthquakes M2.5+ in the last 24 h{where}.{top}"}


def iss():
    try:
        d = requests.get(ISS, headers=UA, timeout=15).json()
    except Exception as e:
        return {"error": f"ISS tracker failed: {e}"}
    lat, lon = d["latitude"], d["longitude"]
    item = {"name": "ISS", "lat": lat, "lon": lon, "alt_km": round(d.get("altitude", 0)),
            "speed_kmh": round(d.get("velocity", 0)), "visibility": d.get("visibility", "")}
    return {"layer": "iss", "center": {"name": "International Space Station", "lat": lat, "lon": lon},
            "items": [item], "markers": [{"label": "ISS", "lat": lat, "lon": lon, "hot": True}],
            "summary": f"The ISS is at {lat:.2f}, {lon:.2f}, {item['alt_km']} km up, moving at {item['speed_kmh']} km/h."}


def scan(layer, place=None, radius_km=None):
    layer = (layer or "flights").lower()
    if layer.startswith("flight") or layer in ("planes", "aircraft"):
        return flights(place, radius_km or 200)
    if layer.startswith("earth") or layer.startswith("quake"):
        return earthquakes(place, radius_km or 2000)
    if layer in ("iss", "space station", "satellite"):
        return iss()
    return {"error": f"Unknown God's Eye layer '{layer}'. Use flights, earthquakes or iss."}
