import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, AlertTriangle, Star, Loader, ArrowLeft, Clock, User } from 'lucide-react';

const EmailWindow = ({ socket, onClose }) => {
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmail, setSelectedEmail] = useState(null);

    useEffect(() => {
        // Fetch emails on mount
        socket.emit('fetch_today_emails');

        const handleEmails = (data) => {
            setEmails(data.emails);
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
            {/* Header */}
            <div className="h-12 bg-white/5 border-b border-white/10 flex items-center justify-between px-4 shrink-0 backdrop-blur-md">
                <span className="text-xs font-bold tracking-widest text-cyan-300 flex items-center gap-2">
                    <Mail size={14} /> TODAY'S INBOX
                </span>
                <button onClick={onClose} className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">✕</button>
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
                                className={`p-4 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors backdrop-blur-sm ${selectedEmail === i ? 'border-cyan-400/50 bg-cyan-500/10' : ''}`}
                                onClick={() => setSelectedEmail(selectedEmail === i ? null : i)}
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        {email.priority === 'urgent' && <AlertTriangle size={14} className="text-rose-400" />}
                                        <span className="text-xs font-bold text-slate-200 truncate max-w-[150px]">{email.from}</span>
                                    </div>
                                    <span className="text-[10px] text-cyan-300/60 whitespace-nowrap">{formatTime(email.date)}</span>
                                </div>
                                <div className="text-xs text-cyan-100/80 mb-2 truncate">{email.subject}</div>
                                
                                <AnimatePresence>
                                    {selectedEmail === i && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="text-[11px] text-slate-300 font-mono leading-relaxed border-t border-white/5 pt-3 mt-2"
                                        >
                                            {email.body_preview}
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
