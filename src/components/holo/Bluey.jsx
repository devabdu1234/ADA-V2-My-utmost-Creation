import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Bluey: A.P.A's googly-eyed blueberry focus buddy (in-app version).
 *  mood: happy | focus | worried | sleepy
 *  say:  text for the speech bubble (null hides it)
 * Eyes follow the mouse; blinks; bounces when it has something to say.
 */
export default function Bluey({ mood = 'happy', say, size = 120, onClick }) {
    const ref = useRef(null);
    const [look, setLook] = useState({ x: 0, y: 0 });
    const [blink, setBlink] = useState(false);

    useEffect(() => {
        const mv = (e) => {
            const r = ref.current?.getBoundingClientRect();
            if (!r) return;
            const dx = e.clientX - (r.left + r.width / 2);
            const dy = e.clientY - (r.top + r.height / 2);
            const d = Math.hypot(dx, dy) || 1;
            const k = Math.min(1, d / 200);
            setLook({ x: (dx / d) * 5 * k, y: (dy / d) * 5 * k });
        };
        window.addEventListener('mousemove', mv);
        let t;
        const loop = () => { setBlink(true); setTimeout(() => setBlink(false), 140); t = setTimeout(loop, 2500 + Math.random() * 3000); };
        t = setTimeout(loop, 2000);
        return () => { window.removeEventListener('mousemove', mv); clearTimeout(t); };
    }, []);

    const sleepy = mood === 'sleepy';
    const eye = (cx) => (
        <g key={cx}>
            {blink || sleepy ? (
                <path d={`M ${cx - 9} 47 Q ${cx} ${sleepy ? 51 : 49} ${cx + 9} 47`} stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
            ) : (
                <>
                    <ellipse cx={cx} cy="46" rx="11" ry="12.5" fill="#fff" stroke="#0a1238" strokeWidth="2" />
                    <circle cx={cx + look.x} cy={46 + look.y} r="5.5" fill="#05070d" />
                    <circle cx={cx + look.x - 2} cy={44 + look.y} r="1.8" fill="#fff" />
                </>
            )}
        </g>
    );
    const mouth = {
        happy: <path d="M 41 64 Q 50 72 59 64" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
        focus: <path d="M 43 66 L 57 66" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />,
        worried: <path d="M 42 69 Q 50 62 58 69" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
        sleepy: <ellipse cx="50" cy="66" rx="3" ry="2.5" fill="#fff" />,
    }[mood] || null;

    return (
        <div className="relative select-none" style={{ width: size, height: size }}>
            <AnimatePresence>
                {say && (
                    <motion.div key={say} className="absolute bottom-[92%] left-[45%] w-[260px] z-10"
                        initial={{ opacity: 0, y: 10, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }}>
                        <div className="relative rounded-2xl bg-[#0a1238]/95 border-2 border-[#5b7bff] px-4 py-2.5 text-[13px] text-white font-sans shadow-[0_0_30px_rgba(91,123,255,0.45)]">
                            {say}
                            <span className="absolute -bottom-2 left-6 w-4 h-4 rotate-45 bg-[#0a1238] border-r-2 border-b-2 border-[#5b7bff]" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <motion.svg ref={ref} viewBox="0 0 100 100" width={size} height={size} onClick={onClick}
                className={onClick ? 'cursor-pointer' : ''}
                animate={say ? { y: [0, -14, 0, -8, 0], rotate: [0, -6, 4, 0] } : { y: [0, -5, 0] }}
                transition={say ? { duration: 0.9 } : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ overflow: 'visible', filter: 'drop-shadow(0 0 14px rgba(91,123,255,0.55))' }}>
                <defs>
                    <radialGradient id="berry" cx="38%" cy="32%" r="75%">
                        <stop offset="0" stopColor="#7f9cff" />
                        <stop offset="0.35" stopColor="#3a63e6" />
                        <stop offset="0.8" stopColor="#1d3aa8" />
                        <stop offset="1" stopColor="#0b1a4a" />
                    </radialGradient>
                </defs>
                <ellipse cx="50" cy="94" rx="24" ry="4" fill="#000" opacity="0.35" />
                <circle cx="50" cy="54" r="38" fill="url(#berry)" />
                <ellipse cx="36" cy="32" rx="9" ry="5" fill="#fff" opacity="0.35" transform="rotate(-25 36 32)" />
                {/* calyx crown */}
                <path d="M50 10 L54 19 L63 17 L57 24 L62 31 L52 27 L50 33 L48 27 L38 31 L43 24 L37 17 L46 19 Z" fill="#0a1238" stroke="#5b7bff" strokeWidth="1.5" strokeLinejoin="round" />
                {eye(37)}{eye(63)}
                <ellipse cx="27" cy="60" rx="6" ry="3.5" fill="#f472b6" opacity="0.8" />
                <ellipse cx="73" cy="60" rx="6" ry="3.5" fill="#f472b6" opacity="0.8" />
                {mouth}
                {mood === 'focus' && <path d="M 28 34 L 44 37 M 72 34 L 56 37" stroke="#0a1238" strokeWidth="3" strokeLinecap="round" />}
            </motion.svg>
        </div>
    );
}
