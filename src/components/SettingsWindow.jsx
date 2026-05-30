import React, { useState, useEffect } from 'react';
import { X, Mail, CheckCircle, Loader } from 'lucide-react';

const TOOLS = [
    { id: 'generate_cad', label: 'Generate CAD' },
    { id: 'run_web_agent', label: 'Web Agent' },
    { id: 'create_directory', label: 'Create Folder' },
    { id: 'write_file', label: 'Write File' },
    { id: 'read_directory', label: 'Read Directory' },
    { id: 'read_file', label: 'Read File' },
    { id: 'create_project', label: 'Create Project' },
    { id: 'switch_project', label: 'Switch Project' },
    { id: 'list_projects', label: 'List Projects' },
    { id: 'list_smart_devices', label: 'List Devices' },
    { id: 'control_light', label: 'Control Light' },
    { id: 'discover_printers', label: 'Discover Printers' },
    { id: 'print_stl', label: 'Print 3D Model' },
    { id: 'iterate_cad', label: 'Iterate CAD' },
    { id: 'list_processes', label: 'List Processes' },
    { id: 'kill_process', label: 'Kill Process' },
    { id: 'system_command', label: 'System Command' },
    { id: 'clear_temp_files', label: 'Clear Temp Files' },
    { id: 'get_system_info', label: 'System Info' },
];

