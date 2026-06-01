import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CloudSun, AlertTriangle, X, ChevronDown, ChevronUp, Send, Maximize2, MessageSquare } from 'lucide-react';

const widgetVariants = {
    initial: { opacity: 0, y: 60, scale: 0.9, filter: "blur(4px)" },
    animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { type: "spring", stiffness: 300, damping: 25 } },
    exit: { opacity: 0, y: -20, scale: 0.95, filter: "blur(4px)", transition: { duration: 0.2 } }
};

const widgetPositions = {
    email_summary: "bottom-24 right-6",
    weather: "bottom-24 left-6",
    error: "bottom-24 left-1/2 -translate-x-1/2"
};

function EmailWidget({ data, onClose, onSendEmail, onAsk }) {
    const [expanded, setExpanded] = useState(false);
    const emails = data?.emails || [];
    const count = data?.count || 0;
    const display = expanded ? emails : emails.slice(0, 3);

    return (
        <div className="w-[380px] backdrop-blur-2xl bg-white/5 border border-white/20 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay"></div>
            <div className="relative z-10">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/15 rounded-xl border border-cyan-500/30">
                            <Mail size={18} className="text-cyan-300" />
                        </div>
                        <div>
                            <span className="text-sm font-bold text-cyan-200">Today's Email</span>
                            <span className="text-[10px] text-cyan-300/60 block">{count} message{count !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-rose-300 transition-colors">
                        <X size={16} />
                    </button>
                </div>
                <div className="px-3 py-2 max-h-[300px] overflow-y-auto">
                    {display.map((e, i) => (
                        <div key={i} className={`p-3 rounded-2xl mb-1 transition-colors ${e.is_escalated ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-white/5 border border-white/5'}`}>
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    {e.is_escalated && (
                                        <div className="flex items-center gap-1 text-[9px] font-bold text-rose-300 uppercase mb-1">
                                            <AlertTriangle size={10} /> Escalated
                                        </div>
                                    )}
                                    <p className="text-xs font-semibold text-cyan-100 truncate">{e.subject || '(No subject)'}</p>
                                    <p className="text-[10px] text-cyan-300/50 truncate">{e.from}</p>
                                    {e.confidence < 0.6 && (
                                        <span className="inline-block text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 mt-1">Low Confidence</span>
                                    )}
                                </div>
                            </div>
                            {e.summary && (
                                <p className="text-[11px] text-cyan-200/60 mt-1.5 line-clamp-2">{e.summary}</p>
                            )}
                        </div>
                    ))}
                </div>
                {emails.length > 3 && (
                    <button onClick={() => setExpanded(!expanded)} className="w-full py-2 text-[10px] text-cyan-400/60 hover:text-cyan-300 border-t border-white/5 flex items-center justify-center gap-1 transition-colors">
                        {expanded ? <>Show less <ChevronUp size={12} /></> : <>{emails.length - 3} more <ChevronDown size={12} /></>}
                    </button>
                )}
                <div className="flex gap-2 px-4 py-3 border-t border-white/10">
                    <button onClick={() => onSendEmail && onSendEmail()} className="flex-1 py-2 text-[10px] font-semibold bg-pink-500/15 border border-pink-500/30 text-pink-200 rounded-xl hover:bg-pink-500/25 transition-colors flex items-center justify-center gap-1.5">
                        <Send size={12} /> Compose
                    </button>
                    <button onClick={() => onAsk && onAsk("Summarize my emails")} className="flex-1 py-2 text-[10px] font-semibold bg-cyan-500/15 border border-cyan-500/30 text-cyan-200 rounded-xl hover:bg-cyan-500/25 transition-colors flex items-center justify-center gap-1.5">
                        <MessageSquare size={12} /> Ask AI
                    </button>
                </div>
            </div>
        </div>
    );
}

function WeatherWidget({ data, onClose }) {
    if (!data) return null;
    return (
        <div className="w-[320px] backdrop-blur-2xl bg-white/5 border border-white/20 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay"></div>
            <div className="relative z-10">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/15 rounded-xl border border-amber-500/30">
                            <CloudSun size={18} className="text-amber-300" />
                        </div>
                        <div>
                            <span className="text-sm font-bold text-amber-200">Weather</span>
                            <span className="text-[10px] text-amber-300/60 block">{data.city}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-rose-300 transition-colors">
                        <X size={16} />
                    </button>
                </div>
                <div className="p-5 flex items-center gap-5">
                    <div className="text-center">
                        <div className="text-4xl font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{data.temp}°</div>
                        <div className="text-[10px] text-cyan-300/50 mt-1">Feels {data.feels}°</div>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-cyan-100 capitalize">{data.description}</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-[10px] text-cyan-300/60">
                            <span>Humidity: {data.humidity}%</span>
                            <span>Wind: {data.wind}</span>
                        </div>
                    </div>
                </div>
                {data.forecast && data.forecast.length > 0 && (
                    <div className="px-4 pb-4 flex gap-2">
                        {data.forecast.map((d, i) => (
                            <div key={i} className="flex-1 bg-white/5 rounded-xl p-2 text-center border border-white/5">
                                <div className="text-[9px] text-cyan-300/50">{d.date?.slice(-5) || '?'}</div>
                                <div className="text-[10px] text-cyan-100 mt-1 capitalize truncate">{d.desc || '--'}</div>
                                <div className="text-[10px] text-cyan-300/60 mt-0.5">{d.lo}° / {d.hi}°</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ErrorWidget({ data, onClose }) {
    return (
        <div className="w-[360px] backdrop-blur-2xl bg-rose-500/10 border border-rose-500/30 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] overflow-hidden">
            <div className="relative z-10">
                <div className="flex items-center justify-between px-5 py-4 border-b border-rose-500/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-500/20 rounded-xl border border-rose-500/30">
                            <AlertTriangle size={18} className="text-rose-300" />
                        </div>
                        <span className="text-sm font-bold text-rose-200">{data?.title || 'Error'}</span>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-rose-300 transition-colors">
                        <X size={16} />
                    </button>
                </div>
                <div className="p-5">
                    <p className="text-xs text-rose-100/80">{data?.message || 'An unknown error occurred.'}</p>
                    {data?.detail && (
                        <p className="text-[10px] text-rose-300/50 mt-2 p-2 bg-rose-950/30 rounded-xl border border-rose-500/10">{data.detail}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function WidgetContainer({ widgets, onDismiss, onSendEmail, onAsk }) {
    if (!widgets || widgets.length === 0) return null;

    return (
        <div className="fixed inset-0 z-[60] pointer-events-none">
            <AnimatePresence>
                {widgets.map((w) => {
                    const pos = widgetPositions[w.type] || "bottom-24 right-6";
                    return (
                        <motion.div
                            key={w.id}
                            className={`absolute ${pos} pointer-events-auto`}
                            variants={widgetVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            layout
                        >
                            {w.type === 'email_summary' && (
                                <EmailWidget data={w.data} onClose={() => onDismiss(w.id)} onSendEmail={onSendEmail} onAsk={onAsk} />
                            )}
                            {w.type === 'weather' && (
                                <WeatherWidget data={w.data} onClose={() => onDismiss(w.id)} />
                            )}
                            {w.type === 'error' && (
                                <ErrorWidget data={w.data} onClose={() => onDismiss(w.id)} />
                            )}
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
