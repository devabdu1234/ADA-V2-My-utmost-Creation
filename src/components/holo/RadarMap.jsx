import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const PLANE = (heading, color) => `
<div style="transform:rotate(${heading}deg);width:22px;height:22px;filter:drop-shadow(0 0 6px ${color})">
<svg viewBox="0 0 24 24" width="22" height="22"><path fill="${color}" d="M12 2c.8 0 1.3.9 1.3 2v5.2l7.7 4.6v2l-7.7-2.4v4.8l2.2 1.7V21L12 20l-3.5 1v-1.1l2.2-1.7v-4.8L3 15.8v-2l7.7-4.6V4c0-1.1.5-2 1.3-2z"/></svg></div>`;

/**
 * Live map for God's Eye layers.
 *  layer   flights | earthquakes | iss
 *  center  {lat, lon, name}
 *  items   layer items from the backend
 *  selected index of highlighted item
 */
export default function RadarMap({ layer, center, items = [], radiusKm = 200, selected, onSelect, width = 640, height = 400 }) {
    const div = useRef(null);
    const map = useRef(null);
    const markers = useRef([]);

    useEffect(() => {
        const zoom = layer === 'flights' ? (radiusKm > 300 ? 6 : 7) : layer === 'iss' ? 3 : 3;
        const m = L.map(div.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: true })
            .setView([center.lat, center.lon], 2);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap' }).addTo(m);
        if (layer === 'flights') {
            L.circle([center.lat, center.lon], { radius: radiusKm * 1000, color: '#22d3ee', weight: 1, fillOpacity: 0.03, dashArray: '4 6' }).addTo(m);
        }
        const t = setTimeout(() => { if (map.current === m) m.flyTo([center.lat, center.lon], zoom, { duration: 2 }); }, 300);
        map.current = m;
        return () => { clearTimeout(t); map.current = null; m.stop(); m.remove(); };
    }, [layer, center.lat, center.lon, radiusKm]);

    useEffect(() => {
        const m = map.current;
        if (!m) return;
        markers.current.forEach((mk) => mk.remove());
        markers.current = items.map((it, i) => {
            const hot = i === selected;
            let mk;
            if (layer === 'flights') {
                const color = hot ? '#fb7185' : it.on_ground ? '#94a3b8' : '#fbbf24';
                mk = L.marker([it.lat, it.lon], {
                    icon: L.divIcon({ className: 'ada-map-pin', html: PLANE(it.heading || 0, color), iconSize: [22, 22], iconAnchor: [11, 11] }),
                }).bindTooltip(`${it.callsign} · ${it.alt_m} m · ${it.speed_kmh} km/h`, { direction: 'top', className: 'ada-tip' });
            } else if (layer === 'earthquakes') {
                mk = L.circleMarker([it.lat, it.lon], {
                    radius: 4 + (it.mag || 0) * 2.2, color: hot ? '#fff' : '#fb7185', weight: hot ? 2 : 1,
                    fillColor: '#fb7185', fillOpacity: 0.45,
                }).bindTooltip(`M${it.mag} · ${it.place}`, { direction: 'top', className: 'ada-tip' });
            } else {
                mk = L.marker([it.lat, it.lon], {
                    icon: L.divIcon({ className: 'ada-map-pin', html: '<div class="ada-iss">ISS</div>', iconSize: [40, 40], iconAnchor: [20, 20] }),
                });
            }
            mk.on('click', () => onSelect && onSelect(i));
            mk.addTo(m);
            return mk;
        });
        if (selected != null && items[selected]) m.setView([items[selected].lat, items[selected].lon], m.getZoom(), { animate: false });
    }, [items, selected, layer]);

    return (
        <div className="relative overflow-hidden bg-black" style={{ width, height }}>
            <div ref={div} style={{ width: '100%', height: '100%', background: '#05070d' }} />
            {layer === 'flights' && <div className="radar-sweep pointer-events-none" />}
            <style>{`.ada-map-pin{background:transparent;border:none}.leaflet-container{font:inherit;background:#05070d}
.leaflet-tile-pane{filter:invert(1) hue-rotate(190deg) saturate(.6) brightness(.85)}
.ada-tip{background:#03101c;color:#e2e8f0;border:1px solid rgba(34,211,238,.4);font-family:monospace;font-size:11px}
.ada-iss{width:40px;height:40px;border-radius:50%;border:2px solid #a78bfa;color:#ede9fe;font:bold 10px monospace;display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(167,139,250,.8);background:rgba(76,29,149,.4)}`}</style>
        </div>
    );
}
