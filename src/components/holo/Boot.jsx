import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OrbHud, DecodeText } from './Hud';
import { sfx } from '../../sfx';

/* ------------------------------------------------------------------ *
 * Cinematic boot sequence, built in acts like a film title:
 *   1. CRT ignition      a line of light snaps open into the screen
 *   2. Core assembly     particles converge into the orb, rings lock on
 *   3. Diagnostics       each subsystem is checked (real status for the core)
 *   4. Title             A.P.A decodes with a chromatic split, "welcome back"
 *   5. Iris reveal       a ring of light opens from the orb onto the live HUD
 * Click or press any key to skip.
 * ------------------------------------------------------------------ */

const T = { ignite: 0, core: 700, diag: 1900, title: 4300, iris: 6400, done: 7400 };

function ParticleCore({ start }) {
    const ref = useRef(null);
    useEffect(() => {
        const cv = ref.current;
        const ctx = cv.getContext('2d');
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const W = (cv.width = window.innerWidth * dpr);
        const H = (cv.height = window.innerHeight * dpr);
        const cx = W / 2, cy = H * 0.46, R = Math.min(W, H) * 0.16;
        const N = 1400;
        const pts = Array.from({ length: N }, () => {
            const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
            const far = Math.max(W, H) * (0.6 + Math.random());
            const a = Math.random() * Math.PI * 2;
            return { th, ph, sx: cx + Math.cos(a) * far, sy: cy + Math.sin(a) * far, d: Math.random() * 0.5 };
        });
        let raf;
        const t0 = performance.now() + start;
        const draw = (now) => {
            const t = Math.max(0, (now - t0) / 1000);
            ctx.clearRect(0, 0, W, H);
            // faint hex grid
            ctx.strokeStyle = `rgba(34,211,238,${Math.min(0.06, t * 0.03)})`;
            ctx.lineWidth = 1;
            const s = 34 * dpr;
            for (let y = 0; y < H + s; y += s * 0.866) {
                for (let x = ((y / (s * 0.866)) % 2) * s * 0.5; x < W + s; x += s) {
                    ctx.beginPath();
                    for (let k = 0; k < 6; k++) {
                        const ang = Math.PI / 3 * k + Math.PI / 6;
                        const px = x + Math.cos(ang) * s * 0.5, py = y + Math.sin(ang) * s * 0.5;
                        k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
                    }
                    ctx.closePath();
                    ctx.stroke();
                }
            }
            const rot = t * 0.6;
            for (const p of pts) {
                const k = Math.min(1, Math.max(0, (t - p.d) / 1.3));
                const e = 1 - Math.pow(1 - k, 3);
                const x3 = Math.sin(p.ph) * Math.cos(p.th + rot), y3 = Math.cos(p.ph), z3 = Math.sin(p.ph) * Math.sin(p.th + rot);
                const tx = cx + x3 * R, ty = cy + y3 * R;
                const x = p.sx + (tx - p.sx) * e, y = p.sy + (ty - p.sy) * e;
                const front = (z3 + 1) / 2;
                ctx.fillStyle = `rgba(${120 + front * 100},${220 + front * 35},255,${0.25 + front * 0.65 * e})`;
                ctx.fillRect(x, y, (1 + front) * dpr, (1 + front) * dpr);
            }
            // core glow once assembled
            const g = Math.min(1, Math.max(0, t - 1.1));
            if (g > 0) {
                const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.4);
                grad.addColorStop(0, `rgba(103,232,249,${0.35 * g})`);
                grad.addColorStop(1, 'rgba(103,232,249,0)');
                ctx.fillStyle = grad;
                ctx.beginPath(); ctx.arc(cx, cy, R * 1.4, 0, Math.PI * 2); ctx.fill();
            }
            raf = requestAnimationFrame(draw);
        };
        raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
    }, []);
    return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

