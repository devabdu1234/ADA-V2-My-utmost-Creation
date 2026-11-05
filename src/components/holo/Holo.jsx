import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { DecodeText, CountUp } from './Hud';

// Shared accent palette for every cinematic widget.
export const ACCENTS = {
    cyan:    { line: 'rgba(34,211,238,0.85)',  soft: 'rgba(34,211,238,0.12)',  text: 'text-cyan-200',    glow: '0 0 40px rgba(34,211,238,0.25)' },
    violet:  { line: 'rgba(167,139,250,0.85)', soft: 'rgba(167,139,250,0.12)', text: 'text-violet-200',  glow: '0 0 40px rgba(167,139,250,0.25)' },
    fuchsia: { line: 'rgba(240,171,252,0.85)', soft: 'rgba(240,171,252,0.12)', text: 'text-fuchsia-200', glow: '0 0 40px rgba(240,171,252,0.25)' },
    emerald: { line: 'rgba(52,211,153,0.85)',  soft: 'rgba(52,211,153,0.12)',  text: 'text-emerald-200', glow: '0 0 40px rgba(52,211,153,0.25)' },
    rose:    { line: 'rgba(251,113,133,0.9)',  soft: 'rgba(251,113,133,0.14)', text: 'text-rose-200',    glow: '0 0 40px rgba(251,113,133,0.3)' },
    amber:   { line: 'rgba(251,191,36,0.9)',   soft: 'rgba(251,191,36,0.12)',  text: 'text-amber-200',   glow: '0 0 40px rgba(251,191,36,0.25)' },
};

// Panel "boots" in: frame draws, scanline sweeps, then content fades up.
export const panelIn = {
    initial: { opacity: 0, scaleY: 0.02, scaleX: 0.6, filter: 'blur(8px)' },
    animate: {
        opacity: 1, scaleY: 1, scaleX: 1, filter: 'blur(0px)',
        transition: { scaleX: { duration: 0.25 }, scaleY: { duration: 0.35, delay: 0.2, ease: [0.2, 0.9, 0.2, 1] }, opacity: { duration: 0.2 }, filter: { duration: 0.4 } },
    },
    exit: { opacity: 0, scaleY: 0.02, filter: 'blur(6px)', transition: { duration: 0.25 } },
};

export const stagger = (i, base = 0.45) => ({
    initial: { opacity: 0, x: 18 },
    animate: { opacity: 1, x: 0, transition: { delay: base + i * 0.06, duration: 0.3 } },
});

function Corner({ pos, color }) {
    const s = 14;
    const style = { position: 'absolute', width: s, height: s, borderColor: color };
    const map = {
        tl: { top: -1, left: -1, borderTop: '2px solid', borderLeft: '2px solid' },
        tr: { top: -1, right: -1, borderTop: '2px solid', borderRight: '2px solid' },
        bl: { bottom: -1, left: -1, borderBottom: '2px solid', borderLeft: '2px solid' },
        br: { bottom: -1, right: -1, borderBottom: '2px solid', borderRight: '2px solid' },
    };
    return <span style={{ ...style, ...map[pos] }} />;
}

/** Typewriter text, for the little "system narration" lines. */
export function TypeText({ text = '', speed = 18, delay = 0, className = '' }) {
    const [n, setN] = useState(0);
    useEffect(() => {
        setN(0);
        let i = 0;
        let iv;
        const t = setTimeout(() => {
            iv = setInterval(() => { i += 1; setN(i); if (i >= text.length) clearInterval(iv); }, speed);
        }, delay);
        return () => { clearTimeout(t); clearInterval(iv); };
    }, [text, speed, delay]);
    return <span className={className}>{text.slice(0, n)}{n < text.length && <span className="opacity-70">▌</span>}</span>;
}

/**
 * HoloPanel – the frame every cinematic widget lives in.
 *   code   – tiny mono tag (e.g. "GEO-01")
 *   title  – header text
 *   accent – key of ACCENTS
 */
export function HoloPanel({ code, title, subtitle, accent = 'cyan', icon: Icon, onClose, children, className = '', style, bodyClass = 'p-4', right }) {
    const a = ACCENTS[accent] || ACCENTS.cyan;
    return (
        <motion.div variants={panelIn} initial="initial" animate="animate" exit="exit"
            className={`relative holo-panel ${className}`}
            style={{ ...style, borderColor: a.line.replace('0.85', '0.35'), boxShadow: a.glow, transformOrigin: 'center' }}>
            <Corner pos="tl" color={a.line} /><Corner pos="tr" color={a.line} />
            <Corner pos="bl" color={a.line} /><Corner pos="br" color={a.line} />
            <div className="holo-scan" style={{ '--scan': a.line }} />
            {/* frame traces itself on before the body fades up */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                <motion.rect x="0.5" y="0.5" width="99.5%" height="99.5%" fill="none" stroke={a.line} strokeWidth="1.2"
                    initial={{ pathLength: 0, opacity: 1 }} animate={{ pathLength: 1, opacity: 0.0 }}
                    transition={{ pathLength: { duration: 0.7, ease: 'easeInOut' }, opacity: { delay: 0.9, duration: 0.6 } }} />
            </svg>
            <div className="absolute left-0 top-10 bottom-3 w-1.5 holo-ticks pointer-events-none" style={{ '--c': a.line }} />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 holo-blink" style={{ background: a.line }} />
            <div className="absolute inset-0 holo-grid pointer-events-none" />
            <div className="relative flex items-center gap-3 px-4 py-2.5 border-b" style={{ borderColor: a.soft }}>
                {Icon && <Icon size={16} className={a.text} />}
                <div className="flex-1 min-w-0">
                    <div className={`text-[11px] font-bold tracking-[0.25em] uppercase ${a.text} truncate`}><DecodeText text={String(title || '')} delay={250} /></div>
                    {subtitle && <div className="text-[10px] text-slate-400 font-mono truncate"><DecodeText text={String(subtitle)} delay={500} speed={18} /></div>}
                </div>
                {right}
                {code && <span className="text-[9px] font-mono tracking-widest text-slate-500">{code}</span>}
                {onClose && (
                    <button onClick={onClose} aria-label="Close" title="Close"
                        className="p-1 rounded-md text-slate-400 hover:text-rose-300 hover:bg-white/5 transition-colors">
                        <X size={14} />
                    </button>
                )}
            </div>
            <motion.div className={`relative ${bodyClass}`} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.4 } }}>
                {children}
            </motion.div>
        </motion.div>
    );
}

/** Small labelled readout used inside panels. */
export function Readout({ label, value, accent = 'cyan' }) {
    const a = ACCENTS[accent] || ACCENTS.cyan;
    return (
        <div className="px-3 py-2 rounded-md border" style={{ borderColor: a.soft, background: 'rgba(255,255,255,0.02)' }}>
            <div className="text-[9px] tracking-[0.2em] text-slate-500 uppercase">{label}</div>
            <div className={`text-sm font-mono ${a.text}`}>{typeof value === 'number' || /^[\d.\-]+/.test(String(value)) ? <CountUp value={value} decimals={String(value).includes('.') ? 3 : 0} /> : value}</div>
        </div>
    );
}
