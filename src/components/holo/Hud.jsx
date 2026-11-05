import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/* ------------------------------------------------------------------ *
 * Film-style FUI kit for A.P.A.
 * Built from the techniques screen-graphics studios use (Cantina Creative /
 * Jayse Hansen on the Iron Man HUDs, Territory Studio): layered simple shapes,
 * constant secondary motion, decoding data, depth planes and a "mode spin"
 * when the interface changes state.
 * ------------------------------------------------------------------ */

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@$<>/\\[]{}=+*';

/** Text that decodes from random glyphs into the real string. */
export function DecodeText({ text = '', delay = 0, speed = 28, className = '' }) {
    const [out, setOut] = useState('');
    useEffect(() => {
        let frame = 0;
        let iv;
        const total = text.length;
        const t = setTimeout(() => {
            iv = setInterval(() => {
                frame += 1;
                const solved = Math.floor(frame / 2);
                let s = '';
                for (let i = 0; i < total; i++) {
                    if (i < solved || text[i] === ' ') s += text[i];
                    else if (i < solved + 6) s += GLYPHS[(Math.random() * GLYPHS.length) | 0];
                }
                setOut(s);
                if (solved >= total) clearInterval(iv);
            }, speed);
        }, delay);
        return () => { clearTimeout(t); clearInterval(iv); };
    }, [text, delay, speed]);
    return <span className={className}>{out}</span>;
}

