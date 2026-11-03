import React, { Children, createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useAnimationControls } from 'framer-motion';

// Where the orb sits while a summon is on screen (App glides it there).
export const orbAnchor = () => ({ x: window.innerWidth * 0.22, y: window.innerHeight * 0.44 });

const BeamCtx = createContext(() => {});
export const BeamProvider = BeamCtx.Provider;

/**
 * Fly: launches its child out of the orb, docks it with a 3D tilt, then lets it hover.
 * Reports its docked rect so the Stage can draw energy beams back to the orb.
 */
export function Fly({ children, index = 0 }) {
    const ref = useRef(null);
    const controls = useAnimationControls();
    const report = useContext(BeamCtx);
    const [from, setFrom] = useState(null);

    useLayoutEffect(() => {
        const r = ref.current.getBoundingClientRect();
        const o = orbAnchor();
        const f = { x: o.x - (r.left + r.width / 2), y: o.y - (r.top + r.height / 2) };
        setFrom(f);
        controls.set({ x: f.x, y: f.y, scale: 0.04, rotateY: 75, rotateX: 12, opacity: 0, filter: 'blur(14px) brightness(3)' });
        controls.start({
            x: 0, y: 0, scale: 1, rotateY: -9 + index * 4, rotateX: 2, opacity: 1, filter: 'blur(0px) brightness(1)',
            transition: { delay: 0.12 + index * 0.22, type: 'spring', stiffness: 70, damping: 14, mass: 1.1,
                opacity: { duration: 0.25, delay: 0.12 + index * 0.22 }, filter: { duration: 0.6, delay: 0.12 + index * 0.22 } },
        }).then(() => {
            if (!ref.current) return;
            const d = ref.current.getBoundingClientRect();
            report(index, { left: d.left, top: d.top, width: d.width, height: d.height });
        });
        return () => report(index, null);
    }, []);

    return (
        <motion.div ref={ref} animate={controls} style={{ transformStyle: 'preserve-3d', transformOrigin: 'left center' }}
            exit={from ? { x: from.x, y: from.y, scale: 0.04, rotateY: 75, opacity: 0, filter: 'blur(12px) brightness(3)',
                transition: { duration: 0.45, ease: [0.6, 0, 0.9, 0.4], delay: index * 0.06 } } : { opacity: 0 }}>
            <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: 5 + index, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
                className="holo-flicker">
                {children}
            </motion.div>
        </motion.div>
    );
}

/** Lays panels out in a row and launches each one with a stagger. */
export function FlyRow({ children, className = 'flex items-center gap-6' }) {
    return (
        <div className={className} style={{ perspective: 1600 }}>
            {Children.toArray(children).filter(Boolean).map((c, i) => <Fly key={i} index={i}>{c}</Fly>)}
        </div>
    );
}

/** Energy beams from the orb to every docked panel. */
export function Beams({ rects, accent = '#22d3ee' }) {
    const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
    useEffect(() => {
        const r = () => setSize({ w: window.innerWidth, h: window.innerHeight });
        window.addEventListener('resize', r);
        return () => window.removeEventListener('resize', r);
    }, []);
    const o = orbAnchor();
    const list = Object.values(rects).filter(Boolean);
    return (
        <svg className="fixed inset-0 pointer-events-none z-[39]" width={size.w} height={size.h}>
            <defs>
                <linearGradient id="beam" x1="0" x2="1">
                    <stop offset="0" stopColor={accent} stopOpacity="0.9" />
                    <stop offset="1" stopColor={accent} stopOpacity="0.15" />
                </linearGradient>
                <filter id="beamGlow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            {list.map((r, i) => {
                const tx = r.left, ty = r.top + r.height / 2;
                const mx = (o.x + tx) / 2;
                const d = `M ${o.x} ${o.y} C ${mx} ${o.y}, ${mx} ${ty}, ${tx} ${ty}`;
                return (
                    <g key={i} filter="url(#beamGlow)">
                        <motion.path d={d} fill="none" stroke="url(#beam)" strokeWidth="1.5"
                            initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.6 }} />
                        <path d={d} fill="none" stroke={accent} strokeWidth="2.5" strokeDasharray="2 18" className="beam-flow" opacity="0.8" />
                        <circle cx={tx} cy={ty} r="4" fill={accent}><animate attributeName="r" values="3;6;3" dur="1.6s" repeatCount="indefinite" /></circle>
                    </g>
                );
            })}
        </svg>
    );
}
