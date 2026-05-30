import React from 'react';
import { Mic, MicOff, Settings, Power, Video, VideoOff, Hand, Lightbulb, Printer, Globe, Box, Mail } from 'lucide-react';

const ToolsModule = ({
    isConnected,
    isMuted,
    isVideoOn,
    isHandTrackingEnabled,
    isDesktopControl,
    showSettings,
    onTogglePower,
    onToggleMute,
    onToggleVideo,
    onToggleSettings,

    onToggleHand,
    onToggleDesktopControl,
    onToggleKasa,
    showKasaWindow,
    onTogglePrinter,
    showPrinterWindow,
    onToggleCad,
    showCadWindow,
    onToggleBrowser,
    showBrowserWindow,
    onToggleEmail,
    showEmailWindow,
    activeDragElement,

    position,
    onMouseDown
}) => {
    return (
        <div
            id="tools"
            onMouseDown={onMouseDown}
            className={`absolute px-8 py-4 transition-all duration-200 
                        backdrop-blur-2xl bg-white/10 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] rounded-full`}
            style={{
                left: position.x,
                top: position.y,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'auto'
            }}
        >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none mix-blend-overlay rounded-full"></div>

            <div className="flex justify-center gap-6 relative z-10">
                {/* Power Button */}
                <button
                    onClick={onTogglePower}
                    className={`p-3 rounded-full border transition-all duration-300 ${isConnected
                        ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                        } `}
                >
                    <Power size={24} />
                </button>

                {/* Mute Button */}
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

                {/* Video Button */}
                <button
                    onClick={onToggleVideo}
                    className={`p-3 rounded-full border transition-all duration-300 ${isVideoOn
                        ? 'border-purple-400/50 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 shadow-[0_0_15px_rgba(192,132,252,0.3)]'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:border-purple-400/50 hover:text-purple-300'
                        } `}
                >
                    {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
                </button>

                {/* Settings Button */}
                <button
                    onClick={onToggleSettings}
                    className={`p-3 rounded-full border transition-all ${showSettings ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-300' : 'border-white/10 bg-white/5 text-slate-400 hover:border-cyan-400/50 hover:text-cyan-300'
                        } `}
                >
                    <Settings size={24} />
                </button>

                {/* Hand Tracking Toggle */}
                <button
                    onClick={onToggleHand}
                    className={`p-3 rounded-full border transition-all duration-300 ${isHandTrackingEnabled
                        ? 'border-orange-400/50 bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 shadow-[0_0_15px_rgba(251,146,60,0.3)]'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:border-orange-400/50 hover:text-orange-300'
                        } `}
                >
                    <Hand size={24} />
                </button>

                {/* Desktop Control Toggle */}
                <button
                    onClick={onToggleDesktopControl}
                    disabled={!isHandTrackingEnabled}
                    className={`p-3 rounded-full border transition-all duration-300 ${!isHandTrackingEnabled
                        ? 'border-white/5 text-slate-600 cursor-not-allowed'
                        : isDesktopControl
                            ? 'border-rose-400/50 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 shadow-[0_0_15px_rgba(251,113,133,0.3)]'
                            : 'border-white/10 bg-white/5 text-slate-400 hover:border-rose-400/50 hover:text-rose-300'
                        } `}
                    title="Toggle Desktop Control"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                </button>

                {/* Kasa Light Control */}
                <button
                    onClick={onToggleKasa}
                    className={`p-3 rounded-full border transition-all duration-300 ${showKasaWindow
                        ? 'border-amber-400/50 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:border-amber-400/50 hover:text-amber-300'
                        } `}
                >
                    <Lightbulb size={24} />
                </button>

                {/* 3D Printer Control */}
                <button
                    onClick={onTogglePrinter}
                    className={`p-3 rounded-full border transition-all duration-300 ${showPrinterWindow
                        ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:border-emerald-400/50 hover:text-emerald-300'
                        } `}
                >
                    <Printer size={24} />
                </button>

                {/* CAD Agent Toggle */}
                <button
                    onClick={onToggleCad}
                    className={`p-3 rounded-full border transition-all duration-300 ${showCadWindow
                        ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:border-cyan-400/50 hover:text-cyan-300'
                        } `}
                >
                    <Box size={24} />
                </button>

                {/* Web Agent Toggle */}
                <button
                    onClick={onToggleBrowser}
                    className={`p-3 rounded-full border transition-all duration-300 ${showBrowserWindow
                        ? 'border-blue-400/50 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 shadow-[0_0_15px_rgba(96,165,250,0.3)]'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:border-blue-400/50 hover:text-blue-300'
                        } `}
                >
                    <Globe size={24} />
                </button>

                {/* Email Toggle */}
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