/** Number that counts up to its value. */
export function CountUp({ value, duration = 900, decimals = 0 }) {
    const num = typeof value === 'number' ? value : parseFloat(value);
    const [v, setV] = useState(0);
    useEffect(() => {
        if (Number.isNaN(num)) return;
        let raf;
        const t0 = performance.now();
        const step = (t) => {
            const k = Math.min(1, (t - t0) / duration);
            setV(num * (1 - Math.pow(1 - k, 3)));
            if (k < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [num]);
    if (Number.isNaN(num)) return <>{value}</>;
    const suffix = typeof value === 'string' ? value.replace(/^[\d.\-]+/, '') : '';
    return <>{v.toFixed(decimals)}{suffix}</>;
}

/** Scrolling hex telemetry: the "data being analysed" texture. */
export function DataStream({ rows = 8, className = '' }) {
    const make = () => Array.from({ length: rows }, () =>
        `${Math.random().toString(16).slice(2, 6).toUpperCase()} ${Math.random().toString(16).slice(2, 10).toUpperCase()} ${(Math.random() * 99).toFixed(2)}`);
    const [lines, setLines] = useState(make);
    useEffect(() => {
        const iv = setInterval(() => setLines((l) => [...l.slice(1), make()[0]]), 180);
        return () => clearInterval(iv);
    }, []);
    return (
        <div className={`font-mono text-[9px] leading-[13px] text-cyan-300/40 ${className}`}>
            {lines.map((l, i) => <div key={i} style={{ opacity: 0.25 + (i / rows) * 0.75 }}>{l}</div>)}
        </div>
    );
}

function arcPath(r, a0, a1) {
    const p = (a) => [Math.cos((a - 90) * Math.PI / 180) * r, Math.sin((a - 90) * Math.PI / 180) * r];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return `M ${x0} ${y0} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
}

function Ticks({ r, n, len, every = 5, color }) {
    return (
        <g>
            {Array.from({ length: n }, (_, i) => {
                const a = (i / n) * 360;
                const L = i % every === 0 ? len * 2 : len;
                const rad = (a - 90) * Math.PI / 180;
                return <line key={i} x1={Math.cos(rad) * r} y1={Math.sin(rad) * r}
                    x2={Math.cos(rad) * (r + L)} y2={Math.sin(rad) * (r + L)} stroke={color} strokeWidth={i % every === 0 ? 1.2 : 0.6} />;
            })}
        </g>
    );
}

const STATE_COLOR = {
    offline: '#64748b', idle: '#22d3ee', listening: '#22d3ee', thinking: '#a78bfa', speaking: '#67e8f9',
    summoning: '#f0abfc', focus: '#34d399', alert: '#fb7185',
};

/**
 * OrbHud: layered rotating instrument rings around the orb.
 * Spins into a new orientation whenever the mode changes (the "battle mode" spin).
 */
export function OrbHud({ state = 'idle', size = 720 }) {
    const c = STATE_COLOR[state] || '#22d3ee';
    const fast = state === 'thinking' || state === 'summoning';
    const [spin, setSpin] = useState(0);
    const prev = useRef(state);
    useEffect(() => {
        if (prev.current !== state && (state === 'summoning' || prev.current === 'summoning' || state === 'alert')) setSpin((s) => s + 180);
        prev.current = state;
    }, [state]);
    const R = size / 2;
    const labels = useMemo(() => Array.from({ length: 12 }, (_, i) => i * 30), []);
    const vb = `${-R} ${-R} ${size} ${size}`;
    const Layer = ({ cls, children }) => (
        <svg width={size} height={size} viewBox={vb} className={`absolute inset-0 ${cls || ''}`} style={{ overflow: 'visible' }}>{children}</svg>
    );
    return (
        <motion.div className="relative pointer-events-none" style={{ width: size, height: size }}
            animate={{ rotate: spin }} transition={{ type: 'spring', stiffness: 40, damping: 12 }}>
            <Layer>
                <defs>
                    <radialGradient id="hudfade"><stop offset="0.55" stopColor={c} stopOpacity="0" /><stop offset="1" stopColor={c} stopOpacity="0.06" /></radialGradient>
                </defs>
                <circle r={R * 0.98} fill="url(#hudfade)" />
                {[0, 90, 180, 270].map((a) => (
                    <g key={a} transform={`rotate(${a})`}>
                        <line x1="0" y1={-R * 0.99} x2="0" y2={-R * 0.94} stroke={c} strokeOpacity="0.7" strokeWidth="1.5" />
                        <path d={`M -10 ${-R * 0.58} L 0 ${-R * 0.55} L 10 ${-R * 0.58}`} fill="none" stroke={c} strokeOpacity="0.5" />
                    </g>
                ))}
            </Layer>
            <Layer cls={fast ? 'hud-rot-fast' : 'hud-rot-slow'}>
                <circle r={R * 0.92} fill="none" stroke={c} strokeOpacity="0.18" />
                <Ticks r={R * 0.92} n={120} len={4} every={10} color={c + '66'} />
                {labels.map((a) => {
                    const rad = (a - 90) * Math.PI / 180;
                    return <text key={a} x={Math.cos(rad) * R * 0.85} y={Math.sin(rad) * R * 0.85 + 3} fill={c} fillOpacity="0.45"
                        fontSize="9" fontFamily="monospace" textAnchor="middle">{String(a).padStart(3, '0')}</text>;
                })}
            </Layer>
            <Layer cls={fast ? 'hud-rot-rev-fast' : 'hud-rot-rev'}>
                {[[10, 70], [95, 130], [150, 230], [250, 262], [270, 340]].map(([a, b], i) => (
                    <path key={i} d={arcPath(R * 0.76, a, b)} fill="none" stroke={c} strokeOpacity={i % 2 ? 0.25 : 0.55} strokeWidth={i % 2 ? 2 : 5} />
                ))}
            </Layer>
            <Layer cls="hud-rot-mid">
                <circle r={R * 0.66} fill="none" stroke={c} strokeOpacity="0.15" strokeDasharray="2 6" />
                <path d={arcPath(R * 0.66, 0, 46)} fill="none" stroke={c} strokeWidth="2" strokeOpacity="0.9" />
                <circle cx={0} cy={-R * 0.66} r="3" fill={c} />
            </Layer>
        </motion.div>
    );
}

/** Screen-frame furniture: corner brackets, edge rulers, telemetry. */
export function ScreenFrame({ state = 'idle', fps }) {
    const c = STATE_COLOR[state] || '#22d3ee';
    const [t, setT] = useState(0);
    useEffect(() => { const iv = setInterval(() => setT((x) => x + 1), 1000); return () => clearInterval(iv); }, []);
    const cpu = (38 + Math.sin(t / 3) * 9 + (t % 7)).toFixed(1);
    const link = (12 + Math.abs(Math.sin(t / 2)) * 30).toFixed(0);
    return (
        <div className="absolute inset-0 pointer-events-none z-[5]" style={{ color: c }}>
            {['tl', 'tr', 'bl', 'br'].map((k) => (
                <div key={k} className={`hud-corner hud-corner-${k}`} style={{ borderColor: c + '88' }} />
            ))}
            <div className="hud-ruler hud-ruler-left" style={{ '--c': c + '55' }} />
            <div className="hud-ruler hud-ruler-right" style={{ '--c': c + '55' }} />
            <div className="absolute top-3 left-1/2 -translate-x-1/2 hud-tape" style={{ '--c': c + '66' }}>
                <div className="hud-tape-inner">{Array.from({ length: 48 }, (_, i) => <span key={i}>{String((i * 15) % 360).padStart(3, '0')}</span>)}</div>
            </div>
            <div className="absolute left-6 bottom-6 text-[9px] font-mono leading-[14px] opacity-60">
                <div>CORE LOAD <span className="text-white/80">{cpu}%</span></div>
                <div>UPLINK <span className="text-white/80">{link} ms</span></div>
                <div>MODE <span className="text-white/80">{state.toUpperCase()}</span></div>
                <div className="flex items-center gap-1">SIGNAL {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className="inline-block w-1 bg-current" style={{ height: 3 + i * 2, opacity: i < 4 ? 0.9 : 0.25 }} />
                ))}</div>
            </div>
            <DataStream rows={9} className="absolute right-6 bottom-6 text-right" />
        </div>
    );
}

/** One-time cinematic boot sequence. */
export function BootSequence({ onDone }) {
    const lines = ['INITIALISING NEURAL CORE', 'LINKING GEMINI LIVE UPLINK', 'CALIBRATING GOD\'S EYE ARRAY', 'ARMING BLUEY FOCUS MODULE', 'ALL SYSTEMS NOMINAL'];
    useEffect(() => { const t = setTimeout(onDone, 3400); return () => clearTimeout(t); }, []);
    return (
        <motion.div className="fixed inset-0 z-[200] bg-[#02040a] flex items-center justify-center"
            initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.8 } }}>
            <div className="relative flex items-center justify-center">
                <motion.div initial={{ scale: 0.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.2, ease: [0.2, 0.9, 0.2, 1] }}>
                    <OrbHud state="summoning" size={520} />
                </motion.div>
                <div className="absolute text-center">
                    <div className="text-3xl tracking-[0.6em] font-bold text-cyan-100 pl-[0.6em]"><DecodeText text="A.P.A" delay={300} speed={60} /></div>
                    <div className="text-[10px] tracking-[0.5em] text-cyan-300/60 mt-2"><DecodeText text="AUTONOMOUS PERSONAL ASSISTANT" delay={700} /></div>
                </div>
            </div>
            <div className="absolute left-10 bottom-10 font-mono text-[11px] text-cyan-300/70 space-y-1">
                {lines.map((l, i) => (
                    <motion.div key={l} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.5 }}>
                        <span className="text-cyan-500">[{i === lines.length - 1 ? ' OK ' : 'BOOT'}]</span> <DecodeText text={l} delay={500 + i * 500} speed={14} />
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
