import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, AlertTriangle, Loader, Send } from 'lucide-react';

const priorityColors = { High: 'text-rose-300', Medium: 'text-amber-300', Low: 'text-slate-400' };
const sentimentColors = { Positive: 'text-emerald-300', Negative: 'text-rose-300', Neutral: 'text-slate-300' };
const intensityColors = { Mild: 'text-slate-300', Moderate: 'text-amber-300', Severe: 'text-rose-400 font-bold' };

const EmailWindow = ({ socket, onClose, onCompose }) => {
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [escalationCount, setEscalationCount] = useState(0);

    useEffect(() => {
        socket.emit('fetch_today_emails');

        const handleEmails = (data) => {
            setEmails(data.emails || []);
            setEscalationCount(data.escalation_count || 0);
            setLoading(false);
        };

        const handleError = (data) => {
            console.error("Email Error:", data);
            setLoading(false);
            setEmails([]);
        };

        socket.on('today_emails', handleEmails);
        socket.on('email_error', handleError);

        return () => {
            socket.off('today_emails', handleEmails);
            socket.off('email_error', handleError);
        };
    }, []);

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-full bg-white/5 backdrop-blur-2xl rounded-3xl overflow-hidden border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
            <div className="h-12 bg-white/5 border-b border-white/10 flex items-center justify-between px-4 shrink-0 backdrop-blur-md">
                <span className="text-xs font-bold tracking-widest text-cyan-300 flex items-center gap-2">
                    <Mail size={14} /> TODAY'S INBOX
                    {escalationCount > 0 && (
                        <span className="flex items-center gap-1 bg-rose-500/20 border border-rose-500/40 rounded-full px-1.5 py-0.5 animate-pulse">
                            <AlertTriangle size={10} className="text-rose-300" />
                            <span className="text-[9px] font-bold text-rose-200">{escalationCount}</span>
                        </span>
                    )}
                </span>
                <div className="flex items-center gap-2">
                    <button onClick={onCompose} className="flex items-center gap-1 text-[10px] bg-pink-500/15 border border-pink-500/30 text-pink-200 rounded-xl px-2.5 py-1 hover:bg-pink-500/25 transition-colors">
                        <Send size={10} /> Compose
                    </button>
                    <button onClick={onClose} className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">✕</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-cyan-300 gap-2">
                        <Loader className="animate-spin" size={28} />
                        <span className="text-xs">Syncing with server...</span>
                    </div>
                ) : emails.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                        <Mail size={36} className="opacity-30" />
                        <span className="text-xs">No new emails today</span>
                    </div>
                ) : (
                    <AnimatePresence>
                        {emails.map((email, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={`p-4 rounded-2xl border transition-colors backdrop-blur-sm cursor-pointer
                                    ${email.is_escalated ? 'bg-rose-500/10 border-rose-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}
                                    ${selectedEmail === i ? 'border-cyan-400/50 bg-cyan-500/10' : ''}`}
                                onClick={() => setSelectedEmail(selectedEmail === i ? null : i)}
                            >
                                {email.is_escalated && (
                                    <div className="flex items-center gap-1 mb-2 text-[10px] font-bold text-rose-300 uppercase tracking-wider">
                                        <AlertTriangle size={12} /> Escalated
                                    </div>
                                )}
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-xs font-bold text-slate-200 truncate">{email.from}</span>
                                    </div>
                                    <span className="text-[10px] text-cyan-300/60 whitespace-nowrap">{formatTime(email.date)}</span>
                                </div>
                                <div className="text-xs text-cyan-100/80 mb-1 truncate">{email.subject}</div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 ${priorityColors[email.priority] || 'text-slate-400'}`}>
                                        {email.priority}
                                    </span>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 ${sentimentColors[email.sentiment] || 'text-slate-400'}`}>
                                        {email.sentiment}
                                    </span>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 ${intensityColors[email.intensity] || 'text-slate-400'}`}>
                                        {email.intensity}
                                    </span>
                                    {email.confidence < 0.6 && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                            Low Confidence
                                        </span>
                                    )}
                                </div>

                                <AnimatePresence>
                                    {selectedEmail === i && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-3 space-y-2"
                                        >
                                            {email.confidence < 0.6 && (
                                                <div className="flex items-center gap-1.5 text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                                                    <AlertTriangle size={10} />
                                                    <span>Low analysis confidence ({Math.round(email.confidence * 100)}%). Manual review recommended.</span>
                                                </div>
                                            )}
                                            <div className="text-[10px] text-cyan-300/60">Category: {email.category}</div>
                                            <div className="text-[11px] text-slate-300 font-mono leading-relaxed border-t border-white/5 pt-2">
                                                {email.summary || email.body_preview}
                                            </div>
                                            {email.draft_reply && (
                                                <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3">
                                                    <div className="text-[9px] text-cyan-400/60 uppercase tracking-wider mb-1">Draft Reply</div>
                                                    <div className="text-[11px] text-slate-200 leading-relaxed">{email.draft_reply}</div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

export default EmailWindow;