function Module({ label, i, status, onDone }) {
    const [pct, setPct] = useState(0);
    useEffect(() => {
        let raf, t0;
        const dur = 600 + i * 120;
        const step = (t) => {
            t0 = t0 || t;
            const k = Math.min(1, (t - t0) / dur);
            setPct(Math.round(k * 100));
            if (k < 1) raf = requestAnimationFrame(step);
            else { sfx.blip(); onDone && onDone(); }
        };
        const d = setTimeout(() => (raf = requestAnimationFrame(step)), i * 330);
        return () => { clearTimeout(d); cancelAnimationFrame(raf); };
    }, []);
    const done = pct >= 100;
    const bad = done && status === 'offline';
    return (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.33 }}
            className="font-mono text-[11px] w-[330px]">
            <div className="flex justify-between">
                <span className="text-cyan-100/80"><DecodeText text={label} delay={i * 330} speed={12} /></span>
                <span className={bad ? 'text-amber-300' : done ? 'text-emerald-300' : 'text-cyan-300/70'}>
                    {done ? (bad ? 'STANDBY' : 'ONLINE') : `${pct}%`}
                </span>
            </div>
            <div className="h-[3px] bg-white/5 mt-1 overflow-hidden">
                <div className={`h-full ${bad ? 'bg-amber-400' : 'bg-cyan-300'}`} style={{ width: `${pct}%`, boxShadow: '0 0 8px rgba(34,211,238,.8)' }} />
            </div>
        </motion.div>
    );
}

