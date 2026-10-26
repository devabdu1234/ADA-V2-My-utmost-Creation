import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MousePointerClick } from 'lucide-react';

const TOOL_LABELS = {
    computer_list_windows: 'listing open windows',
    computer_screenshot: 'looking at the screen',
    computer_screenshot_annotated: 'scanning clickable elements',
    computer_click_text: 'clicking on screen text',
    computer_type: 'typing text',
    computer_key: 'pressing a key',
    computer_hotkey: 'pressing a key combo',
    computer_mouse_click: 'clicking the mouse',
    computer_mouse_move: 'moving the cursor',
    computer_mouse_scroll: 'scrolling',
    computer_mouse_drag: 'dragging',
    computer_focus_window: 'focusing a window',
    computer_minimize_window: 'minimizing a window',
    computer_maximize_window: 'maximizing a window',
    computer_restore_window: 'restoring a window',
    computer_emergency_stop: 'EMERGENCY STOP',
    computer_list_monitors: 'checking display',
    computer_ui_tree: 'reading UI structure',
    computer_find_element: 'locating an element',
    computer_invoke_element: 'invoking an element',
    computer_find_text: 'finding text on screen',
    computer_ocr: 'reading screen text',
    computer_click_text_ocr: 'clicking on screen text',
    computer_batch: 'running an action sequence',
    computer_wait: 'waiting',
    computer_wait_for_text: 'waiting for text on screen',
    computer_wait_for_window: 'waiting for a window',
    computer_element_exists: 'checking element',
    computer_mouse_double_click: 'double-clicking',
    computer_mouse_down: 'pressing mouse down',
    computer_mouse_up: 'releasing mouse',
    computer_key_down: 'holding key',
    computer_key_up: 'releasing key',
    computer_overlay_show: 'showing control banner',
    computer_overlay_hide: 'hiding control banner',
};

const IDLE_MS = 9000;

function label(tool) { return TOOL_LABELS[tool] || tool?.replace('computer_', ''); }

function Corner({ className }) {
    return (
        <motion.div
            className={`absolute w-16 h-16 pointer-events-none ${className}`}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0.55, 0.9, 0.55], scale: 1 }}
            transition={{
                opacity: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
                scale: { duration: 0.5, ease: 'easeOut' },
            }}
        />
    );
}

