import React from 'react';
import { Mic, MicOff, Settings, Power, Mail } from 'lucide-react';

const ToolsModule = ({
    isConnected,
    isMuted,
    showSettings,
    onTogglePower,
    onToggleMute,
    onToggleSettings,
    onToggleEmail,
    showEmailWindow,
}) => {
    return (
        <div
            id="tools"
            className="px-8 py-4 transition-all duration-200 
                        backdrop-blur-2xl bg-white/10 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] rounded-full"
        >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none mix-blend-overlay rounded-full"></div>

            <div className="flex justify-center gap-6 relative z-10">
                <button
                    onClick={onTogglePower}
                    className={`p-3 rounded-full border transition-all duration-300 ${isConnected
                        ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                        } `}
                >
                    <Power size={24} />
                </button>

                <button
                    onClick={onToggleMute}
                    disabled={!isConnected}
                    className={`p-3 rounded-full border transition-all duration-300 ${!isConnected
                        ? 'border-white/5 text-slate-600 cursor-not-allowed'
                        : isMuted
                            ? 'border-rose-400/50 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 shadow-[0_0_15px_rgba(251,113,133,0.3)]'
                            : 'border-cyan-400/50 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                        } `}
                >
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>

                <button
                    onClick={onToggleSettings}
                    className={`p-3 rounded-full border transition-all ${showSettings ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-300' : 'border-white/10 bg-white/5 text-slate-400 hover:border-cyan-400/50 hover:text-cyan-300'
                        } `}
                >
                    <Settings size={24} />
                </button>

                <button
                    onClick={onToggleEmail}
                    className={`p-3 rounded-full border transition-all duration-300 ${showEmailWindow
                        ? 'border-pink-400/50 bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 shadow-[0_0_15px_rgba(244,114,182,0.3)]'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:border-pink-400/50 hover:text-pink-300'
                        } `}
                >
                    <Mail size={24} />
                </button>
            </div>
        </div>
    );
};

export default ToolsModule;
