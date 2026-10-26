import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Street-level dive: dark map + live rain radar + city pin. Zero keys.
// Props: lat, lon, city, temp, description. Phases in with a flyTo hunt.
const CityMap = ({ lat, lon, city = 'TARGET', temp, description = '', width = 640, height = 380 }) => {
    const divRef = useRef(null);
    const [phase, setPhase] = useState('DIVING');

    useEffect(() => {
        if (!divRef.current) return;
        const map = L.map(divRef.current, {
            zoomControl: false, attributionControl: true,
            scrollWheelZoom: false, dragging: false, doubleClickZoom: false,
        }).setView([lat, lon], 3);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        // live rain radar (RainViewer, free, no key)
        fetch('https://api.rainviewer.com/public/weather-maps.json')
            .then((r) => r.json())
            .then((wx) => {
                const host = wx.host;
                const frames = [...(wx.radar?.past || []), ...(wx.radar?.nowcast || [])].slice(-4);
                frames.forEach((f) => {
                    L.tileLayer(`${host}${f.path}/256/{z}/{x}/{y}/2/1_1.png`, {
                        opacity: 0.55, zIndex: 10, maxNativeZoom: 10,
                        attribution: 'RainViewer',
                    }).addTo(map);
                });
            })
            .catch(() => { /* radar is garnish; map flies without it */ });

        const pin = L.divIcon({
            className: 'ada-map-pin',
            html: `<div style="width:18px;height:18px;border-radius:50%;background:#fb7185;box-shadow:0 0 18px 6px rgba(251,113,133,.8);border:2px solid #fff"></div>`,
            iconSize: [18, 18], iconAnchor: [9, 9],
        });
        L.marker([lat, lon], { icon: pin, interactive: false }).addTo(map);

        // the hunt: world -> country -> street
        const t1 = setTimeout(() => { setPhase('LOCKING'); map.flyTo([lat, lon], 8, { duration: 2.2 }); }, 400);
        const t2 = setTimeout(() => { setPhase('STREET'); map.flyTo([lat, lon], 13, { duration: 2.6 }); }, 2900);

        return () => { clearTimeout(t1); clearTimeout(t2); map.remove(); };
    }, [lat, lon]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 1.12, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.94, filter: 'blur(8px)' }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            className="relative overflow-hidden rounded-3xl border border-amber-300/20 bg-black shadow-[0_0_60px_rgba(251,191,36,0.18)]"
            style={{ width, height }}
        >
            <div ref={divRef} style={{ width: '100%', height: '100%', background: '#05070d' }} />
            <div className="absolute top-3 left-4 flex items-center gap-2 pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] font-mono tracking-[0.3em] text-amber-200/90">
                    {phase} · {String(city).toUpperCase()}
                </span>
            </div>
            {(temp !== undefined) && (
                <div className="absolute bottom-3 left-4 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur border border-white/10 pointer-events-none">
                    <span className="text-xl font-bold text-white">{temp}°</span>
                    <span className="text-[10px] text-cyan-200/70 ml-2 capitalize">{description}</span>
                </div>
            )}
            <div className="absolute bottom-3 right-4 text-[9px] font-mono text-cyan-300/50 tracking-widest pointer-events-none">
                STREET DIVE · RADAR LIVE
            </div>
            <style>{`.ada-map-pin{background:transparent;border:none}.leaflet-container{font:inherit;background:#05070d}.leaflet-tile-pane{filter:invert(1) hue-rotate(190deg) saturate(.65) brightness(.92)}`}</style>
        </motion.div>
    );
};

export default CityMap;