export default function Boot({ coreOnline, onDone }) {
    const [act, setAct] = useState('ignite');
    const timers = useRef([]);
    const skip = () => { timers.current.forEach(clearTimeout); setAct('iris'); sfx.whoosh(); timers.current = [setTimeout(onDone, 1000)]; };

    useEffect(() => {
        sfx.swell();
        const at = (ms, fn) => timers.current.push(setTimeout(fn, ms));
        at(T.core, () => setAct('core'));
        at(T.diag, () => setAct('diag'));
        at(T.title, () => { setAct('title'); sfx.hit(); });
        at(T.iris, () => { setAct('iris'); sfx.whoosh(); });
        at(T.done, onDone);
        const k = () => skip();
        window.addEventListener('keydown', k);
        return () => { timers.current.forEach(clearTimeout); window.removeEventListener('keydown', k); };
    }, []);

    const after = (a) => ['ignite', 'core', 'diag', 'title', 'iris'].indexOf(act) >= ['ignite', 'core', 'diag', 'title', 'iris'].indexOf(a);
    const modules = [
        ['NEURAL CORE', coreOnline ? 'online' : 'offline'],
        ['GEMINI LIVE UPLINK', coreOnline ? 'online' : 'offline'],
        ['VOICE SYNTHESIS', 'online'],
        ["GOD'S EYE ARRAY", 'online'],
        ['COMPUTER CONTROL', 'online'],
        ['BLUEY FOCUS MODULE', 'online'],
    ];

    return (
        <>
        <motion.div className="fixed inset-0 z-[200] cursor-pointer select-none" onClick={skip}
            initial={{ '--iris': '0vmax' }}
            animate={{ '--iris': act === 'iris' ? '140vmax' : '0vmax' }}
            transition={{ duration: act === 'iris' ? 1.0 : 0, ease: [0.7, 0, 0.3, 1] }}
            style={{
                WebkitMaskImage: 'radial-gradient(circle at 50% 46%, transparent var(--iris), #000 calc(var(--iris) + 2px))',
                maskImage: 'radial-gradient(circle at 50% 46%, transparent var(--iris), #000 calc(var(--iris) + 2px))',
            }}>
            <div className="absolute inset-0 bg-[#010309]" />

            {/* ACT 1: CRT ignition */}
            <motion.div className="absolute left-0 right-0 top-[46%] h-[2px] bg-cyan-50"
                initial={{ scaleX: 0, opacity: 1 }} animate={{ scaleX: [0, 1, 1], scaleY: [1, 1, 260], opacity: [1, 1, 0] }}
                transition={{ duration: 0.7, times: [0, 0.45, 1], ease: 'easeOut' }}
                style={{ boxShadow: '0 0 30px 6px rgba(165,243,252,.9)' }} />

            {/* ACT 2: particles assemble the core */}
            {after('core') && <ParticleCore start={0} />}
            {after('core') && (
                <motion.div className="absolute left-1/2 top-[46%]"
                    initial={{ scale: 2.4, opacity: 0, rotate: -90, x: '-50%', y: '-50%' }} animate={{ scale: 1, opacity: 1, rotate: 0, x: '-50%', y: '-50%' }}
                    transition={{ duration: 1.4, ease: [0.2, 0.9, 0.2, 1] }}>
                    <OrbHud state={act === 'title' ? 'listening' : 'summoning'} size={Math.round(window.innerHeight * 0.62)} />
                </motion.div>
            )}

            {/* ACT 3: diagnostics */}
            <AnimatePresence>
                {after('diag') && act !== 'iris' && (
                    <motion.div className="absolute left-12 top-1/2 -translate-y-1/2 space-y-3" exit={{ opacity: 0, x: -30 }}>
                        <div className="text-[10px] tracking-[0.4em] text-cyan-300/60 mb-2">SYSTEM DIAGNOSTICS</div>
                        {modules.map(([l, s], i) => <Module key={l} label={l} i={i} status={s} />)}
                    </motion.div>
                )}
            </AnimatePresence>
            {after('diag') && act !== 'iris' && (
                <motion.div className="absolute right-12 top-1/2 -translate-y-1/2 font-mono text-[10px] text-cyan-300/50 text-right leading-4"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {Array.from({ length: 16 }, (_, i) => (
                        <div key={i}><DecodeText text={`0x${(0x3f00 + i * 271).toString(16).toUpperCase()}  ${['MEM', 'NET', 'GPU', 'AUD', 'SYS', 'I/O'][i % 6]}  ${(90 + (i * 37) % 10).toFixed(1)}%  OK`} delay={i * 110} speed={8} /></div>
                    ))}
                </motion.div>
            )}

            {/* ACT 4: title */}
            {after('title') && (
                <div className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 text-center">
                    <div className="relative text-7xl font-bold tracking-[0.5em] pl-[0.5em] text-white">
                        <motion.span className="absolute inset-0 text-rose-400/70 mix-blend-screen" initial={{ x: -14, opacity: 0.9 }} animate={{ x: 0, opacity: 0 }} transition={{ duration: 0.8 }}>A.P.A</motion.span>
                        <motion.span className="absolute inset-0 text-cyan-300/70 mix-blend-screen" initial={{ x: 14, opacity: 0.9 }} animate={{ x: 0, opacity: 0 }} transition={{ duration: 0.8 }}>A.P.A</motion.span>
                        <span style={{ textShadow: '0 0 30px rgba(103,232,249,.8)' }}><DecodeText text="A.P.A" speed={45} /></span>
                    </div>
                    <div className="mt-4 text-[11px] tracking-[0.6em] text-cyan-200/70"><DecodeText text="AUTONOMOUS PERSONAL ASSISTANT" delay={300} speed={16} /></div>
                    <motion.div className="mt-6 text-sm tracking-[0.4em] text-white/90" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
                        <DecodeText text={coreOnline ? 'WELCOME BACK, SIR' : 'CORE OFFLINE · STARTING IN LIMITED MODE'} delay={900} speed={30} />
                    </motion.div>
                </div>
            )}

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.5em] text-cyan-300/30">CLICK OR PRESS ANY KEY TO SKIP</div>
            <div className="absolute inset-0 pointer-events-none fx-scanlines" />
        </motion.div>
            {/* the iris edge: a ring of light riding the reveal (outside the mask) */}
            {act === 'iris' && (
                <motion.div className="fixed z-[201] left-1/2 top-[46%] rounded-full border-2 border-cyan-100 pointer-events-none"
                    style={{ boxShadow: '0 0 40px 10px rgba(165,243,252,.6), inset 0 0 40px 10px rgba(165,243,252,.4)' }}
                    initial={{ width: 0, height: 0, x: '-50%', y: '-50%', opacity: 1 }}
                    animate={{ width: '280vmax', height: '280vmax', opacity: 0.2 }} transition={{ duration: 1.0, ease: [0.7, 0, 0.3, 1] }} />
            )}
        </>
    );
}
