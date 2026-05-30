import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Phase transitions ───
// 0: Black / glitch
// 1: Terminal text typing
// 2: Progress bar
// 3: Cognitive statuses glow up
// 4: Final activation flash
// 5: Fade out → onComplete

const INIT_LINES = [
  "INITIALIZING CORE SYSTEM...",
  "CONNECTING TO GEMINI INTELLIGENCE LAYER...",
  "LOADING MEMORY ARCHITECTURE...",
  "ACTIVATING TOOL EXECUTION ENGINE...",
  "SYNCING AUTONOMOUS AGENT MODULES...",
  "ESTABLISHING CONTEXT AWARENESS...",
  "ALL SYSTEMS ONLINE",
];

const COGNITIVE_STATUSES = [
  { label: "COGNITIVE CORE", ok: "STABLE" },
  { label: "MEMORY ENGINE", ok: "ACTIVE" },
  { label: "REASONING MODULE", ok: "ONLINE" },
  { label: "PERCEPTION LAYER", ok: "ONLINE" },
];

const TYPING_SPEED = 35;
const LINE_PAUSE = 400;
const STATUS_REVEAL = 600;

// ─── Particle Canvas ───

const useParticleCanvas = (ref, count = 80) => {
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, particles = [], frame;

    const resize = () => { w = canvas.width = innerWidth; h = canvas.height = innerHeight; };
    const init = () => {
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 2 + 0.5, a: Math.random() * 0.4 + 0.1,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      // grid lines
      ctx.strokeStyle = 'rgba(0, 255, 240, 0.03)';
      ctx.lineWidth = 1;
      const step = 60;
      for (let x = 0; x < w; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      // particles
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 240, ${p.a})`;
        ctx.fill();
      });
      // connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 255, 240, ${0.08 * (1 - dist / 150)})`;
            ctx.stroke();
          }
        }
      }
      frame = requestAnimationFrame(draw);
    };

    resize(); init(); draw();
    window.addEventListener('resize', () => { resize(); init(); });
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); };
  }, [ref, count]);
};

// ─── Glitch overlay ───

const GlitchOverlay = ({ active }) => (
  <AnimatePresence>
    {active && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.8, 0.3, 0.6, 0] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(0,255,240,0.1) 0px, transparent 2px, transparent 4px)',
          mixBlendMode: 'overlay',
        }}
      />
    )}
  </AnimatePresence>
);

// ─── Typing Line ───

const TypingLine = ({ text, done, onFinished, speed = TYPING_SPEED }) => {
  const [displayed, setDisplayed] = useState('');
  const idx = useRef(0);

  useEffect(() => {
    if (done) { setDisplayed(text); onFinished?.(); return; }
    idx.current = 0;
    setDisplayed('');
    const iv = setInterval(() => {
      idx.current++;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) { clearInterval(iv); onFinished?.(); /* sfx: ui_beep.mp3 */ }
    }, speed);
    return () => clearInterval(iv);
  }, [text, done, speed]);

  return (
    <span className="relative">
      {displayed}
      {displayed.length < text.length && (
        <span className="inline-block w-[6px] h-[1em] bg-cyan-400 ml-0.5 animate-pulse shadow-[0_0_8px_rgba(0,255,240,0.8)]" />
      )}
    </span>
  );
};

// ─── Glitch Text ───

const GlitchText = ({ children, className = '' }) => (
  <span className={`relative inline-block group ${className}`}>
    <span className="relative z-10">{children}</span>
    <span
      className="absolute inset-0 z-0 text-red-500/40 pointer-events-none"
      style={{ clipPath: 'inset(40% 0 30% 0)', transform: 'translateX(2px)' }}
      aria-hidden
    >
      {children}
    </span>
    <span
      className="absolute inset-0 z-0 text-cyan-300/30 pointer-events-none"
      style={{ clipPath: 'inset(10% 0 70% 0)', transform: 'translateX(-2px)' }}
      aria-hidden
    >
      {children}
    </span>
  </span>
);

// ─── Progress Ring ───

