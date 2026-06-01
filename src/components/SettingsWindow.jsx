import React, { useState, useEffect } from 'react';
import { X, Mail, CheckCircle, Loader } from 'lucide-react';

const TOOLS = [
    { id: 'read_emails', label: 'Read Emails' },
    { id: 'send_email', label: 'Send Email' },
];

const SettingsWindow = ({
    socket,
    micDevices = [],
    speakerDevices = [],
    selectedMicId = '',
    setSelectedMicId,
    selectedSpeakerId = '',
    setSelectedSpeakerId,
    handleFileUpload,
    onClose
}) => {
    const [permissions, setPermissions] = useState({});

    const [emailConfig, setEmailConfig] = useState({
        email_address: '',
        password: '',
        imap_server: 'imap.gmail.com',
        smtp_server: 'smtp.gmail.com',
    });

    const [emailStatus, setEmailStatus] = useState('idle');

    useEffect(() => {
        const handleSettings = (settings) => {
            if (settings.tool_permissions) {
                setPermissions(settings.tool_permissions);
            }
            if (settings.email_config) {
                setEmailConfig(settings.email_config);
            }
        };

        if (socket) {
            socket.on('settings_loaded', handleSettings);
            socket.on('settings_updated', handleSettings);
            socket.emit('get_settings');
        }

        return () => {
            if (socket) {
                socket.off('settings_loaded', handleSettings);
                socket.off('settings_updated', handleSettings);
            }
        };
    }, [socket]);

    const togglePermission = (toolId) => {
        const newVal = !permissions[toolId];
        setPermissions(prev => ({ ...prev, [toolId]: newVal }));
        if (socket) {
            socket.emit('update_settings', {
                tool_permissions: { [toolId]: newVal }
            });
        }
    };

    const handleSaveEmail = () => {
        setEmailStatus('saving');
        if (socket) {
            socket.emit('update_settings', { email_config: emailConfig });
        }
        setTimeout(() => setEmailStatus('done'), 1500);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-gradient-to-b from-slate-900/90 to-black/90 border border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-2xl max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/50 backdrop-blur-xl">
                    <span className="text-sm font-bold tracking-widest text-cyan-300">SETTINGS</span>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Tool Permissions */}
                    <div>
                        <h3 className="text-xs font-bold tracking-widest text-cyan-400/80 mb-3">TOOL PERMISSIONS</h3>
                        <div className="space-y-2">
                            {TOOLS.map(tool => (
                                <div key={tool.id} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 border border-white/10">
                                    <span className="text-xs text-slate-300">{tool.label}</span>
                                    <button
                                        onClick={() => togglePermission(tool.id)}
                                        className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${permissions[tool.id] ? 'bg-cyan-500/80' : 'bg-slate-600/50'}`}
                                    >
                                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 ${permissions[tool.id] ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Email Configuration */}
                    <div>
                        <h3 className="text-xs font-bold tracking-widest text-pink-400/80 mb-3">EMAIL CONFIGURATION</h3>
                        <div className="space-y-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-2">
                                <Mail size={12} />
                                <span>University Email (Gmail)</span>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-300 uppercase block mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={emailConfig.email_address}
                                    onChange={(e) => setEmailConfig({ ...emailConfig, email_address: e.target.value })}
                                    placeholder="your@gmail.com"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:border-pink-400 focus:ring-1 focus:ring-pink-400/50 outline-none transition-all backdrop-blur-sm"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-300 uppercase block mb-1">App Password</label>
                                <input
                                    type="password"
                                    value={emailConfig.password}
                                    onChange={(e) => setEmailConfig({ ...emailConfig, password: e.target.value })}
                                    placeholder="16-digit App Password"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:border-pink-400 focus:ring-1 focus:ring-pink-400/50 outline-none transition-all backdrop-blur-sm"
                                />
                                <p className="text-[9px] text-slate-400 mt-1.5">Use Google Account &gt; Security &gt; App Passwords</p>
                            </div>

                            <button
                                onClick={handleSaveEmail}
                                className="w-full mt-2 bg-gradient-to-r from-pink-500/80 to-cyan-500/80 hover:from-pink-500 hover:to-cyan-500 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2 backdrop-blur-sm border border-white/10"
                            >
                                {emailStatus === 'saving' ? <Loader size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                {emailStatus === 'saving' ? 'Connecting...' : 'Connect & Test'}
                            </button>
                        </div>
                    </div>

                    {/* Microphone Selection */}
                    <div>
                        <h3 className="text-xs font-bold tracking-widest text-cyan-400/80 mb-3">AUDIO INPUT</h3>
                        <div className="space-y-2">
                            {micDevices.length === 0 && <p className="text-[10px] text-slate-500">No microphones detected</p>}
                            {micDevices.map((device, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedMicId && setSelectedMicId(device.deviceId)}
                                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs transition-all ${selectedMicId === device.deviceId ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-200' : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'}`}
                                >
                                    {device.label || `Microphone ${i + 1}`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Speaker Selection */}
                    <div>
                        <h3 className="text-xs font-bold tracking-widest text-cyan-400/80 mb-3">AUDIO OUTPUT</h3>
                        <div className="space-y-2">
                            {speakerDevices.length === 0 && <p className="text-[10px] text-slate-500">No speakers detected</p>}
                            {speakerDevices.map((device, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedSpeakerId && setSelectedSpeakerId(device.deviceId)}
                                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs transition-all ${selectedSpeakerId === device.deviceId ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-200' : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'}`}
                                >
                                    {device.label || `Speaker ${i + 1}`}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsWindow;
