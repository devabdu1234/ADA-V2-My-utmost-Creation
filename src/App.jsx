import React, { useEffect, useRef, useState, useMemo } from 'react';
import io from 'socket.io-client';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Mic, MicOff, Settings, X, Minus, Square as Maximize, Power, Mail, Target, Send,
    Activity, CloudSun, MapPin, MonitorSmartphone, Check, Loader2, Ban, Sparkles, Eye, Crosshair, FolderOpen,
} from 'lucide-react';

import Orb3D from './components/Orb3D';
import Stage, { ConfirmCard } from './components/holo/Stage';
import { FocusHUD, FocusLauncher, FocusTimeline, FocusHistory, NudgeBubble } from './components/holo/Focus';
import EmailWindow from './components/EmailWindow';
import ComposeWindow from './components/ComposeWindow';
import SettingsWindow from './components/SettingsWindow';
import ErrorBoundary from './ErrorBoundary';
import { sfx } from './sfx';
import { OrbHud, ScreenFrame } from './components/holo/Hud';
import Boot from './components/holo/Boot';
import Bluey from './components/holo/Bluey';

const socket = io('http://localhost:8000');
let ipcRenderer = null;
try {
    ipcRenderer = window.require('electron').ipcRenderer;
} catch (e) {
    console.warn('Electron IPC unavailable (running in a browser):', e.message);
}

const TOOL_META = {
    read_emails: { label: 'Scanning inbox', icon: Mail },
    send_email: { label: 'Sending email', icon: Send },
    get_weather: { label: 'Weather lock', icon: CloudSun },
    show_map: { label: 'Map lock', icon: MapPin },
    gods_eye: { label: "God's eye scan", icon: Eye },
    computer_point: { label: 'Pointing', icon: Crosshair },
    computer_open: { label: 'Opening', icon: FolderOpen },
    start_focus_session: { label: 'Focus session', icon: Target },
    control_focus_session: { label: 'Focus control', icon: Target },
};
const toolMeta = (name) => TOOL_META[name] || (name?.startsWith('computer_')
    ? { label: name.replace('computer_', '').replace(/_/g, ' '), icon: MonitorSmartphone }
    : { label: name, icon: Sparkles });

function StatusChip({ on, label, warn }) {
    return (
        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] tracking-[0.15em] font-mono
            ${on ? 'border-emerald-400/30 text-emerald-200 bg-emerald-400/5' : warn ? 'border-amber-400/30 text-amber-200 bg-amber-400/5' : 'border-rose-400/30 text-rose-200 bg-rose-400/5'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${on ? 'bg-emerald-400' : warn ? 'bg-amber-400' : 'bg-rose-400'} ${on ? 'animate-pulse' : ''}`} />
            {label}
        </span>
    );
}

function DockButton({ icon: Icon, label, onClick, active, tone = 'cyan', disabled }) {
    const tones = {
        cyan: 'text-cyan-200 border-cyan-300/40 bg-cyan-400/10',
        emerald: 'text-emerald-200 border-emerald-300/40 bg-emerald-400/10',
        rose: 'text-rose-200 border-rose-300/40 bg-rose-400/10',
        fuchsia: 'text-fuchsia-200 border-fuchsia-300/40 bg-fuchsia-400/10',
    };
    return (
        <button onClick={onClick} disabled={disabled} title={label} aria-label={label}
            className={`group flex flex-col items-center gap-1 w-16 disabled:opacity-40`}>
            <span className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all group-hover:scale-105
                ${active ? tones[tone] : 'text-slate-300 border-white/10 bg-white/[0.03] group-hover:bg-white/[0.07]'}`}>
                <Icon size={20} />
            </span>
            <span className="text-[10px] tracking-wider text-slate-400 group-hover:text-slate-200">{label}</span>
        </button>
    );
}