const SettingsWindow = ({
    socket,
    micDevices,
    speakerDevices,
    webcamDevices,
    selectedMicId,
    setSelectedMicId,
    selectedSpeakerId,
    setSelectedSpeakerId,
    selectedWebcamId,
    setSelectedWebcamId,
    cursorSensitivity,
    setCursorSensitivity,
    isCameraFlipped,
    setIsCameraFlipped,
    handleFileUpload,
    onClose
}) => {
    const [permissions, setPermissions] = useState({});
    const [faceAuthEnabled, setFaceAuthEnabled] = useState(false);
    
    // Email Config State
    const [emailConfig, setEmailConfig] = useState({
        email_address: '',
        password: '',
        imap_server: 'imap.gmail.com',
        smtp_server: 'smtp.gmail.com'
    });
    const [emailStatus, setEmailStatus] = useState(null); // 'saving', 'success', 'error', or null

    useEffect(() => {
        // Request initial settings
        socket.emit('get_settings');

        // Listen for updates
        const handleSettings = (settings) => {
            console.log("Received settings:", settings);
            if (settings) {
                if (settings.tool_permissions) setPermissions(settings.tool_permissions);
                if (typeof settings.face_auth_enabled !== 'undefined') {
                    setFaceAuthEnabled(settings.face_auth_enabled);
                    localStorage.setItem('face_auth_enabled', settings.face_auth_enabled);
                }
                if (settings.email_config) {
                    setEmailConfig(prev => ({
                        ...prev,
                        ...settings.email_config,
                        password: '' // Don't overwrite password from server for security
                    }));
                }
            }
        };

        socket.on('settings', handleSettings);

        return () => {
            socket.off('settings', handleSettings);
        };
    }, [socket]);

    const togglePermission = (toolId) => {
        const currentVal = permissions[toolId] !== false; // Default True
        const nextVal = !currentVal;

        // Update local mostly for responsiveness, but socket roundtrip handles truth
        // setPermissions(prev => ({ ...prev, [toolId]: nextVal }));

        // Send update
        socket.emit('update_settings', { tool_permissions: { [toolId]: nextVal } });
    };

    const toggleFaceAuth = () => {
        const newVal = !faceAuthEnabled;
        setFaceAuthEnabled(newVal); // Optimistic Update
        localStorage.setItem('face_auth_enabled', newVal);
        socket.emit('update_settings', { face_auth_enabled: newVal });
    };

    const toggleCameraFlip = () => {
        const newVal = !isCameraFlipped;
        setIsCameraFlipped(newVal);
        socket.emit('update_settings', { camera_flipped: newVal });
    };

    const handleSaveEmail = () => {
        setEmailStatus('saving');
        socket.emit('configure_email', emailConfig);
        // Wait for status message
        setTimeout(() => setEmailStatus(null), 3000);
    };

    return (
        <div className="absolute top-20 right-10 bg-white/10 border border-white/20 p-5 rounded-3xl z-50 w-80 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-5 border-b border-white/10 pb-3 sticky top-0 bg-white/10 z-10 backdrop-blur-md rounded-t-3xl">
                <h2 className="text-cyan-300 font-bold text-sm uppercase tracking-wider">Settings</h2>
                <button onClick={onClose} className="text-slate-300 hover:text-white transition-colors">
                    <X size={18} />
                </button>
            </div>

            <div className="space-y-6 pb-2">
                {/* Authentication Section */}
                <div>
                    <h3 className="text-cyan-300 font-bold mb-3 text-xs uppercase tracking-wider opacity-90">Security</h3>
                    <div className="flex items-center justify-between text-xs bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                        <span className="text-slate-200">Face Authentication</span>
                        <button
                            onClick={toggleFaceAuth}
                            className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${faceAuthEnabled ? 'bg-cyan-500/80' : 'bg-slate-600/50'}`}
                        >
                            <div
                                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 ${faceAuthEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                            />
                        </button>
                    </div>
                </div>

                {/* Microphone Section */}
                <div>
                    <h3 className="text-cyan-300 font-bold mb-2 text-xs uppercase tracking-wider opacity-90">Microphone</h3>
                    <select
                        value={selectedMicId}
                        onChange={(e) => setSelectedMicId(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none transition-all backdrop-blur-sm"
                    >
                        {micDevices.map((device, i) => (
                            <option key={device.deviceId} value={device.deviceId} className="bg-slate-900">
                                {device.label || `Microphone ${i + 1}`}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Speaker Section */}
                <div>
                    <h3 className="text-cyan-300 font-bold mb-2 text-xs uppercase tracking-wider opacity-90">Speaker</h3>
                    <select
                        value={selectedSpeakerId}
                        onChange={(e) => setSelectedSpeakerId(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none transition-all backdrop-blur-sm"
                    >
                        {speakerDevices.map((device, i) => (
                            <option key={device.deviceId} value={device.deviceId} className="bg-slate-900">
                                {device.label || `Speaker ${i + 1}`}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Webcam Section */}
                <div>
                    <h3 className="text-cyan-300 font-bold mb-2 text-xs uppercase tracking-wider opacity-90">Webcam</h3>
                    <select
                        value={selectedWebcamId}
                        onChange={(e) => setSelectedWebcamId(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none transition-all backdrop-blur-sm"
                    >
                        {webcamDevices.map((device, i) => (
                            <option key={device.deviceId} value={device.deviceId} className="bg-slate-900">
                                {device.label || `Camera ${i + 1}`}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Cursor Section */}
                <div>
                    <div className="flex justify-between mb-2">
                        <h3 className="text-cyan-300 font-bold text-xs uppercase tracking-wider opacity-90">Cursor Sensitivity</h3>
                        <span className="text-xs text-cyan-300 font-mono">{cursorSensitivity}x</span>
                    </div>
                    <input
                        type="range"
                        min="1.0"
                        max="5.0"
                        step="0.1"
                        value={cursorSensitivity}
                        onChange={(e) => setCursorSensitivity(parseFloat(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-full appearance-none"
                    />
                </div>

                {/* Gesture Control Section */}
                <div>
                    <h3 className="text-cyan-300 font-bold mb-3 text-xs uppercase tracking-wider opacity-90">Gesture Control</h3>
                    <div className="flex items-center justify-between text-xs bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                        <span className="text-slate-200">Flip Camera Horizontal</span>
                        <button
                            onClick={toggleCameraFlip}
                            className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${isCameraFlipped ? 'bg-cyan-500/80' : 'bg-slate-600/50'}`}
                        >
                            <div
                                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 ${isCameraFlipped ? 'translate-x-5' : 'translate-x-0'}`}
                            />
                        </button>
                    </div>
                </div>

                {/* Tool Permissions Section */}
                <div>
                    <h3 className="text-cyan-300 font-bold mb-3 text-xs uppercase tracking-wider opacity-90">Tool Confirmations</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        {TOOLS.map(tool => {
                            const isRequired = permissions[tool.id] !== false; // Default True
                            return (
                                <div key={tool.id} className="flex items-center justify-between text-xs bg-white/5 p-2.5 rounded-xl border border-white/10 backdrop-blur-sm">
                                    <span className="text-slate-200">{tool.label}</span>
                                    <button
                                        onClick={() => togglePermission(tool.id)}
                                        className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${isRequired ? 'bg-cyan-500/80' : 'bg-slate-600/50'}`}
                                    >
                                        <div
                                            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 ${isRequired ? 'translate-x-5' : 'translate-x-0'}`}
                                        />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Email Configuration Section */}
                <div className="border-t border-white/10 pt-5">
                    <h3 className="text-pink-300 font-bold mb-3 text-xs uppercase tracking-wider flex items-center gap-2">
                        <Mail size={12} /> Email Integration
                    </h3>
                    
                    <div className="space-y-3">
                        <div>
                            <label className="text-[10px] text-slate-300 uppercase block mb-1">Gmail Address</label>
                            <input
                                type="email"
                                value={emailConfig.email_address}
                                onChange={(e) => setEmailConfig({...emailConfig, email_address: e.target.value})}
                                placeholder="your@gmail.com"
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:border-pink-400 focus:ring-1 focus:ring-pink-400/50 outline-none transition-all backdrop-blur-sm"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-300 uppercase block mb-1">App Password</label>
                            <input
                                type="password"
                                value={emailConfig.password}
                                onChange={(e) => setEmailConfig({...emailConfig, password: e.target.value})}
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

                {/* Memory Section */}
                <div className="border-t border-white/10 pt-5">
                    <h3 className="text-cyan-300 font-bold mb-2 text-xs uppercase tracking-wider opacity-90">Memory Data</h3>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] text-slate-300 uppercase">Upload Memory Text</label>
                        <input
                            type="file"
                            accept=".txt"
                            onChange={handleFileUpload}
                            className="text-xs text-slate-300 bg-white/5 border border-white/10 rounded-xl p-3 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-cyan-900/50 file:text-cyan-300 hover:file:bg-cyan-800/50 cursor-pointer backdrop-blur-sm"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsWindow;