const ProgressRing = ({ progress }) => (
  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(0,255,240,0.1)" strokeWidth="2" />
    <circle
      cx="40" cy="40" r="34" fill="none"
      stroke="url(#progressGrad)" strokeWidth="3"
      strokeLinecap="round"
      strokeDasharray={`${2 * Math.PI * 34}`}
      strokeDashoffset={`${2 * Math.PI * 34 * (1 - Math.min(progress, 1))}`}
      style={{ transition: 'stroke-dashoffset 0.3s ease' }}
    />
    <defs>
      <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#00fff0" />
        <stop offset="100%" stopColor="#0891b2" />
      </linearGradient>
    </defs>
    <text x="40" y="42" textAnchor="middle" fill="#00fff0" fontSize="14" fontFamily="monospace" dy="0">
      {Math.round(progress * 100)}%
    </text>
  </svg>
);

// ─── Main Component ───

const IntroSequence = ({ onComplete }) => {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState(0);
  const [initLineIdx, setInitLineIdx] = useState(0);
  const [linesFinished, setLinesFinished] = useState(0);
  const [progress, setProgress] = useState(0);
  const [cognitiveIdx, setCognitiveIdx] = useState(-1);
  const [showFinal, setShowFinal] = useState(false);
  const hasCompleted = useRef(false);
  const canvasRef = useRef(null);
  const ph = useRef(0);

  useParticleCanvas(canvasRef);

  // ── Phase 0: dark startup (1.5s) → Phase 1 ──
  useEffect(() => {
    if (hasCompleted.current) return;
    const t = setTimeout(() => { ph.current = 1; setPhase(1); /* sfx: system_hum.mp3 loop */ }, 1500);
    return () => clearTimeout(t);
  }, []);

  // When lines finish, advance through remaining phases
  useEffect(() => {
    if (hasCompleted.current) return;
    if (linesFinished < INIT_LINES.length) return;

    // All lines done → phase 2: progress to 100%
    ph.current = 2; setPhase(2);
    const t1 = setTimeout(() => setProgress(0.35), 100);
    const t2 = setTimeout(() => setProgress(0.65), 600);
    const t3 = setTimeout(() => { setProgress(1); /* sfx: digital_glitch.mp3 */ }, 1200);

    // Phase 3: cognitive statuses
    const t4 = setTimeout(() => { ph.current = 3; setPhase(3); setProgress(1); }, 2400);

    // Reveal cognitive statuses one by one
    const t5 = setTimeout(() => setCognitiveIdx(0), 2600);
    const t6 = setTimeout(() => setCognitiveIdx(1), 2600 + STATUS_REVEAL);
    const t7 = setTimeout(() => setCognitiveIdx(2), 2600 + STATUS_REVEAL * 2);
    const t8 = setTimeout(() => { setCognitiveIdx(3); /* sfx: power_up.mp3 */ }, 2600 + STATUS_REVEAL * 3);

    // Phase 4: final activation
    const t9 = setTimeout(() => {
      ph.current = 4; setPhase(4); setShowFinal(true);
      /* sfx: voice_over.mp3 — "System online. Cognitive agent initialized." */
    }, 2600 + STATUS_REVEAL * 4 + 800);

    // Phase 5: fade out
    const t10 = setTimeout(() => {
      ph.current = 5; setPhase(5);
      setTimeout(() => {
        if (!hasCompleted.current) { hasCompleted.current = true; setVisible(false); setTimeout(onComplete, 600); }
      }, 1200);
    }, 2600 + STATUS_REVEAL * 4 + 800 + 2500);

    return () => { [t1, t2, t3, t4, t5, t6, t7, t8, t9, t10].forEach(clearTimeout); };
  }, [linesFinished]);

  const handleLineFinished = useCallback(() => {
    setLinesFinished(prev => prev + 1);
  }, []);

  const handleLineReady = useCallback(() => {
    setInitLineIdx(prev => Math.min(prev + 1, INIT_LINES.length));
  }, []);

  if (!visible) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === 5 ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: 'easeInOut' }}
    >
      {/* Canvas particles */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Scan lines overlay */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none opacity-[0.04]"
        style={{
          background: 'repeating-linear-gradient(0deg, #00fff0 0px, transparent 1px, transparent 3px)',
          backgroundSize: '100% 3px',
        }}
      />

      {/* Scan line sweep */}
      <motion.div
        className="absolute inset-0 z-[2] pointer-events-none opacity-[0.06]"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, #00fff0 50%, transparent 100%)',
          height: '30%',
          top: '-30%',
        }}
        animate={{ top: ['-30%', '130%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />

      {/* Glitch overlay on phase transitions */}
      <GlitchOverlay active={phase === 0} />

      {/* Vignette */}
      <div className="absolute inset-0 z-[3] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.8) 100%)' }}
      />

      {/* ─── Content ─── */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-6 w-full max-w-2xl px-6 pb-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : -10 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <GlitchText>
            <span className="text-3xl font-bold tracking-[0.35em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-cyan-500 drop-shadow-[0_0_20px_rgba(0,255,240,0.5)]">
              A.P.A. V2
            </span>
          </GlitchText>
          <div className="mt-2 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent w-48 mx-auto shadow-[0_0_10px_rgba(0,255,240,0.6)]" />
          <p className="text-[10px] tracking-[0.5em] text-cyan-500/60 mt-2 uppercase">
            Autonomous Personal Agent
          </p>
        </motion.div>

        {/* ─── Phase 1-2: Terminal Lines ─── */}
        <div className="w-full space-y-1.5 min-h-[240px]">
          {INIT_LINES.slice(0, initLineIdx + 1).map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={`font-mono text-sm sm:text-base tracking-wider ${
                i < linesFinished ? 'text-cyan-300' : 'text-cyan-400/80'
              } drop-shadow-[0_0_4px_rgba(0,255,240,0.3)]`}
            >
              <span className="text-cyan-500/50 mr-3">{'>'}</span>
              {i < linesFinished ? (
                <GlitchText>{line}</GlitchText>
              ) : i === linesFinished ? (
                <TypingLine
                  text={line}
                  done={false}
                  onFinished={() => { handleLineFinished(); setTimeout(handleLineReady, LINE_PAUSE); }}
                />
              ) : (
                <span className="opacity-20">{line}</span>
              )}
            </motion.div>
          ))}
        </div>

        {/* ─── Phase 2-3: Progress Ring ─── */}
        {(phase >= 2 && phase < 4) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <ProgressRing progress={progress} />
          </motion.div>
        )}

        {/* ─── Phase 3: Cognitive Statuses ─── */}
        {phase >= 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-2 gap-3 w-full max-w-lg mt-2"
          >
            {COGNITIVE_STATUSES.map((cs, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={cognitiveIdx >= i ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4 }}
                className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-xs sm:text-sm tracking-wider font-mono ${
                  cognitiveIdx >= i
                    ? 'border-cyan-500/30 bg-cyan-500/5 shadow-[0_0_20px_rgba(0,255,240,0.15)]'
                    : 'border-white/5 bg-white/5 opacity-30'
                }`}
              >
                <span className="text-slate-400">{cs.label}</span>
                <span className={`ml-3 font-bold ${
                  cognitiveIdx >= i ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(0,255,240,0.8)]' : 'text-slate-600'
                }`}>
                  {cognitiveIdx >= i ? cs.ok : 'PENDING'}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ─── Phase 4: Final Activation ─── */}
        {showFinal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative mt-4 text-center"
          >
            <motion.div
              className="absolute inset-0 bg-cyan-400/10 blur-3xl rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div className="relative">
              <span className="text-2xl sm:text-3xl font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-cyan-400 to-purple-300 drop-shadow-[0_0_30px_rgba(0,255,240,0.6)]">
                AGENT SYSTEM READY
              </span>
            </div>
            <p className="text-xs tracking-[0.3em] text-cyan-500/40 mt-3 uppercase">
              All cognitive modules are active
            </p>
            {/* pulsing ring */}
            <div className="mt-6 flex justify-center">
              <motion.div
                className="w-16 h-16 rounded-full border border-cyan-400/40"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                className="absolute w-4 h-4 rounded-full bg-cyan-300 mt-6 shadow-[0_0_20px_rgba(0,255,240,0.8)]"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom status bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 1 ? 1 : 0 }}
        className="absolute bottom-6 left-0 right-0 z-10 flex justify-center gap-6 text-[10px] tracking-[0.2em] text-cyan-600/50 font-mono"
      >
        <span>CYBER CORE v2.5</span>
        <span>● {phase >= 3 ? 'ACTIVE' : 'BOOTING'}</span>
        <span>{String(performance.now() / 1000).slice(0, 4)}s</span>
      </motion.div>
    </motion.div>
  );
};

export default IntroSequence;
