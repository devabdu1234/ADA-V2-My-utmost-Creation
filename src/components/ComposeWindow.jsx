import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, X, Loader } from 'lucide-react';

const PRIORITY_OPTIONS = [
    { value: 'normal', label: 'Normal', color: 'border-cyan-400/50 bg-cyan-500/20 text-cyan-300' },
    { value: 'high', label: 'High', color: 'border-rose-400/50 bg-rose-500/20 text-rose-300' },
    { value: 'low', label: 'Low', color: 'border-slate-400/50 bg-slate-500/20 text-slate-300' },
];

const ComposeWindow = ({ socket, onClose }) => {
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [priority, setPriority] = useState('normal');
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState(null);

    const handleSend = () => {
        if (!to.trim() || !subject.trim() || !body.trim()) return;
        setSending(true);
        setResult(null);
        socket.emit('new_email', { to: to.trim(), subject: subject.trim(), body: body.trim(), priority });
    };

    useEffect(() => {
        const handleResult = (data) => {
            setSending(false);
            if (data.error) {
                setResult({ type: 'error', message: data.error });
            } else {
                setResult({ type: 'success', message: data.message || 'Email sent!' });
                setTimeout(onClose, 1500);
            }
        };
        socket.on('email_send_result', handleResult);
        return () => socket.off('email_send_result', handleResult);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col h-full bg-white/5 backdrop-blur-2xl rounded-3xl overflow-hidden border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]"
        >
            <div className="h-12 bg-white/5 border-b border-white/10 flex items-center justify-between px-4 shrink-0 backdrop-blur-md">
                <span className="text-xs font-bold tracking-widest text-pink-300 flex items-center gap-2">
                    <Send size={14} /> COMPOSE
                </span>
                <button onClick={onClose} className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">✕</button>
            </div>

            <div className="flex-1 flex flex-col p-4 gap-3 overflow-y-auto">
                <input
                    type="email"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="To: recipient@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-400 placeholder-slate-500"
                />
                <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Subject:"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-400 placeholder-slate-500"
                />
                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Message body..."
                    rows={6}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-400 placeholder-slate-500 resize-none flex-1"
                />

                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Priority:</span>
                    {PRIORITY_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setPriority(opt.value)}
                            className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                                priority === opt.value ? opt.color : 'border-white/10 text-slate-400 hover:border-white/30'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {result && (
                    <div className={`text-[11px] px-3 py-2 rounded-xl ${
                        result.type === 'error' ? 'bg-rose-500/10 text-rose-200 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/20'
                    }`}>
                        {result.message}
                    </div>
                )}

                <button
                    onClick={handleSend}
                    disabled={sending || !to.trim() || !subject.trim() || !body.trim()}
                    className="w-full py-2.5 text-xs font-semibold bg-pink-500/15 border border-pink-500/30 text-pink-200 rounded-xl hover:bg-pink-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {sending ? <><Loader size={12} className="animate-spin" /> Sending...</> : <><Send size={12} /> Send Email</>}
                </button>
            </div>
        </motion.div>
    );
};

export default ComposeWindow;