export default function ControlOverlay({ widgets, socket }) {
    const [events, setEvents] = useState([]);          // newest first
    const [visible, setVisible] = useState(false);
    const seenRef = useRef(new Set());
    const timerRef = useRef(null);
    const [stopping, setStopping] = useState(false);

    // Track admission of new computer-control / screenshot events
    useEffect(() => {
        const rel = widgets.filter(
            (w) => w.type === 'computer_control' || w.type === 'computer_screenshot'
        );
        const fresh = rel.filter((w) => !seenRef.current.has(w.id));
        if (fresh.length === 0) return;
        fresh.forEach((w) => seenRef.current.add(w.id));
        setEvents((prev) => [...fresh.reverse(), ...prev].slice(0, 6));
        setVisible(true);
        setStopping(false);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setVisible(false), IDLE_MS);
    }, [widgets]);

    // Immediate local read of newest event
    const newest = events[0] || null;
    const isStopped = newest?.data?.state === 'stopped';
    const isActive = visible && !isStopped;

    const emergencyStop = () => {
        setStopping(true);
        socket.emit('emergency_stop');
    };

    // Which computer_screenshot thumbnail to show
    const shot = events.find((e) => e.type === 'computer_screenshot');

    return (
        <motion.div
            className="absolute inset-0 z-40 pointer-events-none font-mono"
            initial={false}
            animate={{ opacity: visible ? 1 : 0 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            style={{ visibility: visible ? 'visible' : 'hidden' }}
        >
            {/* Corner brackets */}
            <Corner className="top-[70px] left-5 border-t-2 border-l-2 border-rose-400/60 rounded-tl-lg" />
            <Corner className="top-[70px] right-5 border-t-2 border-r-2 border-rose-400/60 rounded-tr-lg" />
            <Corner className="bottom-6 left-5 border-b-2 border-l-2 border-rose-400/60 rounded-bl-lg" />
            <Corner className="bottom-6 right-5 border-b-2 border-r-2 border-rose-400/60 rounded-br-lg" />

            {/* Rolling scanline */}
            <AnimatePresence>
                {isActive && (
                    <motion.div
                        key="scan"
                        className="absolute left-0 right-0 h-[2px] pointer-events-none"
                        style={{
                            top: '8%',
                            background:
                                'linear-gradient(90deg, transparent, rgba(251,113,133,0.35), transparent)',
                            boxShadow: '0 0 12px rgba(251,113,133,0.25)',
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ top: ['8%', '92%'], opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 4.5, ease: 'linear', repeat: Infinity, repeatType: 'mirror' }}
                    />
                )}
            </AnimatePresence>

            {/* Status pill */}
            <AnimatePresence>
                {isActive && (
                    <motion.div
                        key="pill"
                        className="absolute top-[74px] left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-2.5
                            rounded-full border border-rose-400/30 bg-rose-950/40 backdrop-blur-xl
                            shadow-[0_0_40px_rgba(251,113,133,0.15)]"
                        initial={{ y: -16, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -16, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                    >
                        <motion.span
                            className="w-2.5 h-2.5 rounded-full bg-rose-400"
                            animate={{ opacity: [1, 0.25, 1], scale: [1, 0.8, 1] }}
                            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ boxShadow: '0 0 10px rgba(251,113,133,0.8)' }}
                        />
                        <span className="text-[12px] font-bold tracking-[0.25em] text-rose-100">
                            ADA IS USING THIS COMPUTER
                        </span>
                        <span className="text-[10px] text-rose-200/60 border border-rose-400/20 rounded-lg px-1.5 py-0.5 bg-white/5">
                            {stopping ? 'ENGAGING STOP' : label(newest?.data?.tool) || 'standby'}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* What ADA sees */}
            <AnimatePresence>
                {shot?.data?.image && (
                    <motion.div
                        key="eye"
                        className="absolute right-5 bottom-24 w-[240px] pointer-events-none"
                        initial={{ x: 30, opacity: 0, rotate: 1 }}
                        animate={{ x: 0, opacity: 1, rotate: 0 }}
                        exit={{ x: 30, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                    >
                        <div className="rounded-xl border border-cyan-400/25 bg-black/50 backdrop-blur-xl p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                            <div className="flex items-center justify-between px-1.5 pb-1">
                                <span className="text-[9px] tracking-[0.2em] text-cyan-300/80 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                    WHAT ADA SEES
                                </span>
                                <span className="text-[9px] text-cyan-200/40">LIVE</span>
                            </div>
                            <img
                                src={`data:image/png;base64,${shot.data.image}`}
                                alt="ADA screen view"
                                className="block rounded-lg w-full border border-white/10"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Action ticker */}
            <div className="absolute left-5 bottom-8 space-y-1.5">
                <AnimatePresence>
                    {events
                        .filter((e) => e.type === 'computer_control')
                        .slice(0, 3)
                        .map((e) => {
                            const s = e.data?.state;
                            const col =
                                s === 'active' ? 'text-rose-200' :
                                s === 'done' ? 'text-cyan-200' :
                                s === 'stopped' ? 'text-rose-300' : 'text-rose-400';
                            return (
                                <motion.div
                                    key={e.id}
                                    className={`text-[11px] ${col} bg-black/35 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-1.5`}
                                    initial={{ x: -24, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                >
                                    {s === 'active' && '>> '}
                                    {s === 'done' && 'OK '}
                                    {s === 'failed' && 'ERR '}
                                    {s === 'stopped' && 'STOPPED: '}
                                    {label(e.data?.tool)}
                                    {e.data?.detail && s === 'failed' ? ` - ${e.data.detail}` : ''}
                                </motion.div>
                            );
                        })}
                </AnimatePresence>
            </div>

            {/* Emergency stop */}
            <motion.button
                className="absolute left-1/2 -translate-x-1/2 bottom-7 pointer-events-auto
                    flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-[11px] tracking-[0.3em]
                    border-2 transition-colors"
                style={{
                    borderColor: 'rgba(251,113,133,0.5)',
                    background: 'rgba(25,5,10,0.55)',
                    color: '#fda4af',
                    backdropFilter: 'blur(12px)',
                }}
                whileHover={{
                    borderColor: '#fb7185',
                    background: 'rgba(190,18,60,0.25)',
                    scale: 1.04,
                }}
                whileTap={{ scale: 0.96 }}
                onClick={emergencyStop}
            >
                <MousePointerClick size={14} />
                EMERGENCY STOP
            </motion.button>
        </motion.div>
    );
}
