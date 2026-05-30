import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const SplashScreen = ({ onComplete }) => {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('loading');
    const onCompleteRef = useRef(onComplete);

    // Keep ref updated without resetting effects
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
        let current = 0;
        let interval;
        
        const step = () => {
            if (current >= 100) {
                clearInterval(interval);
                setStatus('ready');
                setTimeout(() => {
                    setStatus('fading');
                    setTimeout(() => {
                        onCompleteRef.current();
                    }, 800);
                }, 600);
                return;
            }
            
            current += current < 30 ? 2 : current < 70 ? 1.5 : 0.8;
            current += Math.random() * 1.5;
            if (current > 100) current = 100;
            
            setProgress(Math.round(current));
        };

        interval = setInterval(step, 50);
        return () => clearInterval(interval);
    }, []); // Empty dependency array prevents reset on re-renders

    if (status === 'done') return null;

    return (
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: status === 'fading' ? 0 : 1 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[200] bg-black flex items-center justify-center overflow-hidden pointer-events-none"
        >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-black to-black"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
            
            <div className="absolute inset-0 opacity-20">
                {Array.from({ length: 12 }, (_, i) => (
                    <motion.div
                        key={`h-${i}`}
                        className="absolute w-full h-px bg-cyan-500/30"
                        style={{ top: `${i * 8.3}%` }}
                        animate={{ opacity: [0.1, 0.4, 0.1] }}
                        transition={{ duration: 3, repeat: Infinity, delay: i * 0.15 }}
                    />
                ))}
            </div>

            <div className="relative z-10 flex flex-col items-center gap-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center"
                >
                    <h1 className="text-5xl font-bold tracking-[0.3em] text-cyan-400 drop-shadow-[0_0_30px_rgba(34,211,238,0.5)]">
                        A.P.A
                    </h1>
                    <p className="text-xs tracking-[0.4em] text-cyan-600 mt-2 uppercase">
                        Autonomous Personal Assistant
                    </p>
                </motion.div>

                <div className="relative w-20 h-20">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(34,211,238,0.1)" strokeWidth="2" />
                        <motion.circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="#22d3ee"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeDasharray="283"
                            strokeDashoffset={283 - (283 * progress) / 100}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-mono font-bold text-cyan-300">{progress}%</span>
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-xs tracking-[0.3em] text-cyan-500/60 uppercase font-mono">
                        {status === 'loading' ? 'Initializing Systems...' : 'Ready'}
                    </p>
                </div>
            </div>

            <div className="absolute top-6 left-6 w-12 h-12 border-l-2 border-t-2 border-cyan-500/30"></div>
            <div className="absolute top-6 right-6 w-12 h-12 border-r-2 border-t-2 border-cyan-500/30"></div>
            <div className="absolute bottom-6 left-6 w-12 h-12 border-l-2 border-b-2 border-cyan-500/30"></div>
            <div className="absolute bottom-6 right-6 w-12 h-12 border-r-2 border-b-2 border-cyan-500/30"></div>
        </motion.div>
    );
};

export default SplashScreen;