function App() {
    const [socketConnected, setSocketConnected] = useState(socket.connected);
    const [isApaReady, setIsApaReady] = useState(false);
    const [isConnected, setIsConnected] = useState(true);   // user wants voice on
    const [isMuted, setIsMuted] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [aiAudioData, setAiAudioData] = useState([0]);
    const [micLevel, setMicLevel] = useState(0);
    const [micDevices, setMicDevices] = useState([]);
    const [speakerDevices, setSpeakerDevices] = useState([]);
    const [selectedMicId, setSelectedMicId] = useState(() => localStorage.getItem('selectedMicId') || '');
    const [selectedSpeakerId, setSelectedSpeakerId] = useState(() => localStorage.getItem('selectedSpeakerId') || '');

    const [widgets, setWidgets] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [computer, setComputer] = useState({ steps: [], shot: null });
    const [confirmQueue, setConfirmQueue] = useState([]);
    const [focus, setFocus] = useState({ active: false });
    const [focusHistory, setFocusHistory] = useState([]);
    const [nudge, setNudge] = useState(null);
    const [blueySay, setBlueySay] = useState(null);
    const [blueyDesktop, setBlueyDesktop] = useState(true);
    const blueyTimer = useRef(null);
    const blueyTalk = (text, ms = 9000) => {
        setBlueySay(text);
        clearTimeout(blueyTimer.current);
        blueyTimer.current = setTimeout(() => setBlueySay(null), ms);
    };
    const [escalationCount, setEscalationCount] = useState(0);

    const [showSettings, setShowSettings] = useState(false);
    const [showInbox, setShowInbox] = useState(false);
    const [showCompose, setShowCompose] = useState(false);
    const [showFocus, setShowFocus] = useState(false);
    const [rightTab, setRightTab] = useState('log');
    const [clock, setClock] = useState(new Date());
    const [booting, setBooting] = useState(true);
    const [mouse, setMouse] = useState({ x: 0, y: 0 });
    useEffect(() => {
        let raf = 0;
        const mv = (e) => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => setMouse({ x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 }));
        };
        window.addEventListener('mousemove', mv);
        return () => window.removeEventListener('mousemove', mv);
    }, []);

    const widgetId = useRef(0);
    const chatEnd = useRef(null);
    const audioCtx = useRef(null);
    const micRaf = useRef(null);
    const micSrc = useRef(null);
    const autoStarted = useRef(false);

    const addMessage = (sender, text) => setMessages((p) => [...p, { sender, text, time: new Date().toLocaleTimeString() }]);
    const pushWidget = (w) => {
        widgetId.current += 1;
        const nw = { id: `w-${widgetId.current}`, ...w };
        setWidgets((prev) => [...prev.filter((x) => x.type !== w.type), nw]);
        return nw;
    };
    const dismissWidget = (id) => setWidgets((prev) => prev.filter((w) => w.id !== id));

    /* ------------------------------------------------------ socket ---- */
    useEffect(() => {
        const t = setInterval(() => setClock(new Date()), 1000);
        socket.on('connect', () => { setSocketConnected(true); socket.emit('get_settings'); socket.emit('focus_history'); setTimeout(() => blueyTalk("Hi! I'm Bluey, your focus buddy. Tap me to start focusing!", 7000), 8200); });
        socket.on('disconnect', () => { setSocketConnected(false); setIsApaReady(false); });
        socket.on('status', (d) => {
            if (d.msg === 'A.P.A Started' || d.msg === 'A.P.A Already Running') setIsApaReady(true);
            else if (d.msg === 'A.P.A Stopped') setIsApaReady(false);
            if (!['Connected to A.P.A Backend'].includes(d.msg)) addMessage('System', d.msg);
        });
        socket.on('audio_data', (d) => setAiAudioData(d.data || [0]));
        socket.on('error', (d) => pushWidget({ type: 'error', data: { title: 'System fault', message: d.msg } }));
        socket.on('transcription', (d) => {
            setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last && last.sender === d.sender) return [...prev.slice(0, -1), { ...last, text: last.text + d.text }];
                return [...prev, { sender: d.sender, text: d.text, time: new Date().toLocaleTimeString() }];
            });
        });
        // Real approval gate (the old UI auto-approved every request).
        socket.on('tool_confirmation_request', (d) => { if (d?.id) { sfx.alert(); setConfirmQueue((q) => [...q, d]); } });
        socket.on('widget_update', (d) => {
            if (!d?.type) return;
            if (d.type === 'task') {
                setTasks((prev) => {
                    const i = prev.findIndex((t) => t.id === d.data.id);
                    const entry = { ...(i >= 0 ? prev[i] : { started: Date.now() }), ...d.data, updated: Date.now() };
                    if (i >= 0) { const n = [...prev]; n[i] = entry; return n; }
                    sfx.blip();
                    return [...prev, entry].slice(-60);
                });
                return;
            }
            if (d.type === 'computer_control') {
                setComputer((c) => {
                    const steps = [...c.steps];
                    const last = steps[steps.length - 1];
                    if (last && last.tool === d.data.tool && last.state === 'active') steps[steps.length - 1] = d.data;
                    else steps.push(d.data);
                    return { ...c, steps: steps.slice(-30) };
                });
                setWidgets((prev) => (prev.some((w) => w.type === 'computer') ? prev : [...prev, { id: `w-c${Date.now()}`, type: 'computer' }]));
                return;
            }
            if (d.type === 'computer_screenshot') { setComputer((c) => ({ ...c, shot: d.data.image })); return; }
            if (d.type === 'focus_nudge') { sfx.chirp(); setNudge({ id: Date.now(), ...d.data }); blueyTalk(d.data.text + (d.data.point_text ? ` Look at: "${d.data.point_text}"` : ''), 12000); return; }
            const w = pushWidget(d);
            if (d.type === 'error') setTimeout(() => dismissWidget(w.id), 15000);
            else sfx.summon();
            if (d.type === 'email_summary') setEscalationCount(d.data?.escalation_count || 0);
        });
        socket.on('focus_state', (d) => setFocus((prev) => {
            if (d.active && !prev.active) blueyTalk(`Focus mode on: ${d.task}. I've got your back!`, 6000);
            if (!d.active && prev.active) blueyTalk('Session done. Nice work!', 6000);
            return d;
        }));
        socket.on('bluey_state', (d) => setBlueyDesktop(!!d.on));
        socket.on('focus_history', (d) => setFocusHistory(d.sessions || []));
        socket.on('focus_ended', (d) => {
            addMessage('System', `Focus session ended (${d.reason}).`);
            socket.emit('focus_history');
        });

        navigator.mediaDevices?.getUserMedia({ audio: true })
            .then((s) => { s.getTracks().forEach((t) => t.stop()); return navigator.mediaDevices.enumerateDevices(); })
            .catch(() => navigator.mediaDevices?.enumerateDevices())
            .then((devs = []) => {
                const ins = devs.filter((d) => d.kind === 'audioinput');
                const outs = devs.filter((d) => d.kind === 'audiooutput');
                setMicDevices(ins);
                setSpeakerDevices(outs);
                const savedMic = localStorage.getItem('selectedMicId');
                if (!(savedMic && ins.some((d) => d.deviceId === savedMic)) && ins.length) setSelectedMicId(ins[0].deviceId);
                const savedSpk = localStorage.getItem('selectedSpeakerId');
                if (!(savedSpk && outs.some((d) => d.deviceId === savedSpk)) && outs.length) setSelectedSpeakerId(outs[0].deviceId);
            });

        return () => {
            clearInterval(t);
            ['connect', 'disconnect', 'status', 'audio_data', 'error', 'transcription', 'tool_confirmation_request',
                'widget_update', 'focus_state', 'focus_history', 'focus_ended', 'bluey_state'].forEach((e) => socket.off(e));
        };
    }, []);

    // Auto-start voice once backend + mic are ready.
    useEffect(() => {
        if (isConnected && socketConnected && micDevices.length > 0 && !autoStarted.current) {
            autoStarted.current = true;
            const idx = micDevices.findIndex((d) => d.deviceId === selectedMicId);
            const dev = micDevices[idx];
            socket.emit('start_audio', { device_index: idx >= 0 ? idx : null, device_name: dev ? dev.label : null, muted: isMuted });
        }
        if (!socketConnected) autoStarted.current = false;
    }, [isConnected, socketConnected, micDevices, selectedMicId]);

    useEffect(() => { if (selectedMicId) localStorage.setItem('selectedMicId', selectedMicId); }, [selectedMicId]);
    useEffect(() => { if (selectedSpeakerId) localStorage.setItem('selectedSpeakerId', selectedSpeakerId); }, [selectedSpeakerId]);
    useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    // Mic level for the orb.
    useEffect(() => {
        if (!selectedMicId || !navigator.mediaDevices) return;
        let stopped = false;
        navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: selectedMicId } } }).then((stream) => {
            if (stopped) return;
            audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
            const an = audioCtx.current.createAnalyser();
            an.fftSize = 64;
            micSrc.current = audioCtx.current.createMediaStreamSource(stream);
            micSrc.current.connect(an);
            const buf = new Uint8Array(an.frequencyBinCount);
            let last = 0;
            const loop = (ts) => {
                an.getByteFrequencyData(buf);
                if (ts - last > 50) { last = ts; setMicLevel(buf.reduce((a, b) => a + b, 0) / buf.length / 255); }
                micRaf.current = requestAnimationFrame(loop);
            };
            micRaf.current = requestAnimationFrame(loop);
        }).catch(() => {});
        return () => {
            stopped = true;
            if (micRaf.current) cancelAnimationFrame(micRaf.current);
            try { micSrc.current?.disconnect(); audioCtx.current?.close(); } catch (e) { /* ignore */ }
        };
    }, [selectedMicId]);

    /* ----------------------------------------------------- actions ---- */
    const togglePower = () => {
        if (isConnected) { socket.emit('stop_audio'); setIsConnected(false); setIsMuted(false); }
        else {
            const idx = micDevices.findIndex((d) => d.deviceId === selectedMicId);
            socket.emit('start_audio', { device_index: idx >= 0 ? idx : null });
            setIsConnected(true); setIsMuted(false);
        }
    };
    const toggleMute = () => {
        if (!isConnected) return;
        socket.emit(isMuted ? 'resume_audio' : 'pause_audio');
        setIsMuted(!isMuted);
    };
    const sendText = (text) => {
        if (!text.trim()) return;
        socket.emit('user_input', { text });
        addMessage('User', text);
    };
    const resolveConfirm = (ok) => {
        const req = confirmQueue[0];
        if (!req) return;
        socket.emit('resolve_confirmation', { id: req.id, confirmed: ok });
        setConfirmQueue((q) => q.slice(1));
    };
    const focusControl = (action) => socket.emit('focus_control', { action });
    const openInbox = () => { setShowInbox(true); socket.emit('fetch_today_emails'); };

    const handleClose = () => {
        const close = () => ipcRenderer?.send('window-close');
        if (socket.connected) { socket.emit('shutdown', {}, close); setTimeout(close, 500); } else close();
    };

    /* ------------------------------------------------------- state ---- */
    const audioAmp = aiAudioData.reduce((a, b) => a + b, 0) / Math.max(1, aiAudioData.length) / 255;
    const mainSummon = widgets.some((w) => ['weather', 'map', 'email_summary', 'computer', 'gods_eye'].includes(w.type));
    const running = tasks.some((t) => t.state === 'running');
    const lastMsg = messages[messages.length - 1];

    let orbState = 'idle';
    if (!socketConnected) orbState = 'offline';
    else if (confirmQueue.length) orbState = 'alert';
    else if (mainSummon) orbState = 'summoning';
    else if (isApaReady && audioAmp > 0.02) orbState = 'speaking';
    else if (running || (lastMsg && lastMsg.sender === 'User')) orbState = 'thinking';
    else if (focus.active && !focus.paused) orbState = 'focus';
    else if (isApaReady && isConnected && !isMuted) orbState = 'listening';

    const orbLevel = orbState === 'speaking' ? Math.min(1, audioAmp * 3) : orbState === 'listening' ? Math.min(1, micLevel * 1.6) : 0;
    const STATE_TEXT = {
        offline: 'BACKEND OFFLINE', idle: isConnected ? 'STANDING BY' : 'VOICE OFF', listening: 'LISTENING',
        thinking: 'PROCESSING', speaking: 'SPEAKING', summoning: 'DISPLAYING', focus: 'GUARDING YOUR FOCUS', alert: 'AWAITING AUTHORISATION',
    };
    const caption = useMemo(() => {
        const m = [...messages].reverse().find((x) => x.sender === 'ADA');
        return m ? m.text.slice(-160) : '';
    }, [messages]);

    /* ------------------------------------------------------ render ---- */
    return (
        <ErrorBoundary>
            <div className="h-screen w-screen overflow-hidden app-bg text-slate-200 font-mono select-none flex flex-col">
                {/* ---------- top bar ---------- */}
                <header className="h-12 shrink-0 flex items-center gap-4 px-4 border-b border-white/5 bg-black/30 backdrop-blur-md" style={{ WebkitAppRegion: 'drag' }}>
                    <span className="text-base font-bold tracking-[0.35em] bg-gradient-to-r from-cyan-200 to-fuchsia-200 bg-clip-text text-transparent">A.P.A</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded border border-white/10 text-slate-500">V2.1</span>
                    <div className="flex gap-2 ml-2">
                        <StatusChip on={socketConnected} label={socketConnected ? 'CORE' : 'CORE OFFLINE'} />
                        <StatusChip on={isApaReady} warn={socketConnected && !isApaReady} label={isApaReady ? (isMuted ? 'VOICE · MUTED' : 'VOICE') : 'VOICE OFF'} />
                        {focus.active && <StatusChip on={!focus.paused} warn={focus.paused} label={focus.paused ? 'FOCUS · PAUSED' : 'FOCUS'} />}
                        {escalationCount > 0 && <StatusChip warn label={`${escalationCount} ESCALATED`} />}
                    </div>
                    <div className="flex-1" />
                    <span className="text-[11px] text-slate-400 tabular-nums">{clock.toLocaleTimeString()}</span>
                    <div className="flex gap-1" style={{ WebkitAppRegion: 'no-drag' }}>
                        <button aria-label="Minimise" title="Minimise" onClick={() => ipcRenderer?.send('window-minimize')} className="p-1.5 rounded hover:bg-white/10 text-slate-300"><Minus size={16} /></button>
                        <button aria-label="Maximise" title="Maximise" onClick={() => ipcRenderer?.send('window-maximize')} className="p-1.5 rounded hover:bg-white/10 text-slate-300"><Maximize size={14} /></button>
                        <button aria-label="Close" title="Close" onClick={handleClose} className="p-1.5 rounded hover:bg-rose-500/20 text-rose-300"><X size={16} /></button>
                    </div>
                </header>

                <div className="flex-1 min-h-0 flex relative">
                    {/* ---------- left: conversation ---------- */}
                    <motion.aside animate={{ width: mainSummon ? 0 : 340, opacity: mainSummon ? 0 : 1, x: mainSummon ? -60 : 0 }} transition={{ type: 'spring', stiffness: 90, damping: 20 }} className="shrink-0 flex flex-col border-r border-white/5 bg-black/20 backdrop-blur-sm overflow-hidden"><div className="w-[340px] h-full flex flex-col">
                        <div className="px-4 py-3 text-[10px] tracking-[0.3em] text-slate-500 border-b border-white/5">CONVERSATION</div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 space-y-3">
                            {messages.length === 0 && (
                                <div className="text-xs text-slate-500 leading-relaxed mt-6">
                                    <div className="text-slate-300 mb-2">Try saying or typing:</div>
                                    {['“Check my emails”', '“Scan flights over Colombo”', '“Any earthquakes today?”', '“Where is the ISS right now?”', '“Open my assingment folder on the Desktop”', '“Point at the Start button”', '“Start Bluey focus mode: writing my report for 45 minutes”'].map((s) => (
                                        <button key={s} onClick={() => sendText(s.replace(/[“”]/g, ''))} className="block w-full text-left px-3 py-2 mb-1.5 rounded-lg border border-white/5 hover:border-cyan-300/30 hover:text-cyan-100 transition-colors">{s}</button>
                                    ))}
                                </div>
                            )}
                            {messages.map((m, i) => (
                                <div key={i} className={m.sender === 'User' ? 'text-right' : ''}>
                                    <div className={`text-[9px] tracking-[0.2em] mb-0.5 ${m.sender === 'ADA' ? 'text-cyan-400/70' : m.sender === 'User' ? 'text-fuchsia-300/70' : 'text-slate-600'}`}>
                                        {m.sender === 'ADA' ? 'A.P.A' : m.sender === 'User' ? 'YOU' : 'SYSTEM'} · {m.time}
                                    </div>
                                    <div className={`inline-block text-[13px] leading-relaxed px-3 py-2 rounded-xl max-w-full text-left font-sans
                                        ${m.sender === 'ADA' ? 'bg-cyan-400/[0.06] border border-cyan-300/10 text-slate-100' : m.sender === 'User' ? 'bg-fuchsia-400/[0.08] border border-fuchsia-300/10 text-slate-100' : 'text-slate-500 text-xs'}`}>
                                        {m.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEnd} />
                        </div>
                        <div className="p-3 border-t border-white/5 flex gap-2">
                            <input value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { sendText(inputValue); setInputValue(''); } }}
                                placeholder={isApaReady ? 'Type a command…' : 'Start voice to chat…'} disabled={!isApaReady}
                                className="holo-input flex-1 disabled:opacity-50" />
                            <button aria-label="Send" title="Send" onClick={() => { sendText(inputValue); setInputValue(''); }} disabled={!isApaReady || !inputValue.trim()}
                                className="px-3 rounded-lg border border-cyan-300/30 text-cyan-200 hover:bg-cyan-400/10 disabled:opacity-30"><Send size={15} /></button>
                        </div>
                    </div></motion.aside>

                    {/* ---------- centre: the orb ---------- */}
                    <main className="flex-1 min-w-0 relative flex flex-col items-center">
                        <ScreenFrame state={orbState} />
                        <motion.div className="flex-1 w-full relative" animate={{ x: mainSummon ? -window.innerWidth * 0.28 : 0 }} transition={{ type: 'spring', stiffness: 60, damping: 16 }}>
                            <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                animate={{ x: mouse.x * 26, y: mouse.y * 18, scale: mainSummon ? 0.72 : 1 }} transition={{ type: 'spring', stiffness: 50, damping: 18 }}>
                                <OrbHud state={orbState} size={Math.round(window.innerHeight * 0.74)} />
                            </motion.div>
                            <motion.div className="absolute inset-0" animate={{ x: mouse.x * -10, y: mouse.y * -8 }} transition={{ type: 'spring', stiffness: 50, damping: 18 }}>
                                <Orb3D state={orbState} level={orbLevel} compact={mainSummon} className="absolute inset-0 orb-fx" />
                            </motion.div>
                            <AnimatePresence><FocusHUD focus={focus} onControl={focusControl} /></AnimatePresence>
                        </motion.div>
                        <motion.div className="shrink-0 text-center -mt-6 mb-3 px-6 z-10" animate={{ x: mainSummon ? -window.innerWidth * 0.28 : 0, opacity: mainSummon ? 0.85 : 1 }} transition={{ type: 'spring', stiffness: 60, damping: 16 }}>
                            <div className={`text-xs tracking-[0.5em] ${orbState === 'offline' ? 'text-rose-300' : orbState === 'alert' ? 'text-amber-300' : 'text-cyan-200'}`}>{STATE_TEXT[orbState]}</div>
                            <div className="h-10 mt-2 text-sm text-slate-300 font-sans max-w-[640px] mx-auto line-clamp-2">
                                {!socketConnected ? 'Start the Python backend (backend/server.py) to bring A.P.A online.' : caption}
                            </div>
                        </motion.div>
                        <motion.div className="absolute left-12 bottom-24 z-[45]" initial={{ opacity: 0, scale: 0.4 }}
                            animate={{ opacity: booting ? 0 : 1, scale: booting ? 0.4 : 1, transition: { delay: booting ? 0 : 0.6, type: 'spring', stiffness: 160, damping: 12 } }}>
                            <Bluey size={110} say={blueySay}
                                mood={nudge && Date.now() - nudge.id < 12000 ? 'worried' : focus.active && !focus.paused ? 'focus' : !socketConnected || !isConnected ? 'sleepy' : 'happy'}
                                onClick={() => (focus.active ? blueyTalk(`${Math.ceil((focus.remaining || 0) / 60)} min left on "${focus.task}". You got this!`, 5000) : setShowFocus(true))} />
                        </motion.div>
                        <nav className="shrink-0 mb-5 z-10 flex gap-2 px-4 py-3 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md">
                            <DockButton icon={Power} label={isConnected ? 'Voice on' : 'Voice off'} onClick={togglePower} active={isConnected} tone="emerald" disabled={!socketConnected} />
                            <DockButton icon={isMuted ? MicOff : Mic} label={isMuted ? 'Muted' : 'Mic'} onClick={toggleMute} active={isConnected && !isMuted} tone={isMuted ? 'rose' : 'cyan'} disabled={!isConnected || !socketConnected} />
                            <DockButton icon={Target} label="Focus" onClick={() => (focus.active ? setRightTab('focus') : setShowFocus(true))} active={focus.active} tone="emerald" disabled={!socketConnected} />
                            <DockButton icon={Mail} label="Inbox" onClick={openInbox} active={showInbox} tone="fuchsia" disabled={!socketConnected} />
                            <DockButton icon={Sparkles} label={blueyDesktop ? 'Bluey on' : 'Bluey off'} active={blueyDesktop} tone="fuchsia" disabled={!socketConnected}
                                onClick={() => { socket.emit('bluey', { on: !blueyDesktop }); setBlueyDesktop(!blueyDesktop); }} />
                            <DockButton icon={Settings} label="Settings" onClick={() => setShowSettings(true)} active={showSettings} />
                        </nav>
                    </main>

                    {/* ---------- right: activity ---------- */}
                    <motion.aside animate={{ width: mainSummon ? 0 : 320, opacity: mainSummon ? 0 : 1, x: mainSummon ? 60 : 0 }} transition={{ type: 'spring', stiffness: 90, damping: 20 }} className="shrink-0 flex flex-col border-l border-white/5 bg-black/20 backdrop-blur-sm overflow-hidden"><div className="w-[320px] h-full flex flex-col">
                        <div className="flex border-b border-white/5">
                            {[['log', 'MISSION LOG', Activity], ['focus', 'FOCUS', Target]].map(([k, l, I]) => (
                                <button key={k} onClick={() => setRightTab(k)}
                                    className={`flex-1 py-3 text-[10px] tracking-[0.25em] flex items-center justify-center gap-1.5 ${rightTab === k ? 'text-cyan-200 border-b border-cyan-300' : 'text-slate-500 hover:text-slate-300'}`}>
                                    <I size={12} /> {l}
                                </button>
                            ))}
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                            {rightTab === 'log' ? (
                                tasks.length === 0 ? <div className="text-xs text-slate-500">Every task A.P.A runs shows up here, live.</div> : (
                                    <div className="space-y-2">
                                        {[...tasks].reverse().map((t) => {
                                            const meta = toolMeta(t.tool);
                                            const I = meta.icon;
                                            return (
                                                <motion.div key={t.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                                    className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <I size={13} className="text-cyan-300/80" />
                                                        <span className="flex-1 capitalize text-slate-200 truncate">{meta.label}</span>
                                                        {t.state === 'running' && <Loader2 size={13} className="animate-spin text-amber-300" />}
                                                        {t.state === 'done' && <Check size={13} className="text-emerald-400" />}
                                                        {t.state === 'denied' && <Ban size={13} className="text-rose-400" />}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                                                        {new Date(t.started).toLocaleTimeString()} · {t.detail || Object.values(t.args || {}).join(' · ') || t.tool}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )
                            ) : (
                                <div className="space-y-5">
                                    {focus.active ? (
                                        <div>
                                            <div className="text-[10px] tracking-[0.25em] text-emerald-300 mb-2">CURRENT · {focus.task}</div>
                                            <FocusTimeline checks={focus.checks} total={focus.planned_minutes * 60} elapsed={focus.elapsed} />
                                            <div className="flex gap-3 mt-2 text-[10px] text-slate-500">
                                                <span><span className="text-emerald-400">■</span> on</span><span><span className="text-rose-400">■</span> off</span><span><span className="text-slate-500">■</span> unsure</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <button onClick={() => setShowFocus(true)} disabled={!socketConnected} className="holo-btn w-full justify-center disabled:opacity-40"><Target size={14} /> Start a focus session</button>
                                    )}
                                    <div>
                                        <div className="text-[10px] tracking-[0.25em] text-slate-500 mb-2">HISTORY</div>
                                        <FocusHistory sessions={focusHistory} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div></motion.aside>

                    {/* ---------- cinematic stage ---------- */}
                    <Stage widgets={widgets} computer={computer} onDismiss={dismissWidget}
                        onOpenInbox={openInbox} onAsk={sendText} onStop={() => socket.emit('emergency_stop')} onResume={() => socket.emit('computer_resume')} />
                </div>

                <div className="fixed inset-0 pointer-events-none z-[150] fx-scanlines" />
                {booting && <Boot coreOnline={socketConnected} onDone={() => setBooting(false)} />}
                <AnimatePresence>{confirmQueue[0] && <ConfirmCard request={confirmQueue[0]} onResolve={resolveConfirm} />}</AnimatePresence>
                <AnimatePresence>
                    {showFocus && <FocusLauncher open focus={focus} onClose={() => setShowFocus(false)}
                        onDevMode={(on) => socket.emit('focus_dev_mode', { on })}
                        onTestNudge={() => socket.emit('focus_test_nudge')}
                        onStart={(task, minutes) => { socket.emit('focus_start', { task, minutes }); setShowFocus(false); setRightTab('focus'); }} />}
                </AnimatePresence>

                {showSettings && (
                    <SettingsWindow socket={socket} micDevices={micDevices} speakerDevices={speakerDevices}
                        selectedMicId={selectedMicId} setSelectedMicId={setSelectedMicId}
                        selectedSpeakerId={selectedSpeakerId} setSelectedSpeakerId={setSelectedSpeakerId}
                        handleFileUpload={() => {}} onClose={() => setShowSettings(false)} />
                )}
                {showInbox && (
                    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60" onClick={() => setShowInbox(false)}>
                        <div onClick={(e) => e.stopPropagation()} className="w-[620px] h-[520px] relative">
                            <EmailWindow socket={socket} onClose={() => setShowInbox(false)} onCompose={() => setShowCompose(true)} />
                        </div>
                    </div>
                )}
                {showCompose && (
                    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60">
                        <ComposeWindow socket={socket} onClose={() => setShowCompose(false)} />
                    </div>
                )}
            </div>
        </ErrorBoundary>
    );
}

export default App;
