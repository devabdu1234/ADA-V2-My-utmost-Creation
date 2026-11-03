import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Pause, Play, Square, Zap, BellRing, History, X } from 'lucide-react';
import { HoloPanel, TypeText } from './Holo';

const fmt = (s) => {
    s = Math.max(0, Math.round(s || 0));
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

const LABEL_COLOR = { on_task: '#34d399', off_task: '#fb7185', uncertain: '#64748b', missing: '#334155' };
const LABEL_NAME = { on_task: 'On task', off_task: 'Off task', uncertain: 'Unsure', missing: 'No data' };

/** Colour-coded strip of every screen check. Click a segment for details. */
export function FocusTimeline({ checks = [], total, elapsed, height = 14 }) {
    const [sel, setSel] = useState(null);
    const end = Math.max(total || 1, elapsed || 0, 1);
    const segs = useMemo(() => checks.map((c, i) => {
        const next = checks[i + 1] ? checks[i + 1].t : (elapsed ?? c.t + 30);
        return { ...c, start: c.t, dur: Math.max(1, next - c.t) };
    }), [checks, elapsed]);
    return (
        <div>
            <div className="relative w-full rounded-sm bg-white/5 overflow-hidden" style={{ height }}>
                {segs.map((s, i) => (
                    <button key={i} onClick={() => setSel(sel === i ? null : i)} title={LABEL_NAME[s.label]}
                        className="absolute top-0 bottom-0 hover:brightness-125"
                        style={{ left: `${(s.start / end) * 100}%`, width: `${(s.dur / end) * 100}%`, background: LABEL_COLOR[s.label] || '#334155', opacity: sel === i ? 1 : 0.75 }} />
                ))}
                {elapsed != null && <div className="absolute top-0 bottom-0 w-px bg-white" style={{ left: `${(elapsed / end) * 100}%` }} />}
            </div>
            {sel != null && segs[sel] && (
                <div className="mt-2 text-[11px] font-mono text-slate-300 grid grid-cols-2 gap-x-3">
                    <span className="text-slate-500">at</span><span>{fmt(segs[sel].t)}</span>
                    <span className="text-slate-500">verdict</span><span style={{ color: LABEL_COLOR[segs[sel].label] }}>{LABEL_NAME[segs[sel].label]}</span>
                    <span className="text-slate-500">p(off-task)</span><span>{segs[sel].p_off ?? '--'}</span>
                    <span className="text-slate-500">confidence</span><span>{segs[sel].confidence ?? '--'}</span>
                    <span className="text-slate-500">app</span><span className="truncate">{segs[sel].app || '--'}</span>
                    <span className="text-slate-500">seen</span><span className="truncate">{segs[sel].reason}</span>
                </div>
            )}
        </div>
    );
}

/** Corner HUD while a session runs: task top-left, countdown bottom-right (Bluey layout). */
export function FocusHUD({ focus, onControl }) {
    if (!focus?.active) return null;
    const total = focus.planned_minutes * 60;
    const pct = Math.min(1, focus.elapsed / total);
    return (
        <>
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="absolute top-4 left-4 z-[30] max-w-[340px]">
                <div className="text-[10px] tracking-[0.3em] text-emerald-300/80 flex items-center gap-2">
                    <Target size={12} /> FOCUS SESSION {focus.dev_mode && <span className="text-amber-300">· DEV ×4</span>}
                </div>
                <div className="text-lg text-white font-medium leading-tight mt-1"><TypeText text={focus.task} /></div>
                <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-slate-400">
                    DRIFT
                    <span className="w-28 h-1 bg-white/10 rounded overflow-hidden">
                        <span className="block h-1 bg-rose-400 transition-all" style={{ width: `${(focus.evidence || 0) * 100}%` }} />
                    </span>
                    {focus.checking && <span className="text-cyan-300 animate-pulse">SCANNING</span>}
                </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="absolute bottom-4 right-4 z-[30] text-right">
                <div className="text-5xl font-light font-mono text-emerald-200 tabular-nums">{fmt(focus.remaining)}</div>
                <div className="w-48 h-0.5 bg-white/10 ml-auto mt-1"><div className="h-0.5 bg-emerald-300" style={{ width: `${pct * 100}%` }} /></div>
                <div className="flex gap-1.5 justify-end mt-2">
                    {focus.paused
                        ? <button className="holo-btn" onClick={() => onControl('resume')}><Play size={13} /> Resume</button>
                        : <button className="holo-btn" onClick={() => onControl('pause')}><Pause size={13} /> Pause</button>}
                    <button className="holo-btn holo-btn-danger" onClick={() => onControl('end')}><Square size={13} /> End</button>
                </div>
            </motion.div>
        </>
    );
}

/** The nudge: speech bubble above the orb + chirp (sound handled in App). */
export function NudgeBubble({ nudge, onClose }) {
    useEffect(() => {
        if (!nudge) return;
        const t = setTimeout(onClose, 12000);
        return () => clearTimeout(t);
    }, [nudge?.id]);
    return (
        <AnimatePresence>
            {nudge && (
                <motion.div key={nudge.id} className="absolute left-1/2 top-[8%] -translate-x-1/2 z-[45]"
                    initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }}>
                    <div className="relative px-5 py-3 rounded-2xl bg-emerald-950/80 border border-emerald-300/40 text-emerald-50 shadow-[0_0_40px_rgba(52,211,153,0.3)] max-w-[420px]">
                        <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] text-emerald-300 mb-1"><BellRing size={12} /> NUDGE</div>
                        <div className="text-sm"><TypeText text={nudge.text} speed={22} /></div>
                        {nudge.point_text && <div className="mt-2 text-[11px] text-emerald-200/80 font-mono">↳ look at: “{nudge.point_text}”</div>}
                        <button onClick={onClose} aria-label="Dismiss" className="absolute top-2 right-2 text-emerald-200/60 hover:text-white"><X size={12} /></button>
                        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-emerald-950/80 border-r border-b border-emerald-300/40" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/** Start a session: task, minutes, dev mode. */
export function FocusLauncher({ open, focus, onStart, onClose, onDevMode, onTestNudge }) {
    const [task, setTask] = useState('');
    const [minutes, setMinutes] = useState(30);
    if (!open) return null;
    return (
        <motion.div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()}>
                <HoloPanel code="FOCUS" accent="emerald" icon={Target} title="New focus session" onClose={onClose} className="w-[440px]">
                    <label className="text-[10px] tracking-[0.2em] text-slate-400">WHAT ARE YOU WORKING ON?</label>
                    <input autoFocus value={task} onChange={(e) => setTask(e.target.value)} placeholder="e.g. Writing my IT project report"
                        onKeyDown={(e) => e.key === 'Enter' && task.trim() && onStart(task, minutes)}
                        className="holo-input mt-1" />
                    <label className="text-[10px] tracking-[0.2em] text-slate-400 mt-4 block">DURATION · {minutes} MIN</label>
                    <input type="range" min={1} max={240} value={minutes} onChange={(e) => setMinutes(+e.target.value)} className="w-full accent-emerald-400" />
                    <div className="flex gap-1.5 mt-1">
                        {[15, 25, 30, 45, 60, 90].map((m) => (
                            <button key={m} onClick={() => setMinutes(m)} className={`holo-chip ${minutes === m ? 'holo-chip-on' : ''}`}>{m}</button>
                        ))}
                    </div>
                    <div className="mt-4 text-[11px] text-slate-400 leading-relaxed">
                        While the session runs, A.P.A looks at your main screen every 30 s and sends a reduced screenshot to Gemini to judge
                        on-task vs off-task. Pause before opening anything private.
                    </div>
                    <div className="flex items-center justify-between mt-4">
                        <label className="flex items-center gap-2 text-xs text-amber-200 cursor-pointer">
                            <input type="checkbox" checked={!!focus?.dev_mode} onChange={(e) => onDevMode(e.target.checked)} className="accent-amber-400" />
                            <Zap size={12} /> Developer mode (×4 clock, 10 s checks)
                        </label>
                        <button className="text-[11px] text-slate-400 hover:text-white underline" onClick={onTestNudge}>Test a nudge</button>
                    </div>
                    <button disabled={!task.trim()} onClick={() => onStart(task, minutes)}
                        className="holo-btn w-full justify-center mt-4 disabled:opacity-40">
                        <Play size={14} /> Start focusing
                    </button>
                </HoloPanel>
            </div>
        </motion.div>
    );
}

/** Past sessions with their timelines. */
export function FocusHistory({ sessions = [] }) {
    if (!sessions.length) return <div className="text-xs text-slate-500">No focus sessions yet.</div>;
    return (
        <div className="space-y-3">
            {[...sessions].reverse().slice(0, 6).map((s) => {
                const on = s.checks.filter((c) => c.label === 'on_task').length;
                const known = s.checks.filter((c) => c.label === 'on_task' || c.label === 'off_task').length;
                return (
                    <div key={s.id}>
                        <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-200 truncate max-w-[60%]">{s.task}</span>
                            <span className="text-slate-500 font-mono">{fmt(s.elapsed)} · {known ? Math.round((on / known) * 100) : '--'}% on · {s.nudges.length} nudge</span>
                        </div>
                        <FocusTimeline checks={s.checks} total={s.planned_minutes * 60} elapsed={s.elapsed} height={8} />
                    </div>
                );
            })}
        </div>
    );
}

export { History as HistoryIcon };
