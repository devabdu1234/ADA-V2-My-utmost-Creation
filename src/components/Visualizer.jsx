import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// adaState: 'idle' | 'listening' | 'thinking' | 'speaking' | 'summoning'
// Cinematic ADA core: layered rings + particle field + state-driven glow.
// Pure canvas 2D so it runs in Electron with zero new deps.
const STATE_COLOR = {
    idle: { core: '#22d3ee', glow: 'rgba(34,211,238,', ring: 'rgba(34,211,238,' },
    listening: { core: '#67e8f9', glow: 'rgba(103,232,249,', ring: 'rgba(103,232,249,' },
    thinking: { core: '#a78bfa', glow: 'rgba(167,139,250,', ring: 'rgba(167,139,250,' },
    speaking: { core: '#f0abfc', glow: 'rgba(240,171,252,', ring: 'rgba(240,171,252,' },
    summoning: { core: '#fde68a', glow: 'rgba(253,230,138,', ring: 'rgba(253,230,138,' },
};

const Visualizer = ({ audioData, isListening, intensity = 0, width = 600, height = 400, adaState = 'idle' }) => {
    const canvasRef = useRef(null);
    const audioDataRef = useRef(audioData);
    const intensityRef = useRef(intensity);
    const stateRef = useRef(adaState);
    const listeningRef = useRef(isListening);

    useEffect(() => { audioDataRef.current = audioData; }, [audioData]);
    useEffect(() => { intensityRef.current = intensity; }, [intensity]);
    useEffect(() => { stateRef.current = adaState; }, [adaState]);
    useEffect(() => { listeningRef.current = isListening; }, [isListening]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        let animationId;
        const start = performance.now();

        // deterministic particle field
        const P = 90;
        const particles = Array.from({ length: P }, (_, i) => ({
            a: (i / P) * Math.PI * 2,
            r: 0.55 + ((i * 37) % 40) / 100,
            s: 0.15 + ((i * 13) % 10) / 40,
            sz: 0.6 + ((i * 7) % 3) * 0.7,
        }));

        const draw = (now) => {
            const t = (now - start) / 1000;
            const w = canvas.width;
            const h = canvas.height;
            const cx = w / 2;
            const cy = h / 2;
            const state = stateRef.current || 'idle';
            const pal = STATE_COLOR[state] || STATE_COLOR.idle;
            const energy = Math.min(1, intensityRef.current * 2.2);
            const baseR = Math.min(w, h) * 0.20;

            ctx.clearRect(0, 0, w, h);

            // --- particle orbit field ---
            particles.forEach((p) => {
                const speed = p.s * (state === 'thinking' ? 2.6 : state === 'speaking' ? 1.6 : 0.7);
                const ang = p.a + t * speed;
                const rad = baseR * (1.35 + p.r) + Math.sin(t * 1.3 + p.a * 3) * 6;
                const x = cx + Math.cos(ang) * rad * (w / h > 1 ? 1.35 : 1);
                const y = cy + Math.sin(ang) * rad * 0.72;
                const tw = 0.25 + 0.75 * Math.abs(Math.sin(t * 2 + p.a * 5));
                ctx.beginPath();
                ctx.arc(x, y, p.sz, 0, Math.PI * 2);
                ctx.fillStyle = `${pal.glow}${(0.25 + tw * 0.5).toFixed(3)})`;
                ctx.fill();
            });

            // --- orbit rings (God's Eye gyro feel) ---
            const rings = [
                { rx: baseR * 1.9, tilt: 0.42, rot: t * 0.35, alpha: 0.35, lw: 1.5 },
                { rx: baseR * 2.3, tilt: -0.3, rot: -t * 0.28, alpha: 0.22, lw: 1 },
                { rx: baseR * 1.55, tilt: 0.9, rot: t * (state === 'thinking' ? 1.4 : 0.6), alpha: state === 'thinking' ? 0.8 : 0.45, lw: 2 },
            ];
            rings.forEach((r) => {
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(r.tilt);
                ctx.scale(1, 0.42);
                ctx.beginPath();
                // dashed arc sweep
                for (let a = 0; a < Math.PI * 2; a += 0.08) {
                    const rr = r.rx + Math.sin(a * 3 + r.rot * 3) * 4;
                    const x = Math.cos(a + r.rot) * rr;
                    const y = Math.sin(a + r.rot) * rr;
                    if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.strokeStyle = `${pal.ring}${r.alpha})`;
                ctx.lineWidth = r.lw;
                ctx.shadowBlur = 18;
                ctx.shadowColor = `${pal.glow}0.5)`;
                ctx.stroke();
                ctx.restore();
                ctx.shadowBlur = 0;
            });

            // --- core orb ---
            const breathe = Math.sin(t * 1.8) * 4;
            const pulse = state === 'speaking' ? energy * 26 : state === 'thinking' ? 10 + Math.sin(t * 6) * 8 : 6;
            const coreR = baseR + breathe * 0.5 + pulse;

            // outer halo
            const halo = ctx.createRadialGradient(cx, cy, coreR * 0.4, cx, cy, coreR * 2.4);
            halo.addColorStop(0, `${pal.glow}0.28)`);
            halo.addColorStop(0.55, `${pal.glow}0.08)`);
            halo.addColorStop(1, `${pal.glow}0)`);
            ctx.beginPath();
            ctx.arc(cx, cy, coreR * 2.4, 0, Math.PI * 2);
            ctx.fillStyle = halo;
            ctx.fill();

            // core body
            const body = ctx.createRadialGradient(cx - coreR * 0.3, cy - coreR * 0.35, coreR * 0.1, cx, cy, coreR);
            body.addColorStop(0, 'rgba(255,255,255,0.95)');
            body.addColorStop(0.25, `${pal.glow}0.85)`);
            body.addColorStop(0.7, `${pal.glow}0.25)`);
            body.addColorStop(1, `${pal.glow}0.05)`);
            ctx.beginPath();
            ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
            ctx.fillStyle = body;
            ctx.shadowBlur = state === 'idle' ? 30 : 60;
            ctx.shadowColor = `${pal.glow}0.8)`;
            ctx.fill();
            ctx.shadowBlur = 0;

            // thin containment ring
            ctx.beginPath();
            ctx.arc(cx, cy, coreR + 10, 0, Math.PI * 2);
            ctx.strokeStyle = `${pal.ring}0.5)`;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // speaking shockwaves
            if (state === 'speaking' && energy > 0.04) {
                for (let k = 0; k < 2; k++) {
                    const ph = ((t * 1.4 + k * 0.5) % 1);
                    ctx.beginPath();
                    ctx.arc(cx, cy, coreR + 12 + ph * 60, 0, Math.PI * 2);
                    ctx.strokeStyle = `${pal.ring}${(0.4 * (1 - ph)).toFixed(3)})`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }

            // thinking sweep arc
            if (state === 'thinking' || state === 'summoning') {
                ctx.beginPath();
                const sweep = t * 3;
                ctx.arc(cx, cy, coreR + 22, sweep, sweep + Math.PI * 0.9);
                ctx.strokeStyle = `${pal.ring}0.9)`;
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.shadowBlur = 24;
                ctx.shadowColor = `${pal.glow}0.9)`;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

            animationId = requestAnimationFrame(draw);
        };

        animationId = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animationId);
    }, [width, height]);

    const pal = STATE_COLOR[adaState] || STATE_COLOR.idle;
    const label = adaState === 'thinking' ? 'THINKING' : adaState === 'speaking' ? 'SPEAKING' : adaState === 'summoning' ? 'SUMMONING' : adaState === 'listening' ? 'LISTENING' : 'STANDBY';

    return (
        <div className="relative" style={{ width, height }}>
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="flex flex-col items-center">
                    <motion.div
                        animate={adaState === 'thinking' ? { scale: [1, 1.06, 1], opacity: [0.9, 1, 0.9] } : adaState === 'speaking' ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                        transition={{ duration: adaState === 'thinking' ? 1.1 : 2, repeat: Infinity, ease: 'easeInOut' }}
                        className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-purple-300 font-bold tracking-[0.3em] drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]"
                        style={{ fontSize: Math.min(width, height) * 0.09 }}
                    >
                        A.P.A
                    </motion.div>
                    <div
                        className="mt-2 text-[10px] font-mono tracking-[0.4em] px-3 py-1 rounded-full border backdrop-blur-sm"
                        style={{ color: pal.core, borderColor: `${pal.ring}0.4)`, background: `${pal.glow}0.08)` }}
                    >
                        {label}
                    </div>
                </div>
            </div>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
        </div>
    );
};

export default Visualizer;
